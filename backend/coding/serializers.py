from rest_framework import serializers
from .models import CodingProblem, CodingSubmission


class CodingProblemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodingProblem
        fields = '__all__'


class CodingSubmissionSerializer(serializers.ModelSerializer):
    problem = CodingProblemSerializer(read_only=True)

    class Meta:
        model = CodingSubmission
        fields = '__all__'
