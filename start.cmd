@echo off
setlocal
title CRM launcher

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start.ps1" %*

if errorlevel 1 (
    echo.
    echo Launch failed. See the message above.
    pause
    exit /b 1
)

exit /b 0
