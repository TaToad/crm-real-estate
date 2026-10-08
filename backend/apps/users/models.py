from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Администратор'),
        ('manager', 'Менеджер'),
        ('head', 'Руководитель'),
        ('marketer', 'Маркетолог'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='manager',
        verbose_name='Роль',
    )
    department = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Отдел',
    )

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"