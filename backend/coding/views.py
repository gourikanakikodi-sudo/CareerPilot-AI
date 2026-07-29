from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import CodingProblem, CodingSubmission
from .serializers import CodingProblemSerializer, CodingSubmissionSerializer
from ai.services import explain_coding_solution


SUPPORTED_LANGUAGES = ('python', 'javascript', 'java', 'c', 'cpp')

# Starter templates per language per problem slug
STARTER_TEMPLATES = {
    'two-sum': {
        'python':     'def two_sum(nums, target):\n    # Your solution here\n    pass\n',
        'javascript': 'function twoSum(nums, target) {\n  // Your solution here\n}\n',
        'java':       'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your solution here\n        return new int[]{};\n    }\n}\n',
        'c':          '#include <stdlib.h>\n\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    // Your solution here\n    *returnSize = 2;\n    int* result = malloc(2 * sizeof(int));\n    return result;\n}\n',
        'cpp':        '#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Your solution here\n        return {};\n    }\n};\n',
    },
    'valid-parentheses': {
        'python':     'def is_valid(s):\n    # Your solution here\n    pass\n',
        'javascript': 'function isValid(s) {\n  // Your solution here\n}\n',
        'java':       'class Solution {\n    public boolean isValid(String s) {\n        // Your solution here\n        return false;\n    }\n}\n',
        'c':          '#include <stdbool.h>\n#include <stdlib.h>\n\nbool isValid(char* s) {\n    // Your solution here\n    return false;\n}\n',
        'cpp':        '#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isValid(string s) {\n        // Your solution here\n        return false;\n    }\n};\n',
    },
    'maximum-subarray': {
        'python':     'def max_sub_array(nums):\n    # Your solution here\n    pass\n',
        'javascript': 'function maxSubArray(nums) {\n  // Your solution here\n}\n',
        'java':       'class Solution {\n    public int maxSubArray(int[] nums) {\n        // Your solution here\n        return 0;\n    }\n}\n',
        'c':          'int maxSubArray(int* nums, int numsSize) {\n    // Your solution here\n    return 0;\n}\n',
        'cpp':        '#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // Your solution here\n        return 0;\n    }\n};\n',
    },
}

DEFAULT_TEMPLATES = {
    'python':     '# Write your solution here\n\ndef solution():\n    pass\n',
    'javascript': '// Write your solution here\n\nfunction solution() {\n\n}\n',
    'java':       '// Write your solution here\nclass Solution {\n    public void solve() {\n        // implement\n    }\n}\n',
    'c':          '// Write your solution here\n#include <stdio.h>\n\nvoid solution() {\n    // implement\n}\n',
    'cpp':        '// Write your solution here\n#include <iostream>\nusing namespace std;\n\nvoid solution() {\n    // implement\n}\n',
}

PROBLEMS = [
    {
        'slug': 'two-sum',
        'title': 'Two Sum',
        'company': 'Amazon',
        'difficulty': 'easy',
        'prompt': 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        'starter_code': STARTER_TEMPLATES['two-sum'],
        'visible_tests': [
            {'input': 'nums=[2,7,11,15], target=9', 'output': '[0, 1]'},
            {'input': 'nums=[3,2,4], target=6', 'output': '[1, 2]'},
        ],
        'tags': ['arrays', 'hash map'],
        'expected_signals': ['dict', 'map', 'enumerate', 'for', 'hashmap', 'unordered_map'],
    },
    {
        'slug': 'valid-parentheses',
        'title': 'Valid Parentheses',
        'company': 'Google',
        'difficulty': 'easy',
        'prompt': 'Given a string s containing just the characters (, ), {, }, [ and ], determine if the input string is valid.',
        'starter_code': STARTER_TEMPLATES['valid-parentheses'],
        'visible_tests': [
            {'input': 's="()[]{}"', 'output': 'true'},
            {'input': 's="(]"', 'output': 'false'},
        ],
        'tags': ['stack', 'strings'],
        'expected_signals': ['stack', 'append', 'pop', 'push', 'deque'],
    },
    {
        'slug': 'maximum-subarray',
        'title': 'Maximum Subarray',
        'company': 'Microsoft',
        'difficulty': 'medium',
        'prompt': 'Given an integer array nums, find the subarray with the largest sum, and return its sum.',
        'starter_code': STARTER_TEMPLATES['maximum-subarray'],
        'visible_tests': [
            {'input': 'nums=[-2,1,-3,4,-1,2,1,-5,4]', 'output': '6'},
            {'input': 'nums=[1]', 'output': '1'},
        ],
        'tags': ['dynamic programming', 'arrays'],
        'expected_signals': ['max', 'current', 'best', 'kadane', 'dp'],
    },
]


def _ensure_seed_problems():
    """Seed initial problems only if the table is empty, updating starter_code for all languages."""
    if CodingProblem.objects.exists():
        # Still update starter_code so new languages are reflected
        for problem in PROBLEMS:
            CodingProblem.objects.filter(slug=problem['slug']).update(
                starter_code=problem['starter_code'],
            )
        return
    for problem in PROBLEMS:
        CodingProblem.objects.get_or_create(
            slug=problem['slug'],
            defaults={
                'title': problem['title'],
                'company': problem['company'],
                'difficulty': problem['difficulty'],
                'prompt': problem['prompt'],
                'starter_code': problem['starter_code'],
                'visible_tests': problem['visible_tests'],
                'hidden_tests': [],
                'solution': '',
                'tags': problem['tags'],
            },
        )


def _public_problem(problem):
    if isinstance(problem, CodingProblem):
        return CodingProblemSerializer(problem).data
    return {key: value for key, value in problem.items() if key != 'expected_signals'}


def _expected_signals(problem):
    seeded = next((item for item in PROBLEMS if item['slug'] == problem.slug), None)
    return seeded['expected_signals'] if seeded else ['for', 'return']


def _starter_for_language(problem, language):
    """Return starter code for a problem+language, falling back gracefully."""
    sc = problem.starter_code or {}
    if language in sc:
        return sc[language]
    return DEFAULT_TEMPLATES.get(language, '// Write your solution here\n')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def coding_problems(request):
    _ensure_seed_problems()
    problems = CodingProblem.objects.all().order_by('id')
    return Response(CodingProblemSerializer(problems, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def coding_starter(request, slug):
    """Return starter template for a specific problem + language."""
    _ensure_seed_problems()
    language = request.query_params.get('language', 'python').lower()
    if language not in SUPPORTED_LANGUAGES:
        return Response({'detail': f'Unsupported language. Choose from: {", ".join(SUPPORTED_LANGUAGES)}'}, status=400)
    try:
        problem = CodingProblem.objects.get(slug=slug)
    except CodingProblem.DoesNotExist:
        return Response({'detail': 'Problem not found.'}, status=404)
    return Response({'slug': slug, 'language': language, 'starter_code': _starter_for_language(problem, language)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def coding_submit(request):
    slug = request.data.get('slug') or request.data.get('problem_slug')
    language = (request.data.get('language') or 'python').lower()
    code = request.data.get('code', '')

    if language not in SUPPORTED_LANGUAGES:
        return Response({'detail': f'Unsupported language. Choose from: {", ".join(SUPPORTED_LANGUAGES)}'}, status=400)

    _ensure_seed_problems()
    try:
        problem = CodingProblem.objects.get(slug=slug)
    except CodingProblem.DoesNotExist:
        return Response({'detail': 'Problem not found.'}, status=404)

    lowered = code.lower()
    matched_signals = [s for s in _expected_signals(problem) if s in lowered]
    total_tests = len(problem.visible_tests) + 2
    passed_tests = min(total_tests, max(1, len(matched_signals) + 1)) if code.strip() else 0
    failed_tests = total_tests - passed_tests
    accepted = passed_tests == total_tests

    # Runtime/memory vary by language (simulated)
    lang_overhead = {'python': 0, 'javascript': 5, 'java': 15, 'c': -5, 'cpp': -3}
    execution_ms = max(1, 24 + len(code) % 40 + lang_overhead.get(language, 0))
    memory_kb = 12000 + len(code) + {'java': 8000, 'cpp': 1000, 'c': 500}.get(language, 0)

    submission = CodingSubmission.objects.create(
        user=request.user,
        problem=problem,
        language=language,
        code=code,
        status='accepted' if accepted else 'wrong_answer',
        passed_tests=passed_tests,
        total_tests=total_tests,
        execution_ms=execution_ms,
        memory_kb=memory_kb,
        feedback={
            'matched_signals': matched_signals,
            'summary': 'Solution shape looks interview-ready.' if accepted else 'Add the expected data structure or algorithm pattern and handle edge cases.',
            'next_step': 'Explain time and space complexity out loud after solving.',
            'time_complexity': _estimate_complexity(matched_signals, problem.slug),
            'space_complexity': _estimate_space(matched_signals, problem.slug),
        },
    )

    return Response({
        'id': submission.id,
        'problem': _public_problem(problem),
        'language': language,
        'status': submission.status,
        'passed_tests': passed_tests,
        'failed_tests': failed_tests,
        'total_tests': total_tests,
        'execution_ms': execution_ms,
        'memory_kb': memory_kb,
        'feedback': submission.feedback,
        'bookmarked': submission.bookmarked,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def coding_explain(request):
    """AI explanation for a submitted solution."""
    slug = request.data.get('slug', '')
    language = (request.data.get('language') or 'python').lower()
    code = request.data.get('code', '')
    status_result = request.data.get('status', '')

    if not code.strip():
        return Response({'detail': 'code is required.'}, status=400)

    _ensure_seed_problems()
    problem_prompt = ''
    try:
        problem = CodingProblem.objects.get(slug=slug)
        problem_prompt = problem.prompt
    except CodingProblem.DoesNotExist:
        pass

    explanation = explain_coding_solution(
        code=code,
        language=language,
        problem_title=slug.replace('-', ' ').title(),
        problem_prompt=problem_prompt,
        status=status_result,
    )
    return Response(explanation)


def _estimate_complexity(signals, slug):
    if slug == 'two-sum':
        if any(s in signals for s in ('dict', 'map', 'hashmap', 'unordered_map')):
            return 'O(n)'
        return 'O(n²)'
    if slug == 'valid-parentheses':
        return 'O(n)'
    if slug == 'maximum-subarray':
        if any(s in signals for s in ('max', 'current', 'best', 'kadane', 'dp')):
            return 'O(n)'
        return 'O(n²)'
    return 'O(n)'


def _estimate_space(signals, slug):
    if slug == 'two-sum':
        if any(s in signals for s in ('dict', 'map', 'hashmap', 'unordered_map')):
            return 'O(n)'
        return 'O(1)'
    if slug == 'valid-parentheses':
        return 'O(n)'
    if slug == 'maximum-subarray':
        return 'O(1)'
    return 'O(n)'


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def coding_history(request):
    submissions = CodingSubmission.objects.filter(user=request.user).select_related('problem').order_by('-created_at')[:20]
    return Response(CodingSubmissionSerializer(submissions, many=True).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def coding_bookmark(request, submission_id):
    try:
        submission = CodingSubmission.objects.get(id=submission_id, user=request.user)
    except CodingSubmission.DoesNotExist:
        return Response({'detail': 'Submission not found.'}, status=404)
    submission.bookmarked = not submission.bookmarked
    submission.save(update_fields=['bookmarked'])
    return Response(CodingSubmissionSerializer(submission).data)
