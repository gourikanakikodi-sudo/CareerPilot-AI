import json

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from roadmap.models import LearningRoadmap


class LearningRoadmapViewsTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username='roadmap-tester',
            email='roadmap@example.com',
            password='StrongPass123!',
        )
        self.other_user = User.objects.create_user(
            username='other-roadmap-tester',
            email='other-roadmap@example.com',
            password='StrongPass123!',
        )
        self.client.force_authenticate(user=self.user)

    def test_get_latest_roadmap_is_user_scoped_and_parsed(self):
        LearningRoadmap.objects.create(
            user=self.other_user,
            career='Data Analyst',
            roadmap=json.dumps({'weeks': [{'week': 'Other user'}], 'progress': {}}),
        )
        roadmap = LearningRoadmap.objects.create(
            user=self.user,
            career='AI Engineer',
            roadmap=json.dumps({'weeks': [{'week': 'Week 1', 'topics': ['Python']}], 'progress': {}}),
        )

        response = self.client.get('/api/learning-roadmap/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['id'], roadmap.id)
        self.assertEqual(response.data['roadmap']['weeks'][0]['week'], 'Week 1')

    def test_patch_roadmap_progress_persists_to_database(self):
        roadmap = LearningRoadmap.objects.create(
            user=self.user,
            career='AI Engineer',
            roadmap=json.dumps({'weeks': [{'week': 'Week 1', 'topics': ['Python']}], 'progress': {}}),
        )

        response = self.client.patch(
            f'/api/learning-roadmap/{roadmap.id}/progress/',
            {'task_id': 'Week 1::topics::Python', 'completed': True},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['roadmap']['progress']['Week 1::topics::Python'])
        roadmap.refresh_from_db()
        self.assertTrue(json.loads(roadmap.roadmap)['progress']['Week 1::topics::Python'])
