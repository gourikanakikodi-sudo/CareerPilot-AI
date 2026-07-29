from rest_framework import serializers
from .models import JobApplication


class JobApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = '__all__'
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def validate_status(self, value):
        valid = {c[0] for c in JobApplication.STATUS_CHOICES}
        if value not in valid:
            raise serializers.ValidationError(f"Status must be one of: {', '.join(sorted(valid))}")
        return value
