from django.urls import path
from .views import (
    analytics_summary, dashboard_summary, notifications_summary,
    application_list, application_detail, application_stats,
)

urlpatterns = [
    path('dashboard/', dashboard_summary, name='dashboard_summary'),
    path('analytics/', analytics_summary, name='analytics_summary'),
    path('notifications/', notifications_summary, name='notifications_summary'),
    path('applications/', application_list, name='application_list'),
    path('applications/stats/', application_stats, name='application_stats'),
    path('applications/<int:app_id>/', application_detail, name='application_detail'),
]
