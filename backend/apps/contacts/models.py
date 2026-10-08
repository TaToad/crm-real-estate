from django.db import models


class Contact(models.Model):
    ROLE_CHOICES = [
        ('decision_maker', 'ЛПР'),
        ('influencer', 'Влияющий'),
        ('technical', 'Технический специалист'),
        ('other', 'Другое'),
    ]

    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='contacts',
        verbose_name='Компания',
    )
    full_name = models.CharField(max_length=255, verbose_name='ФИО')
    position = models.CharField(max_length=150, blank=True, verbose_name='Должность')
    phone_mobile = models.CharField(max_length=30, blank=True, verbose_name='Мобильный')
    phone_work = models.CharField(max_length=30, blank=True, verbose_name='Рабочий')
    email = models.EmailField(blank=True, verbose_name='Email')
    telegram = models.CharField(max_length=100, blank=True, verbose_name='Telegram')
    whatsapp = models.CharField(max_length=100, blank=True, verbose_name='WhatsApp')
    role_in_deal = models.CharField(
        max_length=20, choices=ROLE_CHOICES, blank=True, verbose_name='Роль в сделке'
    )
    notes = models.TextField(blank=True, verbose_name='Заметки')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Контакт'
        verbose_name_plural = 'Контакты'
        ordering = ['full_name']

    def __str__(self):
        return f"{self.full_name} ({self.company.name})"