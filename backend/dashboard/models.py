from django.db import models
from users.models import User


class JobApplication(models.Model):
    STATUS_CHOICES = (
        ('saved', 'Saved'),
        ('applied', 'Applied'),
        ('interview', 'Interview'),
        ('offer', 'Offer'),
        ('rejected', 'Rejected'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='job_applications')
    company = models.CharField(max_length=180)
    role = models.CharField(max_length=180)
    location = models.CharField(max_length=180, blank=True, default='')
    salary_range = models.CharField(max_length=120, blank=True, default='')
    job_url = models.URLField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='saved')
    notes = models.TextField(blank=True, default='')
    source = models.CharField(max_length=80, blank=True, default='')   # e.g. 'job_match', 'manual'
    applied_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.user.email} — {self.role} @ {self.company} [{self.status}]'
