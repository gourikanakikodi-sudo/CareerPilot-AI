from django.db import models
from users.models import User


class SkillGap(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skill_gaps')
    career = models.CharField(max_length=120)
    current_skills = models.TextField(blank=True, default='')
    required_skills = models.TextField(blank=True, default='')
    missing_skills = models.TextField(blank=True, default='')
    priority = models.TextField(blank=True, default='')
    difficulty = models.TextField(blank=True, default='')
    learning_time = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)


class LearningRoadmap(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='roadmaps')
    career = models.CharField(max_length=120)
    weeks_count = models.PositiveSmallIntegerField(default=8)
    roadmap = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
