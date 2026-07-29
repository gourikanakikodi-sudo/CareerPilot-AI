from django.contrib import admin
from .models import SkillGap, LearningRoadmap


@admin.register(SkillGap)
class SkillGapAdmin(admin.ModelAdmin):
    list_display = ('user', 'career', 'priority', 'difficulty', 'created_at')
    search_fields = ('user__email', 'career')


@admin.register(LearningRoadmap)
class LearningRoadmapAdmin(admin.ModelAdmin):
    list_display = ('user', 'career', 'created_at')
    search_fields = ('user__email', 'career')
