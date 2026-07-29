from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import SkillGap, LearningRoadmap
from .serializers import SkillGapSerializer, LearningRoadmapSerializer
from .views_helpers import parse_roadmap_payload, serialize_roadmap_payload
from ai.services import generate_skill_gap, generate_learning_roadmap


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def skill_gap(request):
    career = request.data.get('career', '')
    current_skills = request.data.get('current_skills', '')
    required_skills = request.data.get('required_skills', '')
    data = generate_skill_gap(career, current_skills, required_skills)
    gap = SkillGap.objects.create(
        user=request.user,
        career=career,
        current_skills=current_skills,
        required_skills=required_skills,
        missing_skills=data.get('missing_skills', ''),
        priority=data.get('priority', ''),
        difficulty=data.get('difficulty', ''),
        learning_time=data.get('learning_time', ''),
    )
    return Response(SkillGapSerializer(gap).data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def learning_roadmap(request):
    if request.method == 'GET':
        latest = LearningRoadmap.objects.filter(user=request.user).order_by('-created_at').first()
        if latest is None:
            return Response({'detail': 'No learning roadmap found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(LearningRoadmapSerializer(latest).data)

    career = (request.data.get('career') or '').strip()
    if not career:
        return Response({'detail': 'career is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        weeks_count = int(request.data.get('weeks_count', 8))
    except (TypeError, ValueError):
        weeks_count = 8
    weeks_count = max(1, min(52, weeks_count))  # clamp 1–52

    # Pull personalisation context from request or latest saved records
    context = {
        'current_skills': request.data.get('current_skills', ''),
        'missing_skills': request.data.get('missing_skills', ''),
        'ats_score': request.data.get('ats_score', ''),
        'resume_summary': request.data.get('resume_summary', ''),
    }

    # Auto-enrich from latest skill gap if caller didn't provide skills
    if not context['current_skills'] or not context['missing_skills']:
        latest_gap = SkillGap.objects.filter(user=request.user).order_by('-created_at').first()
        if latest_gap:
            if not context['current_skills']:
                context['current_skills'] = latest_gap.current_skills
            if not context['missing_skills']:
                context['missing_skills'] = latest_gap.missing_skills

    roadmap_payload = generate_learning_roadmap(career, weeks=weeks_count, context=context)
    roadmap = LearningRoadmap.objects.create(
        user=request.user,
        career=career,
        weeks_count=weeks_count,
        roadmap=serialize_roadmap_payload(roadmap_payload),
    )
    return Response(LearningRoadmapSerializer(roadmap).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def roadmap_progress(request, roadmap_id):
    try:
        roadmap = LearningRoadmap.objects.get(id=roadmap_id, user=request.user)
    except LearningRoadmap.DoesNotExist:
        return Response({'detail': 'Learning roadmap not found.'}, status=status.HTTP_404_NOT_FOUND)

    task_id = str(request.data.get('task_id', '')).strip()
    if not task_id:
        return Response({'detail': 'task_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

    completed = request.data.get('completed', True)
    if isinstance(completed, str):
        completed = completed.strip().lower() in {'true', '1', 'yes', 'on'}

    payload = parse_roadmap_payload(roadmap.roadmap)
    progress = payload.setdefault('progress', {})
    progress[task_id] = bool(completed)
    roadmap.roadmap = serialize_roadmap_payload(payload)
    roadmap.save(update_fields=['roadmap'])
    return Response(LearningRoadmapSerializer(roadmap).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def roadmap_complete_week(request, roadmap_id):
    """Mark all tasks in a given week_index as completed (or uncompleted)."""
    try:
        roadmap = LearningRoadmap.objects.get(id=roadmap_id, user=request.user)
    except LearningRoadmap.DoesNotExist:
        return Response({'detail': 'Learning roadmap not found.'}, status=status.HTTP_404_NOT_FOUND)

    try:
        week_index = int(request.data.get('week_index'))
    except (TypeError, ValueError):
        return Response({'detail': 'week_index (integer) is required.'}, status=status.HTTP_400_BAD_REQUEST)

    completed = request.data.get('completed', True)
    if isinstance(completed, str):
        completed = completed.strip().lower() in {'true', '1', 'yes', 'on'}

    payload = parse_roadmap_payload(roadmap.roadmap)
    weeks = payload.get('weeks', [])
    if week_index < 0 or week_index >= len(weeks):
        return Response({'detail': 'week_index out of range.'}, status=status.HTTP_400_BAD_REQUEST)

    week = weeks[week_index]
    progress = payload.setdefault('progress', {})
    week_label = week.get('week') or week.get('title') or f'Week {week_index + 1}'

    for category in ('topics', 'practice', 'mini_projects', 'interview_prep'):
        for item in (week.get(category) or []):
            key = f'{week_label}::{category}::{item}'
            progress[key] = bool(completed)

    roadmap.roadmap = serialize_roadmap_payload(payload)
    roadmap.save(update_fields=['roadmap'])
    return Response(LearningRoadmapSerializer(roadmap).data)
