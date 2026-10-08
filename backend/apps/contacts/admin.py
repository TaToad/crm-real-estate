from django.contrib import admin
from .models import Contact


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'company', 'position', 'phone_mobile', 'email', 'role_in_deal')
    list_filter = ('role_in_deal',)
    search_fields = ('full_name', 'email', 'phone_mobile', 'phone_work', 'company__name')
    raw_id_fields = ('company',)
    readonly_fields = ('created_at', 'updated_at')