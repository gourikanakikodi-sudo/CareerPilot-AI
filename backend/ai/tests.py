from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from rest_framework.test import APITestCase

from resume.models import Resume


class AiPhaseFourTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username='phase-four',
            email='phase4@example.com',
            password='StrongPass123!',
        )
        self.client.force_authenticate(user=self.user)

    def test_job_opportunities_use_resume_skill_matches(self):
        Resume.objects.create(
            user=self.user,
            file=ContentFile(b'pdf', name='resume.pdf'),
            extracted_text='Python Django React PostgreSQL REST APIs Docker AWS',
            is_active=True,
        )

        response = self.client.get('/api/job-opportunities/')

        self.assertEqual(response.status_code, 200)
        self.assertIn('matches', response.data)
        self.assertGreater(len(response.data['matches']), 0)
        self.assertIn('match_percentage', response.data['matches'][0])
        self.assertIn('missing_skills', response.data['matches'][0])

    def test_career_coach_requires_message(self):
        response = self.client.post('/api/career-coach/', {'message': ''}, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('detail', response.data)

    def test_career_coach_returns_contextual_answer(self):
        Resume.objects.create(
            user=self.user,
            file=ContentFile(b'pdf', name='resume.pdf'),
            extracted_text='Python Django React PostgreSQL',
            is_active=True,
        )

        response = self.client.post(
            '/api/career-coach/',
            {'message': 'What should I improve first?'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('answer', response.data)
        self.assertTrue(response.data['context_used']['resume'])
