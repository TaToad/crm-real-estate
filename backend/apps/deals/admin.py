from django.contrib import admin
from .models import Deal


@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'amount', 'currency', 'stage', 'probability', 'close_date', 'manager')
    list_filter = ('stage', 'currency')
    search_fields = ('title', 'company__name')
    raw_id_fields = ('company', 'lead', 'manager')
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('stage', 'probability')