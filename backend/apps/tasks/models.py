from django.conf import settings
from django.db import models


class Task(models.Model):
    TYPE_CHOICES = [
        ('call', 'Звонок'),
        ('meeting', 'Встреча'),
        ('email', 'Письмо'),
        ('offer', 'Подготовка КП'),
        ('other', 'Другое'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'Низкий'),
        ('medium', 'Средний'),
        ('high', 'Высокий'),
    ]
    STATUS_CHOICES = [
        ('open', 'Открыта'),
        ('done', 'Выполнена'),
        ('cancelled', 'Отменена'),
    ]

    title = models.CharField(max_length=255, verbose_name='Название')
    type = models.CharField(
        max_length=20, choices=TYPE_CHOICES, default='call', verbose_name='Тип'
    )
    priority = models.CharField(
        max_length=10, choices=PRIORITY_CHOICES, default='medium', verbose_name='Приоритет'
    )
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='open', verbose_name='Статус'
    )
    deadline = models.DateTimeField(null=True, blank=True, verbose_name='Дедлайн')

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tasks',
        verbose_name='Исполнитель',
    )
    deal = models.ForeignKey(
        'deals.Deal',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='tasks',
        verbose_name='Сделка',
    )
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='tasks',
        verbose_name='Компания',
    )
    contact = models.ForeignKey(
        'contacts.Contact',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='tasks',
        verbose_name='Контакт',
    )

    description = models.TextField(blank=True, verbose_name='Описание')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Задача'
        verbose_name_plural = 'Задачи'
        ordering = ['deadline', '-created_at']

    def __str__(self):
        return self.title