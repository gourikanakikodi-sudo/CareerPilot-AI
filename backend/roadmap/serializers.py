from rest_framework import serializers
from .models import SkillGap, LearningRoadmap
from .views_helpers import parse_roadmap_payload


class SkillGapSerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillGap
        fields = '__all__'


class LearningRoadmapSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningRoadmap
        fields = ('id', 'user', 'career', 'weeks_count', 'roadmap', 'created_at')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['roadmap'] = parse_roadmap_payload(instance.roadmap)
        return data
