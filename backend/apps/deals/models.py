from django.conf import settings
from django.db import models


class Deal(models.Model):
    STAGE_CHOICES = [
        ('first_contact', 'Первичный контакт'),
        ('needs', 'Выявление потребностей'),
        ('offer', 'КП'),
        ('negotiation', 'Переговоры'),
        ('contract', 'Договор'),
        ('payment', 'Оплата'),
        ('won', 'Успех'),
        ('lost', 'Отказ'),
    ]

    CURRENCY_CHOICES = [
        ('RUB', '₽ Рубль'),
        ('USD', '$ Доллар'),
        ('EUR', '€ Евро'),
    ]

    title = models.CharField(max_length=255, verbose_name='Название сделки')
    lead = models.ForeignKey(
        'leads.Lead',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='deals',
        verbose_name='Лид',
    )
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='deals',
        verbose_name='Компания',
    )
    amount = models.DecimalField(
        max_digits=14, decimal_places=2, default=0, verbose_name='Сумма'
    )
    currency = models.CharField(
        max_length=3, choices=CURRENCY_CHOICES, default='RUB', verbose_name='Валюта'
    )
    stage = models.CharField(
        max_length=20, choices=STAGE_CHOICES, default='first_contact', verbose_name='Этап'
    )
    probability = models.PositiveSmallIntegerField(default=10, verbose_name='Вероятность, %')
    close_date = models.DateField(null=True, blank=True, verbose_name='Прогноз закрытия')
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='deals',
        verbose_name='Менеджер',
    )
    description = models.TextField(blank=True, verbose_name='Описание')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Сделка'
        verbose_name_plural = 'Сделки'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} — {self.amount} {self.currency}"