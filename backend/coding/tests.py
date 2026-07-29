from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase


class CodingApiTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username='coding-tester',
            email='coding@example.com',
            password='StrongPass123!',
        )
        self.client.force_authenticate(user=self.user)

    def test_coding_problems_are_available(self):
        response = self.client.get('/api/coding/problems/')

        self.assertEqual(response.status_code, 200)
        self.assertGreater(len(response.data), 0)
        self.assertIn('slug', response.data[0])

    def test_coding_submit_returns_feedback(self):
        response = self.client.post(
            '/api/coding/submit/',
            {
                'slug': 'two-sum',
                'language': 'python',
                'code': 'def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        pass',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('status', response.data)
        self.assertIn('feedback', response.data)
