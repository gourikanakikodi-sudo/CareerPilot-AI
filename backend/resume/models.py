from django.db import models
from users.models import User


class Resume(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resumes')
    file = models.FileField(upload_to='resumes/')
    display_name = models.CharField(max_length=180, blank=True, default='')
    original_filename = models.CharField(max_length=255, blank=True, default='')
    file_size = models.PositiveIntegerField(default=0)
    content_type = models.CharField(max_length=120, blank=True, default='')
    extracted_text = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user.email} - {self.file.name}'


class ResumeAnalysis(models.Model):
    resume = models.OneToOneField(Resume, on_delete=models.CASCADE, related_name='analysis')
    summary = models.TextField(blank=True, default='')
    strengths = models.TextField(blank=True, default='')
    weaknesses = models.TextField(blank=True, default='')
    missing_skills = models.TextField(blank=True, default='')
    grammar_suggestions = models.TextField(blank=True, default='')
    formatting_suggestions = models.TextField(blank=True, default='')
    keyword_suggestions = models.TextField(blank=True, default='')
    project_review = models.TextField(blank=True, default='')
    detailed_report = models.JSONField(default=dict, blank=True)
    section_analysis = models.JSONField(default=list, blank=True)
    keyword_report = models.JSONField(default=dict, blank=True)
    rewritten_examples = models.JSONField(default=list, blank=True)
    resume_rating = models.IntegerField(default=0)
    ats_score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Analysis for {self.resume.id}'
