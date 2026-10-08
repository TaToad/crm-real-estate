from django.conf import settings
from django.db import models


class Lead(models.Model):
    SOURCE_CHOICES = [
        ('website', 'Форма на сайте'),
        ('email', 'Email'),
        ('manual', 'Ручной ввод'),
        ('api', 'API'),
        ('referral', 'Рекомендация'),
        ('other', 'Другое'),
    ]

    STATUS_CHOICES = [
        ('new', 'Новый'),
        ('in_progress', 'В работе'),
        ('qualified', 'Квалифицирован'),
        ('rejected', 'Отклонён'),
        ('converted', 'Конвертирован'),
    ]

    title = models.CharField(max_length=255, verbose_name='Название лида')
    source = models.CharField(
        max_length=20, choices=SOURCE_CHOICES, default='manual', verbose_name='Источник'
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='new', verbose_name='Статус'
    )
    contact = models.ForeignKey(
        'contacts.Contact',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='leads',
        verbose_name='Контакт',
    )
    company_name = models.CharField(
        max_length=255, blank=True, verbose_name='Название компании'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='leads',
        verbose_name='Ответственный',
    )
    rejection_reason = models.CharField(
        max_length=255, blank=True, verbose_name='Причина отказа'
    )
    notes = models.TextField(blank=True, verbose_name='Заметки')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Лид'
        verbose_name_plural = 'Лиды'
        ordering = ['-created_at']

    def __str__(self):
        return self.title