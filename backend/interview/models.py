from django.db import models
from users.models import User


class Interview(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interviews')
    role = models.CharField(max_length=120)
    difficulty = models.CharField(max_length=60)
    created_at = models.DateTimeField(auto_now_add=True)


class InterviewQuestion(models.Model):
    interview = models.ForeignKey(Interview, on_delete=models.CASCADE, related_name='questions')
    question = models.TextField()
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class InterviewFeedback(models.Model):
    interview = models.ForeignKey(Interview, on_delete=models.CASCADE, related_name='feedbacks')
    answers = models.TextField(blank=True, default='')
    technical_score = models.IntegerField(default=0)
    communication_score = models.IntegerField(default=0)
    confidence_score = models.IntegerField(default=0)
    problem_solving = models.TextField(blank=True, default='')
    overall_rating = models.IntegerField(default=0)
    suggestions = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
