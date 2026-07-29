from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import json

from .models import Interview, InterviewQuestion, InterviewFeedback
from .serializers import InterviewSerializer, InterviewFeedbackSerializer
from ai.services import generate_interview_questions, generate_feedback


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def interview_questions(request):
    role = request.data.get('role', '')
    company = request.data.get('company', '')
    difficulty = request.data.get('difficulty', 'medium')
    interview_type = request.data.get('interview_type', '')
    experience = request.data.get('experience', '')
    stack = request.data.get('stack', '')
    try:
        count = int(request.data.get('count', 5))
    except (TypeError, ValueError):
        return Response({'detail': 'Count must be a valid integer.'}, status=status.HTTP_400_BAD_REQUEST)

    if count < 1:
        return Response({'detail': 'Count must be at least 1.'}, status=status.HTTP_400_BAD_REQUEST)
    if count > 100:
        return Response({'detail': 'Count must be 100 or less.'}, status=status.HTTP_400_BAD_REQUEST)

    role_context = role
    context_parts = [part for part in [interview_type, experience, stack] if part]
    if context_parts:
        role_context = f"{role} ({'; '.join(context_parts)})"
    questions = generate_interview_questions(role_context, difficulty, count, company=company)
    interview = Interview.objects.create(user=request.user, role=role, difficulty=difficulty)
    for question in questions:
        if isinstance(question, dict):
            InterviewQuestion.objects.create(
                interview=interview,
                question=question.get('question', ''),
                payload=question,
            )
        else:
            InterviewQuestion.objects.create(interview=interview, question=str(question), payload={'question': str(question)})
    return Response({'interview_id': interview.id, 'questions': questions, 'company': company})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def interview_submit(request):
    interview_id = request.data.get('interview_id')
    answers = request.data.get('answers', [])
    try:
        interview = Interview.objects.get(id=interview_id, user=request.user)
    except Interview.DoesNotExist:
        return Response({'detail': 'Interview not found.'}, status=status.HTTP_404_NOT_FOUND)

    questions = list(interview.questions.order_by('created_at').values_list('question', flat=True))
    feedback_data = generate_feedback(interview.role, answers, questions=questions)
    suggestions_payload = {
        'summary': feedback_data.get('suggestions', ''),
        'strengths': feedback_data.get('strengths', ''),
        'risks': feedback_data.get('risks', ''),
        'next_steps': feedback_data.get('next_steps', ''),
        'per_answer_feedback': feedback_data.get('per_answer_feedback', []),
    }
    feedback = InterviewFeedback.objects.create(
        interview=interview,
        answers='\n'.join(answers),
        technical_score=feedback_data.get('technical_score', 0),
        communication_score=feedback_data.get('communication_score', 0),
        confidence_score=feedback_data.get('confidence_score', 0),
        problem_solving=feedback_data.get('problem_solving', ''),
        overall_rating=feedback_data.get('overall_rating', 0),
        suggestions=json.dumps(suggestions_payload),
    )
    return Response(InterviewFeedbackSerializer(feedback).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def interview_history(request):
    interviews = Interview.objects.filter(user=request.user).prefetch_related('questions', 'feedbacks').order_by('-created_at')
    return Response(InterviewSerializer(interviews, many=True).data)
