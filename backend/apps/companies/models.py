from django.conf import settings
from django.db import models


class Company(models.Model):
    INDUSTRY_CHOICES = [
        ('it', 'IT'),
        ('retail', 'Розница'),
        ('wholesale', 'Оптовая торговля'),
        ('manufacturing', 'Производство'),
        ('services', 'Услуги'),
        ('construction', 'Строительство'),
        ('logistics', 'Логистика'),
        ('other', 'Другое'),
    ]

    CLIENT_TYPE_CHOICES = [
        ('distributor', 'Дистрибьютор'),
        ('retail', 'Розница'),
        ('government', 'Госсектор'),
        ('corporate', 'Корпоративный'),
    ]

    name = models.CharField(max_length=255, verbose_name='Наименование')
    inn = models.CharField(max_length=12, blank=True, verbose_name='ИНН')
    kpp = models.CharField(max_length=9, blank=True, verbose_name='КПП')
    ogrn = models.CharField(max_length=15, blank=True, verbose_name='ОГРН')

    legal_address = models.TextField(blank=True, verbose_name='Юридический адрес')
    actual_address = models.TextField(blank=True, verbose_name='Фактический адрес')

    industry = models.CharField(
        max_length=30, choices=INDUSTRY_CHOICES, blank=True, verbose_name='Отрасль'
    )
    region = models.CharField(max_length=100, blank=True, verbose_name='Регион')
    client_type = models.CharField(
        max_length=20, choices=CLIENT_TYPE_CHOICES, blank=True, verbose_name='Тип клиента'
    )

    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='companies',
        verbose_name='Ответственный менеджер',
    )
    source = models.CharField(max_length=100, blank=True, verbose_name='Источник')
    notes = models.TextField(blank=True, verbose_name='Заметки')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлено')

    class Meta:
        verbose_name = 'Компания'
        verbose_name_plural = 'Компании'
        ordering = ['-created_at']

    def __str__(self):
        return self.name