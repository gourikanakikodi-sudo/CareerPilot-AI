from django.contrib import admin
from .models import CodingProblem, CodingSubmission


@admin.register(CodingProblem)
class CodingProblemAdmin(admin.ModelAdmin):
    list_display = ('title', 'difficulty', 'company', 'created_at')
    search_fields = ('title', 'company', 'slug')


@admin.register(CodingSubmission)
class CodingSubmissionAdmin(admin.ModelAdmin):
    list_display = ('user', 'problem', 'language', 'status', 'passed_tests', 'total_tests', 'created_at')
