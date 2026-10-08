from django.contrib import admin
from .models import Activity


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ('object_type', 'object_id', 'action', 'user', 'timestamp')
    list_filter = ('action', 'object_type')
    search_fields = ('object_type', 'comment')
    raw_id_fields = ('user',)
    readonly_fields = ('timestamp',)
    date_hierarchy = 'timestamp'