from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from interview.models import Interview, InterviewFeedback
from interview.serializers import InterviewSerializer
from resume.models import Resume, ResumeAnalysis
from resume.serializers import ResumeSerializer, ResumeAnalysisSerializer
from roadmap.models import LearningRoadmap, SkillGap
from roadmap.serializers import SkillGapSerializer, LearningRoadmapSerializer
from roadmap.views_helpers import parse_roadmap_payload
from coding.models import CodingSubmission
from .services import generate_career_coach_response, generate_job_matches


def _latest_resume(user):
    resume = Resume.objects.filter(user=user, is_active=True).order_by('-created_at').first()
    return resume or Resume.objects.filter(user=user).order_by('-created_at').first()


def _build_career_context(request):
    """Single source of truth for all user career data — used by coach and career context endpoint."""
    user = request.user
    resume = _latest_resume(user)
    latest_analysis = ResumeAnalysis.objects.filter(resume__user=user).order_by('-created_at').first()
    interviews = Interview.objects.filter(user=user).prefetch_related('questions', 'feedbacks').order_by('-created_at')[:5]
    latest_feedback = InterviewFeedback.objects.filter(interview__user=user).order_by('-created_at').first()
    roadmap = LearningRoadmap.objects.filter(user=user).order_by('-created_at').first()
    latest_gap = SkillGap.objects.filter(user=user).order_by('-created_at').first()
    coding_qs = CodingSubmission.objects.filter(user=user)
    coding_total = coding_qs.count()
    coding_accepted = coding_qs.filter(status='accepted').count()

    job_matches = []
    if resume and resume.extracted_text:
        job_matches = generate_job_matches(resume.extracted_text)

    return {
        'resume': ResumeSerializer(resume, context={'request': request}).data if resume else None,
        'resume_text': resume.extracted_text[:4000] if resume else '',
        'latest_analysis': ResumeAnalysisSerializer(latest_analysis, context={'request': request}).data if latest_analysis else None,
        'interviews': InterviewSerializer(interviews, many=True).data,
        'latest_feedback': {
            'overall_rating': latest_feedback.overall_rating,
            'technical_score': latest_feedback.technical_score,
            'communication_score': latest_feedback.communication_score,
        } if latest_feedback else None,
        'roadmap': LearningRoadmapSerializer(roadmap).data if roadmap else None,
        'skill_gap': SkillGapSerializer(latest_gap).data if latest_gap else None,
        'coding': {
            'total': coding_total,
            'accepted': coding_accepted,
            'acceptance_rate': round((coding_accepted / coding_total) * 100) if coding_total else 0,
        },
        'job_matches': job_matches[:3],
    }


# Keep backward-compat alias used by career_coach
def _coach_context(request):
    ctx = _build_career_context(request)
    return ctx


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def career_context(request):
    """Single endpoint that returns all user career data for the frontend CareerContext."""
    context = _build_career_context(request)
    return Response(context)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def job_opportunities(request):
    resume = _latest_resume(request.user)
    if resume is None:
        return Response({'detail': 'Upload a resume before matching jobs.'}, status=status.HTTP_404_NOT_FOUND)
    return Response({
        'resume': ResumeSerializer(resume, context={'request': request}).data,
        'matches': generate_job_matches(resume.extracted_text),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def career_coach(request):
    question = (request.data.get('message') or '').strip()
    if not question:
        return Response({'detail': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)
    context = _coach_context(request)
    answer = generate_career_coach_response(question, context)
    return Response({'answer': answer, 'context_used': {
        'resume': bool(context.get('resume')),
        'latest_analysis': bool(context.get('latest_analysis')),
        'interviews': len(context.get('interviews') or []),
        'roadmap': bool(context.get('roadmap')),
        'skill_gap': bool(context.get('skill_gap')),
        'coding': context.get('coding', {}),
    }})
