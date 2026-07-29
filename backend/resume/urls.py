from django.urls import path
from .views import upload_resume, resume_analysis, ats_score, resume_list, latest_resume, resume_detail

urlpatterns = [
    path('resumes/', resume_list, name='resume_list'),
    path('resumes/latest/', latest_resume, name='latest_resume'),
    path('resumes/<int:resume_id>/', resume_detail, name='resume_detail'),
    path('upload-resume/', upload_resume, name='upload_resume'),
    path('resume-analysis/', resume_analysis, name='resume_analysis'),
    path('ats-score/', ats_score, name='ats_score'),
]
