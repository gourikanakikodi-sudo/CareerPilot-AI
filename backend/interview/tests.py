from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase


class InterviewViewTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username='tester',
            email='tester@example.com',
            password='StrongPass123!',
        )
        self.client.force_authenticate(user=self.user)

    def test_interview_questions_rejects_invalid_count(self):
        response = self.client.post(
            '/api/interview/questions/',
            {'role': 'Backend Engineer', 'difficulty': 'medium', 'count': 'not-a-number'},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('detail', response.data)

    def test_interview_questions_accepts_company_and_count(self):
        response = self.client.post(
            '/api/interview/questions/',
            {'role': 'Backend Engineer', 'company': 'Stripe', 'difficulty': 'hard', 'count': 10},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('questions', response.data)
        self.assertEqual(len(response.data['questions']), 10)
