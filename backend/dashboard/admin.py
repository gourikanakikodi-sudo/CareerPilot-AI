from django.contrib import admin
from .models import JobApplication


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ('user', 'company', 'role', 'status', 'location', 'applied_date', 'updated_at')
    list_filter = ('status',)
    search_fields = ('company', 'role', 'user__email')
    ordering = ('-updated_at',)
