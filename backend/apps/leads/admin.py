from django.contrib import admin
from .models import Lead


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('title', 'source', 'status', 'contact', 'assigned_to', 'created_at')
    list_filter = ('source', 'status')
    search_fields = ('title', 'company_name', 'contact__full_name')
    raw_id_fields = ('contact', 'assigned_to')
    readonly_fields = ('created_at', 'updated_at')