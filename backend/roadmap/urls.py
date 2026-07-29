from django.urls import path
from .views import skill_gap, learning_roadmap, roadmap_progress, roadmap_complete_week

urlpatterns = [
    path('skill-gap/', skill_gap, name='skill_gap'),
    path('learning-roadmap/', learning_roadmap, name='learning_roadmap'),
    path('learning-roadmap/<int:roadmap_id>/progress/', roadmap_progress, name='roadmap_progress'),
    path('learning-roadmap/<int:roadmap_id>/complete-week/', roadmap_complete_week, name='roadmap_complete_week'),
]
