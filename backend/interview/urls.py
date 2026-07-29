from django.urls import path
from .views import interview_questions, interview_submit, interview_history

urlpatterns = [
    path('interview/questions/', interview_questions, name='interview_questions'),
    path('interview/submit/', interview_submit, name='interview_submit'),
    path('interview/history/', interview_history, name='interview_history'),
]
