# CRM для управления коммерческой недвижимостью (B2B)

CRM-система для автоматизации продаж, ведения клиентской базы и управления воронкой сделок. Реализована по ТЗ: Django REST Framework на бэкенде, React + TypeScript на фронтенде.

## 🚀 Технологии

### Backend
- **Python 3.9** + **Django 4.2 LTS**
- **Django REST Framework** — API
- **Simple JWT** — аутентификация
- **drf-spectacular** — Swagger / OpenAPI
- **django-filter** — фильтрация
- **django-cors-headers** — CORS
- **SQLite** (для разработки) / PostgreSQL (для продакшена)
- **Celery + Redis** (задел на будущее)

### Frontend
- **React 19** + **TypeScript**
- **Vite** — сборка
- **Ant Design 5** — UI-библиотека
- **React Router v7** — навигация
- **Axios** — HTTP-клиент
- **Recharts** — графики
- **Day.js** — работа с датами

## 📋 Возможности

### Модуль «Клиенты»
- Карточка компании с реквизитами (ИНН, КПП, ОГРН, адреса, отрасль, тип)
- Карточка контактов с привязкой к компании и ролью в сделке (ЛПР, влияющий, технический)
- История взаимодействий (автоматическое логирование событий)
- Поиск, фильтрация, сегментация
- Импорт/экспорт CSV

### Модуль «Лиды и Сделки»
- Регистрация лидов из формы сайта, вручную, через API
- Конвертация лида в сделку + компанию + контакт в один клик
- Канбан-доска сделок с 8 этапами воронки
- Смена этапа, вероятности, прогноз закрытия
- Публичный REST endpoint для приёма заявок с сайта

### Модуль «Задачи и Активности»
- Типы задач: звонок, встреча, письмо, КП
- Приоритет, дедлайн, привязка к сделке/компании/контакту
- Фильтры по статусу, типу, приоритету
- Автоматическое логирование изменений через Django signals

### Модуль «Аналитика»
- Дашборд с метриками: активные сделки, сумма, конверсия, задачи, лиды
- Круговая диаграмма по этапам воронки
- Столбчатая диаграмма топ-менеджеров
- Линейный график динамики выигранных сделок

### Модуль «Администрирование»
- Управление пользователями (4 роли: администратор, руководитель, менеджер, маркетолог)
- Разграничение прав доступа
- Django Admin для администраторов
- Глобальный поиск по всем сущностям

## 🏗️ Структура проекта

```
crm-real-estate/
├── backend/                     # Django-приложение
│   ├── apps/
│   │   ├── users/               # Пользователи и роли
│   │   ├── companies/           # Компании (клиенты)
│   │   ├── contacts/            # Контактные лица
│   │   ├── leads/               # Лиды
│   │   ├── deals/               # Сделки
│   │   ├── tasks/               # Задачи
│   │   ├── activities/          # История событий (signals)
│   │   └── analytics/           # Дашборд и поиск
│   ├── config/                  # Настройки Django
│   ├── manage.py
│   └── requirements.txt
├── frontend/                    # React-приложение
│   ├── src/
│   │   ├── api/                 # Axios + интерсепторы
│   │   ├── auth/                # Контекст авторизации
│   │   ├── components/          # Layout, GlobalSearch
│   │   ├── pages/               # Страницы
│   │   ├── types/               # TypeScript-типы
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── README.md
```

## 🚦 Запуск проекта

### Требования
- Python 3.9+
- Node.js 20+
- Git

### Backend

```bash
cd backend

# Виртуальное окружение
py -m venv venv
.\venv\Scripts\Activate.ps1     # Windows PowerShell
# source venv/bin/activate       # macOS/Linux

# Зависимости
py -m pip install -r requirements.txt

# Файл .env (см. .env.example)
# DJANGO_SECRET_KEY=...
# DJANGO_DEBUG=True
# DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Миграции и суперпользователь
py manage.py migrate
py manage.py createsuperuser

# Запуск
py manage.py runserver
```

Backend: http://127.0.0.1:8000/

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173/

## 📚 Документация API

- **Swagger UI:** http://127.0.0.1:8000/api/docs/
- **OpenAPI schema:** http://127.0.0.1:8000/api/schema/

### Основные endpoints

| Метод | URL | Назначение |
|-------|-----|------------|
| POST | `/api/v1/auth/token/` | Получить JWT-токен |
| POST | `/api/v1/auth/token/refresh/` | Обновить access-токен |
| GET | `/api/v1/users/me/` | Текущий пользователь |
| CRUD | `/api/v1/companies/` | Компании |
| GET | `/api/v1/companies/export/` | Экспорт CSV |
| POST | `/api/v1/companies/import/` | Импорт CSV |
| CRUD | `/api/v1/contacts/` | Контакты |
| CRUD | `/api/v1/leads/` | Лиды |
| POST | `/api/v1/leads/{id}/convert/` | Конвертировать лид в сделку |
| CRUD | `/api/v1/deals/` | Сделки |
| PATCH | `/api/v1/deals/{id}/stage/` | Сменить этап |
| CRUD | `/api/v1/tasks/` | Задачи |
| GET | `/api/v1/activities/timeline/` | История по объекту |
| GET | `/api/v1/dashboard/` | Метрики дашборда |
| GET | `/api/v1/search/?q=...` | Глобальный поиск |
| POST | `/api/v1/public/leads/` | **Публичный** приём заявок с сайта |

### Пример: приём заявки с сайта

```bash
curl -X POST http://127.0.0.1:8000/api/v1/public/leads/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Заявка с сайта",
    "company_name": "ООО Ромашка",
    "contact_name": "Иванов И.И.",
    "phone": "+79991234567",
    "email": "ivanov@company.ru",
    "notes": "Интересует поставка"
  }'
```

## 🔐 Роли и доступ

| Роль | Возможности |
|------|-------------|
| **Администратор** | Полный доступ, управление пользователями |
| **Руководитель** | Все сделки, аналитика, задачи |
| **Менеджер** | Свои сделки, клиенты, задачи |
| **Маркетолог** | Лиды, источники, аналитика |

## 📌 Roadmap

- [x] Модуль «Клиенты»
- [x] Модуль «Лиды и Сделки»
- [x] Модуль «Задачи и Активности»
- [x] Модуль «Аналитика»
- [x] Модуль «Администрирование»
- [x] Глобальный поиск
- [x] Публичный API для заявок с сайта
- [ ] Коммерческие предложения (PDF)
- [ ] Telegram-уведомления
- [ ] Интеграция с почтой (IMAP/SMTP)
- [ ] Docker + CI/CD
- [ ] Мобильное приложение

## 📝 Лицензия

Учебный проект. Свободное использование в образовательных целях.