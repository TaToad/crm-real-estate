from django.conf import settings
from django.db import models


class Activity(models.Model):
    ACTION_CHOICES = [
        ('created', 'Создание'),
        ('updated', 'Изменение'),
        ('deleted', 'Удаление'),
        ('stage_changed', 'Смена этапа'),
        ('call', 'Звонок'),
        ('email', 'Письмо'),
        ('meeting', 'Встреча'),
        ('note', 'Заметка'),
    ]

    object_type = models.CharField(max_length=50, verbose_name='Тип объекта')
    object_id = models.PositiveIntegerField(verbose_name='ID объекта')
    action = models.CharField(
        max_length=30, choices=ACTION_CHOICES, verbose_name='Действие'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='activities',
        verbose_name='Пользователь',
    )
    comment = models.TextField(blank=True, verbose_name='Комментарий')
    meta = models.JSONField(default=dict, blank=True, verbose_name='Доп. данные')
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='Когда')

    class Meta:
        verbose_name = 'Активность'
        verbose_name_plural = 'Активности'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['object_type', 'object_id']),
        ]

    def __str__(self):
        return f"{self.action} {self.object_type}#{self.object_id}"