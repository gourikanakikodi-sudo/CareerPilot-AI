from django.db import models
from users.models import User


class CodingProblem(models.Model):
    DIFFICULTY_CHOICES = (
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    )
    title = models.CharField(max_length=180)
    slug = models.SlugField(unique=True)
    company = models.CharField(max_length=120, blank=True, default='')
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='easy')
    prompt = models.TextField()
    starter_code = models.JSONField(default=dict, blank=True)
    visible_tests = models.JSONField(default=list, blank=True)
    hidden_tests = models.JSONField(default=list, blank=True)
    solution = models.TextField(blank=True, default='')
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class CodingSubmission(models.Model):
    STATUS_CHOICES = (
        ('accepted', 'Accepted'),
        ('wrong_answer', 'Wrong Answer'),
        ('runtime_error', 'Runtime Error'),
        ('unsupported', 'Unsupported'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='coding_submissions')
    problem = models.ForeignKey(CodingProblem, on_delete=models.CASCADE, related_name='submissions')
    language = models.CharField(max_length=40)
    code = models.TextField()
    status = models.CharField(max_length=40, choices=STATUS_CHOICES)
    passed_tests = models.PositiveIntegerField(default=0)
    total_tests = models.PositiveIntegerField(default=0)
    execution_ms = models.PositiveIntegerField(default=0)
    memory_kb = models.PositiveIntegerField(default=0)
    feedback = models.JSONField(default=dict, blank=True)
    bookmarked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.email} - {self.problem.slug} - {self.status}'
