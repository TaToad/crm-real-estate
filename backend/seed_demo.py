import os
import random
from datetime import date, timedelta

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from apps.companies.models import Company
from apps.contacts.models import Contact
from apps.leads.models import Lead
from apps.deals.models import Deal
from apps.tasks.models import Task

User = get_user_model()

PWD = "Demo12345"

users = [
    ("shevchenko", "Сергей", "Шевченко", "head", "Отдел аренды"),
    ("grachev", "Иван", "Грачев", "manager", "Отдел аренды"),
    ("zubritsky", "Савелий", "Зубрицкий", "marketer", "Маркетинг"),
    ("admin_demo", "Анна", "Администратор", "admin", "ИТ-отдел"),
]

created_users = {}
for username, first, last, role, dept in users:
    u, _ = User.objects.get_or_create(
        username=username,
        defaults=dict(first_name=first, last_name=last, email=f"{username}@estate-crm.ru",
                      role=role, department=dept, is_staff=role == "admin", is_superuser=role == "admin"),
    )
    u.set_password(PWD)
    u.save()
    created_users[username] = u

manager = created_users["grachev"]
head = created_users["shevchenko"]
marketer = created_users["zubritsky"]

companies_data = [
    ("ООО «Верста»", "2463128450", "246301001", "it", "Красноярск", "corporate", "Сайт"),
    ("ООО «Сибирь-Логистик»", "2465098712", "246501001", "logistics", "Красноярск", "distributor", "Выставка"),
    ("АО «Квант-Ритейл»", "2467123489", "246701001", "retail", "Красноярск", "retail", "Рекомендация"),
    ("ООО «Красноярск-Строй»", "2464032178", "246401001", "construction", "Красноярск", "corporate", "Холодный звонок"),
    ("ГК «Енисей-Медиа»", "2468099123", "246801001", "services", "Красноярск", "corporate", "Сайт"),
    ("ООО «ТехноПарк Сибирь»", "2463011544", "246301001", "it", "Красноярск", "corporate", "Сайт"),
    ("АО «Агрохолдинг Заря»", "2445012786", "244501001", "manufacturing", "Ачинск", "distributor", "Партнёр"),
    ("ООО «Мед-Сервис»", "2466014332", "246601001", "services", "Красноярск", "corporate", "Рекомендация"),
    ("ООО «Гарант-Право»", "2462011788", "246201001", "services", "Красноярск", "corporate", "Сайт"),
]

companies = []
for name, inn, kpp, industry, region, ctype, source in companies_data:
    c, _ = Company.objects.get_or_create(
        name=name,
        defaults=dict(
            inn=inn, kpp=kpp, industry=industry, region=region, client_type=ctype,
            source=source, manager=manager,
            legal_address=f"660000, г. Красноярск, ул. Ленина, д. {random.randint(1, 90)}",
            actual_address="БЦ «Первая башня», офис 4.{:02d}".format(random.randint(1, 20)),
        ),
    )
    companies.append(c)

contacts_data = [
    ("Шевцова Ольга Петровна", "Финансовый директор", "decision_maker"),
    ("Лаптев Игорь Сергеевич", "Директор по развитию", "decision_maker"),
    ("Николаев Артём Игоревич", "Руководитель отдела закупок", "influencer"),
    ("Сорокина Мария Львовна", "Директор по персоналу", "decision_maker"),
    ("Белов Дмитрий Андреевич", "Главный инженер", "technical"),
    ("Капустина Елена Викторовна", "Коммерческий директор", "decision_maker"),
    ("Гринёв Павел Олегович", "Административный директор", "influencer"),
    ("Зырянова Анна Кирилловна", "Директор филиала", "decision_maker"),
    ("Матвеев Сергей Иванович", "Управляющий партнёр", "decision_maker"),
]

contacts = []
for (full_name, position, role), company in zip(contacts_data, companies):
    ct, _ = Contact.objects.get_or_create(
        company=company, full_name=full_name,
        defaults=dict(
            position=position, role_in_deal=role,
            phone_mobile="+7 (913) {:03d}-{:02d}-{:02d}".format(random.randint(100, 999), random.randint(10, 99), random.randint(10, 99)),
            email="contact{}@example.ru".format(random.randint(10, 99)),
            telegram="@" + full_name.split()[0].lower(),
        ),
    )
    contacts.append(ct)

leads_data = [
    ("Заявка на офис 120 м² в БЦ «Первая башня»", "website", "new"),
    ("Аренда склада 800 м² на Правобережье", "website", "in_progress"),
    ("Помещение под кофейню в ТЦ «Квант»", "manual", "qualified"),
    ("Офис open space для IT-компании", "api", "in_progress"),
    ("Продление аренды на 2027 год", "referral", "new"),
    ("Торговая площадь 60 м², первый этаж", "email", "qualified"),
    ("Коворкинг на 15 рабочих мест", "website", "new"),
    ("Склад класса B, 350 м²", "manual", "rejected"),
]

for title, source, status in leads_data:
    Lead.objects.get_or_create(
        title=title,
        defaults=dict(
            source=source, status=status, company_name=random.choice(companies).name,
            assigned_to=manager, contact=random.choice(contacts),
            rejection_reason="Не устроила ставка аренды" if status == "rejected" else "",
            notes="Заявка обработана в рамках учебного демонстрационного набора данных.",
        ),
    )

stages = [
    ("first_contact", 10, "Первичный контакт"),
    ("needs", 25, "Выявление потребностей"),
    ("offer", 40, "КП"),
    ("negotiation", 60, "Переговоры"),
    ("contract", 80, "Договор"),
    ("payment", 90, "Оплата"),
    ("won", 100, "Успех"),
    ("lost", 0, "Отказ"),
]

deal_titles = [
    "Аренда офиса 240 м², БЦ «Первая башня»",
    "Аренда склада 1 200 м², Правобережный комплекс",
    "Помещение 85 м² под кофейню, ТЦ «Квант»",
    "Аренда офиса 310 м², БЦ «Енисей»",
    "Торговая площадь 120 м², ТЦ «Квант»",
    "Аренда коворкинга, 15 рабочих мест",
    "Склад класса A, 2 000 м²",
    "Офис 150 м², бизнес-центр «Меридиан»",
    "Аренда помещения 400 м² под фитнес-студию",
    "Склад 600 м², улица Пограничников",
]

amounts = [5760000, 8400000, 2040000, 7440000, 2880000, 1080000, 12000000, 3600000, 4800000, 4320000]

for i, (stage, prob, _label) in enumerate(stages):
    company = companies[i % len(companies)]
    Deal.objects.get_or_create(
        title=deal_titles[i],
        defaults=dict(
            company=company, amount=amounts[i], stage=stage, probability=prob,
            close_date=date(2026, 12, 1) + timedelta(days=i * 9),
            manager=manager if i % 2 == 0 else head,
            description="Аренда коммерческого помещения, ставка указана за год.",
        ),
    )

task_titles = [
    ("Позвонить по заявке на офис 120 м²", "call", "high", 1),
    ("Подготовить КП по складу 1 200 м²", "offer", "high", 2),
    ("Встреча с представителем «Квант-Ритейл»", "meeting", "medium", 3),
    ("Отправить договор на согласование", "email", "high", 4),
    ("Показать помещение в БЦ «Енисей»", "meeting", "medium", 5),
    ("Уточнить условия индексации ставки", "call", "low", 6),
    ("Сформировать счёт на оплату", "email", "medium", 7),
    ("Согласовать планировку с главным инженером", "meeting", "low", 8),
    ("Повторный звонок по отклонённой заявке", "call", "low", 9),
    ("Подготовить КП на коворкинг", "offer", "medium", 10),
]

base = date(2026, 11, 11)
for title, ttype, priority, days in task_titles:
    Task.objects.get_or_create(
        title=title,
        defaults=dict(
            type=ttype, priority=priority, status="open",
            deadline=django.utils.timezone.make_aware(
                django.utils.timezone.datetime.combine(base + timedelta(days=days), django.utils.timezone.datetime.min.time())
            ).replace(hour=10 + days % 6),
            user=manager, company=companies[days % len(companies)],
        ),
    )

print("users:", User.objects.count())
print("companies:", Company.objects.count())
print("contacts:", Contact.objects.count())
print("leads:", Lead.objects.count())
print("deals:", Deal.objects.count())
print("tasks:", Task.objects.count())
