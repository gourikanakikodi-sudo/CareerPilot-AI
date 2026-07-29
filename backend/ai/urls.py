from django.urls import path
from .views import career_coach, career_context, job_opportunities

urlpatterns = [
    path('job-opportunities/', job_opportunities, name='job_opportunities'),
    path('career-coach/', career_coach, name='career_coach'),
    path('career-context/', career_context, name='career_context'),
]
