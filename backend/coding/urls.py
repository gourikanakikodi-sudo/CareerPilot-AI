from django.urls import path
from .views import coding_problems, coding_submit, coding_history, coding_bookmark, coding_starter, coding_explain

urlpatterns = [
    path('coding/problems/', coding_problems, name='coding_problems'),
    path('coding/submit/', coding_submit, name='coding_submit'),
    path('coding/history/', coding_history, name='coding_history'),
    path('coding/bookmark/<int:submission_id>/', coding_bookmark, name='coding_bookmark'),
    path('coding/starter/<slug:slug>/', coding_starter, name='coding_starter'),
    path('coding/explain/', coding_explain, name='coding_explain'),
]
