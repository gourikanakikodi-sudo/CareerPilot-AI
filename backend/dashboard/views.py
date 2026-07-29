from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from resume.models import Resume, ResumeAnalysis
from interview.models import Interview, InterviewFeedback
from roadmap.models import LearningRoadmap, SkillGap
from roadmap.views_helpers import parse_roadmap_payload
from coding.models import CodingSubmission
from ai.services import generate_job_matches


def _roadmap_completion(payload):
    progress = payload.get('progress', {}) if isinstance(payload, dict) else {}
    if not progress:
        return 0
    return round((sum(1 for v in progress.values() if v) / len(progress)) * 100, 2)


def _next_action(resumes, analyses, feedbacks, coding_total, roadmap_pct):
    """Return the single highest-priority next action for the user."""
    if not resumes.exists():
        return {'action': 'Upload your resume', 'link': '/resume/upload', 'priority': 'high'}
    if not analyses.exists():
        return {'action': 'Run resume analysis to get your ATS score', 'link': '/resume/analysis', 'priority': 'high'}
    latest = analyses.order_by('-created_at').first()
    if latest and latest.ats_score < 70:
        return {'action': f'Improve ATS score (currently {latest.ats_score}/100) — add missing keywords', 'link': '/ats', 'priority': 'high'}
    if not feedbacks.exists():
        return {'action': 'Complete your first mock interview', 'link': '/interview', 'priority': 'medium'}
    if coding_total == 0:
        return {'action': 'Solve your first coding problem', 'link': '/coding', 'priority': 'medium'}
    if roadmap_pct < 30:
        return {'action': 'Make progress on your learning roadmap', 'link': '/roadmap', 'priority': 'medium'}
    return {'action': 'Ask the Career Coach for your next move', 'link': '/coach', 'priority': 'low'}


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    resumes = Resume.objects.filter(user=request.user).order_by('-created_at')
    analyses = ResumeAnalysis.objects.filter(resume__user=request.user)
    interviews = Interview.objects.filter(user=request.user).order_by('-created_at')
    roadmaps = LearningRoadmap.objects.filter(user=request.user).order_by('-created_at')
    feedbacks = InterviewFeedback.objects.filter(interview__user=request.user)
    coding_qs = CodingSubmission.objects.filter(user=request.user)

    latest_analysis = analyses.order_by('-created_at').first()
    average_ats = round(sum(a.ats_score for a in analyses) / len(analyses), 2) if analyses.exists() else 0
    avg_interview_score = round(
        sum(f.overall_rating for f in feedbacks) / feedbacks.count(), 2
    ) if feedbacks.exists() else 0

    latest_roadmap = roadmaps.first()
    roadmap_payload = parse_roadmap_payload(latest_roadmap.roadmap) if latest_roadmap else {}
    roadmap_pct = _roadmap_completion(roadmap_payload)

    # Coding progress
    coding_total = coding_qs.count()
    coding_accepted = coding_qs.filter(status='accepted').count()
    coding_rate = round((coding_accepted / coding_total) * 100) if coding_total else 0

    # Missing skills from latest skill gap or resume analysis
    latest_gap = SkillGap.objects.filter(user=request.user).order_by('-created_at').first()
    if latest_gap:
        missing_skills = [s.strip() for s in latest_gap.missing_skills.split(',') if s.strip()][:8]
    elif latest_analysis and latest_analysis.missing_skills:
        missing_skills = [s.strip() for s in latest_analysis.missing_skills.split(',') if s.strip()][:8]
    else:
        missing_skills = []

    # Recommended jobs (top 3 matches)
    active_resume = resumes.filter(is_active=True).first() or resumes.first()
    top_jobs = []
    if active_resume and active_resume.extracted_text:
        all_matches = generate_job_matches(active_resume.extracted_text)
        top_jobs = all_matches[:3]

    # Recent activity
    recent_activity = []
    for analysis in analyses.order_by('-created_at')[:2]:
        recent_activity.append({
            'type': 'resume_analysis',
            'label': f'Resume analyzed — ATS {analysis.ats_score}/100',
            'date': analysis.created_at.isoformat(),
        })
    for fb in feedbacks.order_by('-created_at')[:2]:
        recent_activity.append({
            'type': 'interview',
            'label': f'Mock interview — {fb.overall_rating}/100',
            'date': fb.created_at.isoformat(),
        })
    for sub in coding_qs.order_by('-created_at')[:2]:
        recent_activity.append({
            'type': 'coding',
            'label': f'Coded {sub.problem.title} — {sub.status.replace("_", " ")}',
            'date': sub.created_at.isoformat(),
        })
    recent_activity.sort(key=lambda x: x['date'], reverse=True)
    recent_activity = recent_activity[:6]

    next_action = _next_action(resumes, analyses, feedbacks, coding_total, roadmap_pct)

    return Response({
        'welcome_message': f'Welcome back, {request.user.username or request.user.email}!',
        'uploaded_resumes': resumes.count(),
        'latest_ats_score': latest_analysis.ats_score if latest_analysis else 0,
        'resume_score': latest_analysis.resume_rating if latest_analysis else 0,
        'resume_health': {
            'score': latest_analysis.resume_rating if latest_analysis else 0,
            'ats_score': latest_analysis.ats_score if latest_analysis else 0,
            'last_analyzed': latest_analysis.created_at.isoformat() if latest_analysis else None,
            'filename': (active_resume.display_name or active_resume.original_filename) if active_resume else None,
        },
        'missing_skills': missing_skills,
        'learning_progress': {
            'career': latest_roadmap.career if latest_roadmap else None,
            'completion_pct': roadmap_pct,
            'roadmap_id': latest_roadmap.id if latest_roadmap else None,
        },
        'interview_readiness': {
            'avg_score': avg_interview_score,
            'total_sessions': interviews.count(),
            'last_score': feedbacks.order_by('-created_at').first().overall_rating if feedbacks.exists() else 0,
        },
        'coding_progress': {
            'total': coding_total,
            'accepted': coding_accepted,
            'acceptance_rate': coding_rate,
        },
        'recommended_jobs': top_jobs,
        'recent_activity': recent_activity,
        'next_action': next_action,
        'average_ats': average_ats,
        'average_interview_score': avg_interview_score,
        'recent_interviews': min(interviews.count(), 3),
        'learning_roadmap': roadmap_payload,
        'skill_gap_summary': (
            f"Missing: {', '.join(missing_skills[:4])}" if missing_skills
            else 'Run a skill gap analysis to see your gaps.'
        ),
    })


def _roadmap_completion(payload):
    progress = payload.get('progress', {}) if isinstance(payload, dict) else {}
    if not progress:
        return 0
    return round((sum(1 for value in progress.values() if value) / len(progress)) * 100, 2)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_summary(request):
    analyses = ResumeAnalysis.objects.filter(resume__user=request.user).order_by('created_at')
    feedbacks = InterviewFeedback.objects.filter(interview__user=request.user).order_by('created_at')
    coding = CodingSubmission.objects.filter(user=request.user).order_by('-created_at')
    latest_roadmap = LearningRoadmap.objects.filter(user=request.user).order_by('-created_at').first()
    roadmap_payload = parse_roadmap_payload(latest_roadmap.roadmap) if latest_roadmap else {}
    accepted = coding.filter(status='accepted').count()
    total_coding = coding.count()

    return Response({
        'ats_trend': [{'date': item.created_at.date().isoformat(), 'score': item.ats_score} for item in analyses],
        'resume_trend': [{'date': item.created_at.date().isoformat(), 'score': item.resume_rating} for item in analyses],
        'interview_trend': [{'date': item.created_at.date().isoformat(), 'score': item.overall_rating} for item in feedbacks],
        'coding': {
            'total_submissions': total_coding,
            'accepted': accepted,
            'acceptance_rate': round((accepted / total_coding) * 100, 2) if total_coding else 0,
            'bookmarked': coding.filter(bookmarked=True).count(),
        },
        'roadmap_completion': _roadmap_completion(roadmap_payload),
        'totals': {
            'resume_analyses': analyses.count(),
            'interview_feedbacks': feedbacks.count(),
            'roadmaps': LearningRoadmap.objects.filter(user=request.user).count(),
        },
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications_summary(request):
    notifications = []
    latest_analysis = ResumeAnalysis.objects.filter(resume__user=request.user).order_by('-created_at').first()
    latest_feedback = InterviewFeedback.objects.filter(interview__user=request.user).order_by('-created_at').first()
    latest_coding = CodingSubmission.objects.filter(user=request.user).select_related('problem').order_by('-created_at').first()
    latest_roadmap = LearningRoadmap.objects.filter(user=request.user).order_by('-created_at').first()

    if latest_analysis:
        notifications.append({
            'title': 'Resume review ready',
            'detail': f'Latest ATS score is {latest_analysis.ats_score}/100 and resume score is {latest_analysis.resume_rating}/100.',
            'tone': 'info',
            'created_at': latest_analysis.created_at,
        })
    else:
        notifications.append({
            'title': 'Run your first resume analysis',
            'detail': 'Upload a resume and generate ATS-ready feedback.',
            'tone': 'warning',
            'created_at': None,
        })

    if latest_feedback:
        notifications.append({
            'title': 'Interview feedback updated',
            'detail': f'Your latest mock interview score is {latest_feedback.overall_rating}/100.',
            'tone': 'success',
            'created_at': latest_feedback.created_at,
        })

    if latest_coding:
        notifications.append({
            'title': 'Coding practice saved',
            'detail': f'{latest_coding.problem.title}: {latest_coding.passed_tests}/{latest_coding.total_tests} tests passed.',
            'tone': 'success' if latest_coding.status == 'accepted' else 'warning',
            'created_at': latest_coding.created_at,
        })

    if latest_roadmap:
        completion = _roadmap_completion(parse_roadmap_payload(latest_roadmap.roadmap))
        notifications.append({
            'title': 'Roadmap progress',
            'detail': f'{latest_roadmap.career} roadmap is {completion}% complete.',
            'tone': 'info',
            'created_at': latest_roadmap.created_at,
        })

    return Response({'notifications': notifications})


# ── Application Tracker ───────────────────────────────────────────
from rest_framework import status as drf_status
from .models import JobApplication
from .serializers import JobApplicationSerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def application_list(request):
    if request.method == 'GET':
        status_filter = request.query_params.get('status')
        qs = JobApplication.objects.filter(user=request.user)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(JobApplicationSerializer(qs, many=True).data)

    serializer = JobApplicationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=drf_status.HTTP_400_BAD_REQUEST)
    serializer.save(user=request.user)
    return Response(serializer.data, status=drf_status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def application_detail(request, app_id):
    try:
        app = JobApplication.objects.get(id=app_id, user=request.user)
    except JobApplication.DoesNotExist:
        return Response({'detail': 'Application not found.'}, status=drf_status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(JobApplicationSerializer(app).data)

    if request.method == 'DELETE':
        app.delete()
        return Response(status=drf_status.HTTP_204_NO_CONTENT)

    # PATCH
    serializer = JobApplicationSerializer(app, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=drf_status.HTTP_400_BAD_REQUEST)
    serializer.save()
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def application_stats(request):
    qs = JobApplication.objects.filter(user=request.user)
    stats = {}
    for choice, _ in JobApplication.STATUS_CHOICES:
        stats[choice] = qs.filter(status=choice).count()
    stats['total'] = qs.count()
    return Response(stats)
