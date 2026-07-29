from rest_framework import serializers
from .models import Resume, ResumeAnalysis


class ResumeSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    filename = serializers.SerializerMethodField()
    analysis_status = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = (
            'id',
            'file',
            'file_url',
            'filename',
            'display_name',
            'original_filename',
            'file_size',
            'content_type',
            'extracted_text',
            'is_active',
            'analysis_status',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'file', 'file_url', 'filename', 'file_size', 'content_type', 'extracted_text', 'is_active', 'analysis_status', 'created_at', 'updated_at')

    def get_file_url(self, obj):
        request = self.context.get('request')
        if not obj.file:
            return ''
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url

    def get_filename(self, obj):
        return obj.display_name or obj.original_filename or obj.file.name.rsplit('/', 1)[-1]

    def get_analysis_status(self, obj):
        return 'complete' if hasattr(obj, 'analysis') else 'pending'


class ResumeAnalysisSerializer(serializers.ModelSerializer):
    resume = ResumeSerializer(read_only=True)

    class Meta:
        model = ResumeAnalysis
        fields = '__all__'
