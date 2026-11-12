param(
    [switch]$Seed,
    [switch]$NoOpen,
    [int]$BackendPort = 8000,
    [int]$FrontendPort = 5173
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root      = Split-Path -Parent $scriptDir
$backend   = Join-Path $root "backend"
$frontend  = Join-Path $root "frontend"
$python    = Join-Path $backend "venv\Scripts\python.exe"

function Write-Step($n, $text) {
    Write-Host ("[{0}/5] {1}" -f $n, $text) -ForegroundColor Cyan
}

function Test-Port($port) {
    return [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}

function Test-CrmBackend($port) {
    try {
        Invoke-WebRequest -Uri "http://127.0.0.1:$port/api/v1/dashboard/" -UseBasicParsing -TimeoutSec 3 | Out-Null
        return $false
    } catch {
        $code = $null
        if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
        if ($code -eq 401) { return $true }
    }
    return $false
}

Write-Host "CRM для управления коммерческой недвижимостью" -ForegroundColor White
Write-Host ""

Write-Step 1 "Проверяю виртуальное окружение Python"
if (-not (Test-Path $python)) {
    $launcher = "py"
    if (-not (Get-Command py -ErrorAction SilentlyContinue)) { $launcher = "python" }
    Write-Host "  Создаю окружение backend\venv ..."
    & $launcher -3 -m venv (Join-Path $backend "venv")
    if (-not (Test-Path $python)) {
        throw "Не удалось создать виртуальное окружение. Проверьте, что установлен Python 3.9+."
    }
}
Write-Host "  OK"

Write-Step 2 "Проверяю зависимости бэкенда"
& $python -c "import django, rest_framework" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Устанавливаю пакеты из requirements.txt (займет пару минут)..."
    & $python -m pip install --upgrade pip
    & $python -m pip install -r (Join-Path $backend "requirements.txt")
    if ($LASTEXITCODE -ne 0) { throw "Не удалось установить зависимости бэкенда." }
}
Write-Host "  OK"

$envFile = Join-Path $backend ".env"
if (-not (Test-Path $envFile) -and (Test-Path (Join-Path $backend ".env.example"))) {
    Copy-Item (Join-Path $backend ".env.example") $envFile
    Write-Host "  Создан файл backend\.env из .env.example" -ForegroundColor Yellow
}

Write-Step 3 "Применяю миграции базы данных"
Push-Location $backend
try {
    & $python manage.py migrate --noinput | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Миграции завершились с ошибкой." }
} finally {
    Pop-Location
}
Write-Host "  OK"

if ($Seed) {
    Write-Host "  Наполняю базу демонстрационными данными (backend\seed_demo.py)..." -ForegroundColor Yellow
    Push-Location $backend
    try { & $python seed_demo.py } finally { Pop-Location }
}

Write-Step 4 "Проверяю фронтенд"
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm не найден. Установите Node.js 20+ и повторите запуск."
}
if (-not (Test-Path (Join-Path $frontend "node_modules"))) {
    Write-Host "  Устанавливаю пакеты фронтенда (npm install)..."
    Push-Location $frontend
    try {
        & npm install
        if ($LASTEXITCODE -ne 0) { throw "npm install завершился с ошибкой." }
    } finally {
        Pop-Location
    }
}
Write-Host "  OK"

Write-Step 5 "Запускаю серверы"

$backendRunning = $false
if (Test-Port $BackendPort) {
    if (Test-CrmBackend $BackendPort) {
        $backendRunning = $true
        Write-Host "  Бэкенд уже запущен на порту $BackendPort, использую его." -ForegroundColor Yellow
    } else {
        $free = 8001..8020 | Where-Object { -not (Test-Port $_) } | Select-Object -First 1
        if (-not $free) { throw "Не удалось найти свободный порт для бэкенда (8001-8020)." }
        Write-Host "  Порт $BackendPort занят другим приложением, бэкенд запускаю на порту $free." -ForegroundColor Yellow
        $BackendPort = $free
    }
}

if (-not $backendRunning) {
    $backendArgs = '/c', "title CRM backend && `"$python`" manage.py runserver 127.0.0.1:$BackendPort --noreload"
    Start-Process -FilePath "cmd.exe" -ArgumentList $backendArgs -WorkingDirectory $backend | Out-Null
}

if (Test-Port $FrontendPort) {
    $free = 5174..5190 | Where-Object { -not (Test-Port $_) } | Select-Object -First 1
    Write-Host "  Порт $FrontendPort занят, фронтенд запускаю на порту $free." -ForegroundColor Yellow
    $FrontendPort = $free
}

$apiUrl = "http://127.0.0.1:$BackendPort/api/v1"
$frontendArgs = '/c', "title CRM frontend && set VITE_API_URL=$apiUrl&& npm run dev -- --port $FrontendPort --host 127.0.0.1"
Start-Process -FilePath "cmd.exe" -ArgumentList $frontendArgs -WorkingDirectory $frontend | Out-Null

Write-Host "  Ожидаю готовности сервисов..."
$backendReady = $false
$frontendReady = $false
for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Milliseconds 1000
    if (-not $backendReady) {
        try {
            Invoke-WebRequest -Uri "http://127.0.0.1:$BackendPort/api/docs/" -UseBasicParsing -TimeoutSec 2 | Out-Null
            $backendReady = $true
        } catch {}
    }
    if (-not $frontendReady) {
        try {
            Invoke-WebRequest -Uri "http://127.0.0.1:$FrontendPort/" -UseBasicParsing -TimeoutSec 2 | Out-Null
            $frontendReady = $true
        } catch {}
    }
    if ($backendReady -and $frontendReady) { break }
}

$frontendUrl = "http://127.0.0.1:$FrontendPort"

if ($backendReady -and $frontendReady) {
    Write-Host ""
    Write-Host "Сайт запущен: $frontendUrl" -ForegroundColor Green
    Write-Host "API:  $apiUrl/" -ForegroundColor Green
    Write-Host "Swagger: http://127.0.0.1:$BackendPort/api/docs/" -ForegroundColor Green
    if (-not $NoOpen) { Start-Process $frontendUrl | Out-Null }
} else {
    Write-Host ""
    if (-not $backendReady) { Write-Host "Бэкенд не ответил на порту $BackendPort." -ForegroundColor Red }
    if (-not $frontendReady) { Write-Host "Фронтенд не ответил на порту $FrontendPort." -ForegroundColor Red }
    Write-Host "Посмотрите окна 'CRM backend' и 'CRM frontend'." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Серверы работают в отдельных окнах. Для остановки закройте эти окна." -ForegroundColor DarkGray
