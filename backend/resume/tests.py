from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.test import override_settings
from rest_framework.test import APITestCase
import os
import tempfile

from resume.models import Resume


class ResumeViewsTests(APITestCase):
    def setUp(self):
        self.media_dir = tempfile.TemporaryDirectory()
        self.override = override_settings(MEDIA_ROOT=self.media_dir.name)
        self.override.enable()
        User = get_user_model()
        self.user = User.objects.create_user(
            username='resume-tester',
            email='resume@example.com',
            password='StrongPass123!',
        )
        self.client.force_authenticate(user=self.user)

    def tearDown(self):
        self.override.disable()
        self.media_dir.cleanup()

    def test_ats_match_endpoint_returns_production_style_summary(self):
        resume = Resume.objects.create(
            user=self.user,
            file=ContentFile(b'pdf', name='resume.pdf'),
            extracted_text='Python Django React PostgreSQL AWS',
        )

        response = self.client.post(
            '/api/ats-score/',
            {
                'resume_id': resume.id,
                'job_description': 'Senior Python Backend Engineer with Django PostgreSQL AWS',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('match_score', response.data)
        self.assertIn('summary', response.data)
        self.assertIn('matched_keywords', response.data)

    def test_delete_resume_removes_database_row_and_uploaded_file(self):
        resume = Resume.objects.create(user=self.user)
        resume.file.save('delete-me.pdf', ContentFile(b'pdf'), save=True)
        file_path = resume.file.path

        response = self.client.delete(f'/api/resumes/{resume.id}/')

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Resume.objects.filter(id=resume.id).exists())
        self.assertFalse(os.path.exists(file_path))

    def test_setting_resume_inactive_promotes_latest_remaining_resume(self):
        old_resume = Resume.objects.create(user=self.user, file=ContentFile(b'old', name='old.pdf'), is_active=False)
        active_resume = Resume.objects.create(user=self.user, file=ContentFile(b'new', name='new.pdf'), is_active=True)

        response = self.client.patch(f'/api/resumes/{active_resume.id}/', {'is_active': False}, format='json')

        self.assertEqual(response.status_code, 200)
        old_resume.refresh_from_db()
        active_resume.refresh_from_db()
        self.assertTrue(old_resume.is_active)
        self.assertFalse(active_resume.is_active)
