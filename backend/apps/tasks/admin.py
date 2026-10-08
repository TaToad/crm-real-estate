from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'priority', 'status', 'deadline', 'user', 'deal')
    list_filter = ('type', 'priority', 'status')
    search_fields = ('title', 'description')
    raw_id_fields = ('user', 'deal', 'company', 'contact')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'deadline'