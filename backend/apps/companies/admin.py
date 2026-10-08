from django.contrib import admin
from .models import Company


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'inn', 'industry', 'region', 'client_type', 'manager', 'created_at')
    list_filter = ('industry', 'region', 'client_type')
    search_fields = ('name', 'inn', 'ogrn', 'kpp')
    raw_id_fields = ('manager',)
    readonly_fields = ('created_at', 'updated_at')