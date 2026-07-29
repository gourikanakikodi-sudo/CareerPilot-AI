from rest_framework import serializers
import json
from .models import Interview, InterviewQuestion, InterviewFeedback


class InterviewQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewQuestion
        fields = '__all__'


class InterviewFeedbackSerializer(serializers.ModelSerializer):
    feedback_details = serializers.SerializerMethodField()

    class Meta:
        model = InterviewFeedback
        fields = '__all__'

    def get_feedback_details(self, obj):
        try:
            return json.loads(obj.suggestions or '{}')
        except (TypeError, ValueError):
            return {'summary': obj.suggestions or ''}


class InterviewSerializer(serializers.ModelSerializer):
    questions = InterviewQuestionSerializer(many=True, read_only=True)
    feedbacks = InterviewFeedbackSerializer(many=True, read_only=True)

    class Meta:
        model = Interview
        fields = ('id', 'role', 'difficulty', 'created_at', 'questions', 'feedbacks')
