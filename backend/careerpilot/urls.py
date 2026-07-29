from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/', include('resume.urls')),
    path('api/', include('interview.urls')),
    path('api/', include('dashboard.urls')),
    path('api/', include('roadmap.urls')),
    path('api/', include('ai.urls')),
    path('api/', include('coding.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
