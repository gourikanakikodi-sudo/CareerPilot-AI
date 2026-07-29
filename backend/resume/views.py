import pdfplumber
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Resume, ResumeAnalysis
from .serializers import ResumeAnalysisSerializer, ResumeSerializer
from ai.services import generate_resume_analysis, generate_ats_score, match_resume_to_job

MAX_RESUME_SIZE = 5 * 1024 * 1024


def _coerce_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {'true', '1', 'yes', 'on'}:
            return True
        if normalized in {'false', '0', 'no', 'off'}:
            return False
    return bool(value)


def _extract_pdf_text(path):
    text = ''
    try:
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ''
                text += '\n'
    except Exception:
        return ''
    return text.strip()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def resume_list(request):
    resumes = Resume.objects.filter(user=request.user).order_by('-created_at')
    return Response(ResumeSerializer(resumes, many=True, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def latest_resume(request):
    resume = Resume.objects.filter(user=request.user, is_active=True).order_by('-created_at').first()
    if resume is None:
        resume = Resume.objects.filter(user=request.user).order_by('-created_at').first()
    if resume is None:
        return Response({'detail': 'No resume uploaded yet.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(ResumeSerializer(resume, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_resume(request):
    file = request.FILES.get('file')
    if not file or not file.name.lower().endswith('.pdf'):
        return Response({'detail': 'Please upload a PDF file.'}, status=status.HTTP_400_BAD_REQUEST)
    if file.size > MAX_RESUME_SIZE:
        return Response({'detail': 'Resume must be 5MB or smaller.'}, status=status.HTTP_400_BAD_REQUEST)

    display_name = request.data.get('display_name') or file.name.rsplit('.', 1)[0]
    with transaction.atomic():
        Resume.objects.filter(user=request.user, is_active=True).update(is_active=False)
        resume = Resume.objects.create(
            user=request.user,
            file=file,
            display_name=display_name[:180],
            original_filename=file.name[:255],
            file_size=file.size,
            content_type=getattr(file, 'content_type', '')[:120],
            is_active=True,
        )
    text = _extract_pdf_text(resume.file.path)
    resume.extracted_text = text
    resume.save(update_fields=['extracted_text'])

    return Response(ResumeSerializer(resume, context={'request': request}).data, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def resume_detail(request, resume_id):
    try:
        resume = Resume.objects.get(id=resume_id, user=request.user)
    except Resume.DoesNotExist:
        return Response({'detail': 'Resume not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        file_field = resume.file
        resume.delete()
        if file_field:
            file_field.delete(save=False)
        latest = Resume.objects.filter(user=request.user).order_by('-created_at').first()
        if latest:
            latest.is_active = True
            latest.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)

    display_name = request.data.get('display_name', '').strip()
    is_active = request.data.get('is_active')
    changed = []
    if display_name:
        resume.display_name = display_name[:180]
        changed.append('display_name')
    if is_active is not None:
        active = _coerce_bool(is_active)
        if active:
            Resume.objects.filter(user=request.user).update(is_active=False)
            resume.is_active = True
        else:
            resume.is_active = False
        changed.append('is_active')
    if changed:
        resume.save(update_fields=changed)
        if 'is_active' in changed and not resume.is_active:
            latest = Resume.objects.filter(user=request.user).exclude(id=resume.id).order_by('-created_at').first()
            if latest and not Resume.objects.filter(user=request.user, is_active=True).exists():
                latest.is_active = True
                latest.save(update_fields=['is_active'])
    return Response(ResumeSerializer(resume, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resume_analysis(request):
    resume_id = request.data.get('resume_id')
    try:
        resume = Resume.objects.get(id=resume_id, user=request.user)
    except Resume.DoesNotExist:
        return Response({'detail': 'Resume not found.'}, status=status.HTTP_404_NOT_FOUND)

    analysis_data = generate_resume_analysis(resume.extracted_text, resume_name=resume.display_name or resume.original_filename)
    analysis, _ = ResumeAnalysis.objects.update_or_create(
        resume=resume,
        defaults={
            'summary': analysis_data.get('summary', ''),
            'strengths': analysis_data.get('strengths', ''),
            'weaknesses': analysis_data.get('weaknesses', ''),
            'missing_skills': analysis_data.get('missing_skills', ''),
            'grammar_suggestions': analysis_data.get('grammar_suggestions', ''),
            'formatting_suggestions': analysis_data.get('formatting_suggestions', ''),
            'keyword_suggestions': analysis_data.get('keyword_suggestions', ''),
            'project_review': analysis_data.get('project_review', ''),
            'detailed_report': analysis_data.get('detailed_report', {}),
            'section_analysis': analysis_data.get('section_analysis', []),
            'keyword_report': analysis_data.get('keyword_report', {}),
            'rewritten_examples': analysis_data.get('rewritten_examples', []),
            'resume_rating': analysis_data.get('resume_rating', 0),
            'ats_score': analysis_data.get('ats_score', 0),
        },
    )
    return Response(ResumeAnalysisSerializer(analysis, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ats_score(request):
    resume_id = request.data.get('resume_id')
    job_description = request.data.get('job_description', '')
    try:
        resume = Resume.objects.get(id=resume_id, user=request.user)
    except Resume.DoesNotExist:
        return Response({'detail': 'Resume not found.'}, status=status.HTTP_404_NOT_FOUND)

    scores = generate_ats_score(resume.extracted_text)
    match_result = match_resume_to_job(resume.extracted_text, job_description)

    analysis = resume.analysis if hasattr(resume, 'analysis') else None
    if analysis is None:
        analysis = ResumeAnalysis.objects.create(
            resume=resume,
            ats_score=scores.get('overall_score', 0),
            summary=match_result.get('summary', ''),
        )
    else:
        analysis.ats_score = scores.get('overall_score', analysis.ats_score)
        analysis.summary = match_result.get('summary', analysis.summary)
        analysis.save(update_fields=['ats_score', 'summary'])

    return Response({
        'overall_score': scores.get('overall_score', 0),
        'breakdown': scores.get('breakdown', {}),
        'keyword_match_percentage': scores.get('keyword_match_percentage', match_result.get('match_score', 0)),
        'formatting_score': scores.get('formatting_score', scores.get('breakdown', {}).get('formatting', 0)),
        'readability': scores.get('readability', scores.get('breakdown', {}).get('readability', 0)),
        'match_score': match_result.get('match_score', 0),
        'summary': match_result.get('summary', ''),
        'matched_keywords': match_result.get('matched_keywords', []),
        'missing_keywords': match_result.get('missing_keywords', []) or scores.get('missing_keywords', []),
        'technical_skills': scores.get('technical_skills', []),
        'soft_skills': scores.get('soft_skills', []),
        'missing_technical_skills': match_result.get('missing_technical_skills', []),
        'missing_soft_skills': match_result.get('missing_soft_skills', []),
        'recommendations': match_result.get('recommendations', []),
        'rewritten_examples': match_result.get('rewritten_examples', []),
        'ats_explanation': match_result.get('ats_explanation', ''),
    })
