from django.contrib import admin
from .models import Interview, InterviewFeedback, InterviewQuestion


@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'role', 'difficulty', 'created_at')
    search_fields = ('user__email', 'role')


@admin.register(InterviewQuestion)
class InterviewQuestionAdmin(admin.ModelAdmin):
    list_display = ('interview', 'question')


@admin.register(InterviewFeedback)
class InterviewFeedbackAdmin(admin.ModelAdmin):
    list_display = ('interview', 'overall_rating', 'created_at')
