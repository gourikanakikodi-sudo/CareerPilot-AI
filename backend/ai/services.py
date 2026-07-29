import os
import json
import re

try:
    import google.generativeai as genai
except ImportError:  # pragma: no cover - fallback for local/dev environments
    genai = None


def _client():
    if genai is None:
        return None
    api_key = os.getenv('GEMINI_API_KEY', '')
    if not api_key:
        return None
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-1.5-flash')


def _json_from_response(response_text, fallback):
    cleaned = response_text.strip()
    if cleaned.startswith('```'):
        cleaned = re.sub(r'^```(?:json)?', '', cleaned).strip()
        cleaned = re.sub(r'```$', '', cleaned).strip()
    try:
        return json.loads(cleaned)
    except Exception:
        return fallback


def _fallback_resume_analysis(text, resume_name=''):
    has_metrics = bool(re.search(r'\b\d+%|\b\d+x|\b\d+\+', text or ''))
    has_links = bool(re.search(r'github|linkedin|portfolio|https?://', text or '', re.I))
    detected_skills = sorted(set(re.findall(r'\b(Python|Django|React|JavaScript|SQL|AWS|Docker|REST|API|Machine Learning|TensorFlow|Pandas|PostgreSQL|Git)\b', text or '', re.I)))
    missing = ['system design', 'cloud deployment', 'testing strategy', 'measurable business impact']
    rating = 86 if has_metrics and len(detected_skills) >= 5 else 78
    ats = 84 if detected_skills else 70
    return {
        'summary': (
            f"{resume_name or 'This resume'} shows a credible technical foundation and enough signal for recruiter screening, "
            "but it should read more like an outcomes document than a responsibility list. The strongest next improvement is to "
            "connect every project or role to business impact, scale, tools used, and measurable results so both recruiters and ATS systems can classify the profile quickly."
        ),
        'strengths': 'Clear technical orientation, relevant project evidence, and a foundation that can be positioned for modern engineering roles. The profile will be stronger when each bullet names the stack, ownership level, and measurable result.',
        'weaknesses': 'Several areas need sharper proof: quantified outcomes, role-specific keywords, production practices, testing, cloud exposure, and concise recruiter-facing wording. Without those signals, the resume may look capable but not differentiated.',
        'missing_skills': ', '.join(missing),
        'grammar_suggestions': 'Use consistent tense, start bullets with strong action verbs, remove filler phrases, and keep each bullet focused on action, technology, and result.',
        'formatting_suggestions': 'Keep one-column ATS-safe formatting, consistent headings, clear dates, readable spacing, and plain text links. Avoid tables, icons, text boxes, and graphics that parsers often miss.',
        'keyword_suggestions': 'Add role-aligned keywords naturally inside project and experience bullets: APIs, databases, testing, deployment, cloud, observability, CI/CD, security, scalability, and ownership.',
        'project_review': 'Projects should include problem context, architecture decisions, core technologies, constraints, measurable outcome, and what you personally built.',
        'detailed_report': {
            'recruiter_score': rating,
            'readability': 'Good foundation; improve scan speed by putting role fit, strongest stack, and impact in the first third of the resume.',
            'employability': 'Competitive for entry to mid-level interviews when paired with stronger quantified project bullets and role-specific keywords.',
            'why_it_matters': 'Recruiters screen for fit in seconds, while ATS systems rank matching terminology. Specific, measurable, keyword-rich bullets improve both human trust and machine retrieval.',
        },
        'section_analysis': [
            {
                'section': 'Professional Summary',
                'strengths': 'Can quickly frame the target role.',
                'weaknesses': 'Often too generic unless it names role, stack, domain, and impact.',
                'recommendation': 'Write 2-3 lines that combine target role, strongest technologies, and proof of shipped work.',
                'example': 'Full Stack Developer with React, Django, PostgreSQL, and AWS experience building API-driven products, improving workflow speed, and deploying production-ready features.',
            },
            {
                'section': 'Projects',
                'strengths': 'Projects provide concrete proof of capability.',
                'weaknesses': 'Bullets need clearer architecture, constraints, and measurable outcomes.',
                'recommendation': 'For each project, state the user problem, system design, stack, your ownership, and result.',
                'example': 'Built a resume analysis platform with Django REST APIs and React, reducing manual review time by 60% through structured AI feedback and ATS scoring.',
            },
            {
                'section': 'Skills',
                'strengths': f"Detected skills include: {', '.join(detected_skills) if detected_skills else 'core programming and web skills'}.",
                'weaknesses': 'Group skills by category so ATS and recruiters can map them faster.',
                'recommendation': 'Use categories such as Languages, Frontend, Backend, Data, Cloud, DevOps, Testing, and Tools.',
                'example': 'Backend: Django, REST APIs, PostgreSQL, authentication, caching, background jobs.',
            },
            {
                'section': 'Links and Proof',
                'strengths': 'Portfolio links help validate real work.' if has_links else 'Adding links would strengthen credibility.',
                'weaknesses': 'Missing or unclear links reduce recruiter confidence.',
                'recommendation': 'Add GitHub, LinkedIn, portfolio, deployed demos, and project READMEs with screenshots.',
                'example': 'GitHub: github.com/username | Portfolio: username.dev | LinkedIn: linkedin.com/in/username',
            },
        ],
        'keyword_report': {
            'detected_skills': detected_skills,
            'missing_keywords': missing,
            'keyword_match_percentage': ats,
            'technical_skills': detected_skills,
            'soft_skills': ['communication', 'ownership', 'collaboration', 'problem solving'],
        },
        'rewritten_examples': [
            'Before: Worked on a web application. After: Built and deployed a React + Django career platform with JWT authentication, resume parsing, ATS scoring, and AI-generated interview feedback.',
            'Before: Used database. After: Designed PostgreSQL models and optimized API queries to persist resume versions, analysis history, and interview performance metrics.',
        ],
        'resume_rating': rating,
        'ats_score': ats,
    }


def generate_resume_analysis(text, resume_name=''):
    client = _client()
    if client is None:
        return _fallback_resume_analysis(text, resume_name)
    fallback = _fallback_resume_analysis(text, resume_name)
    prompt = f"""You are an enterprise career coach and ATS analyst. Analyze this resume and return ONLY valid JSON with:
summary, strengths, weaknesses, missing_skills, grammar_suggestions, formatting_suggestions, keyword_suggestions, project_review, detailed_report, section_analysis, keyword_report, rewritten_examples, resume_rating, ats_score.
section_analysis must cover summary, education, projects, experience, skills, certifications/achievements, and links when present. For every section include strengths, weaknesses, recruiter_expectations, recommendation, why_it_matters, and example.
Make the advice specific, educational, professional, and multi-paragraph where useful.
Resume name: {resume_name}
Resume text:
{text[:7000]}"""
    response = client.generate_content(prompt)
    return _json_from_response(response.text, fallback)


def generate_ats_score(text):
    client = _client()
    if client is None:
        detected_skills = sorted(set(re.findall(r'\b(Python|Django|React|JavaScript|SQL|AWS|Docker|REST|API|Machine Learning|TensorFlow|Pandas|PostgreSQL|Git)\b', text or '', re.I)))
        return {
            'overall_score': 82,
            'breakdown': {
                'skills': 85,
                'projects': 80,
                'experience': 84,
                'education': 88,
                'keywords': 78,
                'formatting': 80,
                'readability': 83,
            },
            'keyword_match_percentage': 78,
            'formatting_score': 80,
            'readability': 83,
            'technical_skills': detected_skills,
            'soft_skills': ['communication', 'ownership', 'collaboration', 'problem solving'],
            'missing_keywords': ['cloud deployment', 'testing', 'system design', 'measurable impact'],
        }
    prompt = f"""Return ONLY valid JSON with:
overall_score,
breakdown keys skills, projects, experience, education, keywords, formatting, readability,
keyword_match_percentage,
formatting_score,
readability,
technical_skills array,
soft_skills array,
missing_keywords array.
Resume text:
{text[:4000]}"""
    response = client.generate_content(prompt)
    fallback = {
        'overall_score': 78,
        'breakdown': {},
        'keyword_match_percentage': 0,
        'formatting_score': 0,
        'readability': 0,
        'technical_skills': [],
        'soft_skills': [],
        'missing_keywords': [],
    }
    return _json_from_response(response.text, fallback)


def generate_skill_gap(career, current_skills, required_skills):
    client = _client()
    if client is None:
        return {
            'missing_skills': 'Cloud, Testing, System Design',
            'priority': 'High',
            'difficulty': 'Medium',
            'learning_time': '4 weeks',
        }
    prompt = f"""Return JSON with missing_skills, priority, difficulty, learning_time for career {career}. Current skills: {current_skills}; required skills: {required_skills}"""
    response = client.generate_content(prompt)
    try:
        return json.loads(response.text)
    except Exception:
        return {'missing_skills': 'Cloud, Testing, System Design', 'priority': 'High', 'difficulty': 'Medium', 'learning_time': '4 weeks'}


def generate_learning_roadmap(career, weeks=8, context=None):
    """Generate a personalised week-by-week roadmap.

    context dict (all optional):
        current_skills, missing_skills, ats_score, resume_summary
    """
    context = context or {}
    client = _client()

    # Build a rich fallback that scales to the requested week count
    def _fallback():
        week_list = []
        topics_pool = [
            ['Core fundamentals and environment setup', 'Data structures overview'],
            ['Algorithms: sorting and searching', 'Time/space complexity'],
            ['Object-oriented programming patterns', 'Design principles (SOLID)'],
            ['System design basics', 'API design and REST conventions'],
            ['Database design and SQL', 'ORMs and query optimisation'],
            ['Testing strategies: unit, integration, e2e', 'CI/CD pipelines'],
            ['Cloud services overview (AWS/GCP/Azure)', 'Deployment and containers'],
            ['Monitoring, logging, and observability', 'Performance optimisation'],
            ['Security fundamentals', 'Authentication and authorisation patterns'],
            ['Advanced algorithms and competitive patterns', 'Dynamic programming'],
            ['Capstone project planning', 'Portfolio and resume polish'],
            ['Mock interviews and offer negotiation', 'Career strategy'],
        ]
        study_hours = [10, 12, 10, 12, 10, 14, 12, 10, 12, 14, 8, 6]
        for i in range(weeks):
            pool_idx = i % len(topics_pool)
            week_list.append({
                'week': f'Week {i + 1}',
                'topics': topics_pool[pool_idx],
                'practice': [f'Build a small {career}-related project using this week\'s concepts', 'Solve 3–5 related coding problems'],
                'mini_projects': [f'Week {i + 1} mini project: apply {topics_pool[pool_idx][0].lower()} in a real scenario'],
                'interview_prep': ['Practice 2 behavioural STAR stories', 'Review one system design topic'],
                'estimated_hours': study_hours[pool_idx % len(study_hours)],
            })
        return {'weeks': week_list}

    if client is None:
        return _fallback()

    current_skills = context.get('current_skills', '')
    missing_skills = context.get('missing_skills', '')
    ats_score = context.get('ats_score', '')
    resume_summary = context.get('resume_summary', '')

    context_block = ''
    if current_skills:
        context_block += f'\nCurrent skills: {current_skills}'
    if missing_skills:
        context_block += f'\nMissing skills to acquire: {missing_skills}'
    if ats_score:
        context_block += f'\nCurrent ATS score: {ats_score}/100'
    if resume_summary:
        context_block += f'\nResume summary: {resume_summary[:300]}'

    prompt = f"""You are a senior career coach and curriculum designer.
Generate a personalised {weeks}-week learning roadmap for someone targeting: {career}.
{context_block}

Return ONLY valid JSON in this exact structure (no markdown, no extra keys):
{{
  "weeks": [
    {{
      "week": "Week 1",
      "topics": ["topic 1", "topic 2"],
      "practice": ["task 1", "task 2"],
      "mini_projects": ["project description"],
      "interview_prep": ["prep task 1", "prep task 2"],
      "estimated_hours": 10
    }}
  ]
}}

Rules:
- Generate exactly {weeks} week objects.
- Distribute topics progressively: foundations first, advanced concepts later.
- Tailor topics to the missing skills and career role.
- Each week must have 2–4 topics, 2–3 practice tasks, 1 mini project, 2 interview prep items, and estimated_hours (integer 6–16).
- Do not add any key outside the structure above."""

    response = client.generate_content(prompt)
    result = _json_from_response(response.text, None)
    if result and isinstance(result.get('weeks'), list) and len(result['weeks']) >= 1:
        return result
    return _fallback()


def _fallback_interview_questions(role, count, company=''):
    base = [
            {
                'question': f'Walk me through a production-grade {role} project you built and the tradeoffs you made.',
                'category': 'resume-based',
                'expected_answer': 'A strong answer explains the problem, architecture, technologies, ownership, constraints, measurable outcome, and what you would improve.',
                'evaluation_criteria': ['clear structure', 'technical depth', 'ownership', 'tradeoff awareness', 'measurable impact'],
                'recruiter_expectations': 'The interviewer wants proof that you can connect implementation choices to user and business outcomes.',
                'common_mistakes': ['listing tools without decisions', 'skipping impact', 'using vague team language'],
                'hints': ['Use situation, action, result', 'Name the hardest technical constraint'],
                'follow_up_questions': ['What would break first at 10x scale?', 'How did you validate quality?'],
                'model_answer': f'I built a {role} project by defining the user workflow, designing API boundaries, adding tests, and measuring success through latency, reliability, and user completion metrics.',
            },
            {
                'question': 'Design a scalable system for storing resumes, running asynchronous AI analysis, and showing progress to users.',
                'category': 'system-design',
                'expected_answer': 'Discuss upload validation, object storage, metadata DB, queue workers, idempotent AI jobs, status polling/websockets, retries, and observability.',
                'evaluation_criteria': ['scalability', 'security', 'data modeling', 'async processing', 'failure handling'],
                'recruiter_expectations': 'They are testing whether you can move beyond CRUD and reason about production constraints.',
                'common_mistakes': ['running AI work synchronously', 'ignoring file security', 'no retry strategy'],
                'hints': ['Separate metadata from file storage', 'Make AI jobs idempotent'],
                'follow_up_questions': ['How would you rate limit analysis?', 'How would you protect PII?'],
                'model_answer': 'I would store validated files in private object storage, persist metadata in the database, enqueue analysis jobs, expose job status, and log every state transition for auditability.',
            },
            {
                'question': 'Tell me about a time you received critical feedback and changed your implementation.',
                'category': 'behavioral',
                'expected_answer': 'Use a concise STAR example that shows openness, judgment, and measurable improvement.',
                'evaluation_criteria': ['self-awareness', 'communication', 'adaptability', 'learning velocity'],
                'recruiter_expectations': 'The interviewer is assessing coachability and professional maturity.',
                'common_mistakes': ['blaming others', 'choosing a trivial example', 'no result'],
                'hints': ['Choose a real technical decision', 'Explain the before and after'],
                'follow_up_questions': ['What would you do differently now?', 'How did you rebuild trust?'],
                'model_answer': 'I initially optimized for speed, received feedback about maintainability, introduced clearer abstractions and tests, and reduced future defects while keeping delivery on track.',
            },
    ]
    if company:
        base.insert(0, {
            'question': f'Why {company}, and how would you prepare for its engineering interview loop?',
            'category': 'company-specific',
            'expected_answer': 'Connect the company mission, role requirements, likely interview style, and a targeted preparation plan.',
            'evaluation_criteria': ['company research', 'role alignment', 'preparation strategy'],
            'recruiter_expectations': 'They want evidence of intent, not a generic brand-name answer.',
            'common_mistakes': ['generic admiration', 'no role-specific connection'],
            'hints': ['Mention product area, engineering culture, and matching experience'],
            'follow_up_questions': ['Which team would you target?', 'What skill gap would you close first?'],
            'model_answer': f'I am targeting {company} because the role aligns with my work in scalable product engineering, and I would prepare through role-specific projects, coding practice, system design, and behavioral stories.',
        })
    return (base * ((count // len(base)) + 1))[:count]


def generate_interview_questions(role, difficulty, count, company=''):
    client = _client()
    if client is None:
        return _fallback_interview_questions(role, count, company)
    company_context = f" for {company}" if company else ''
    prompt = f"""Return ONLY a valid JSON array of {count} interview question objects for a {difficulty} {role} role{company_context}.
Each object must include question, category, expected_answer, evaluation_criteria, recruiter_expectations, common_mistakes, hints, follow_up_questions, and model_answer.
Mix technical, coding, system design, HR, behavioral, project-based, resume-based, scenario-based, database, OOP, and language-specific questions when relevant."""
    response = client.generate_content(prompt)
    data = _json_from_response(response.text, [])
    if isinstance(data, list):
        return data[:count]
    return _fallback_interview_questions(role, count, company)


def generate_feedback(role, answers, questions=None):
    client = _client()
    if client is None:
        per_answer_feedback = []
        for index, answer in enumerate(answers or []):
            question = ''
            if questions and index < len(questions):
                question = questions[index]
            per_answer_feedback.append({
                'question': question,
                'answer': answer,
                'score': 78 if answer else 45,
                'feedback': 'Good structure; add more concrete examples, tradeoffs, and measurable outcomes.' if answer else 'This answer needs a complete response with a clear example.',
                'confidence_assessment': 'Moderate confidence with room for sharper evidence.' if answer else 'Low confidence because no detailed answer was provided.',
                'suggested_better_answer': 'Use a concise STAR structure: context, your action, technical depth, measurable result, and one improvement you would make next.',
            })
        return {
            'technical_score': 80,
            'communication_score': 78,
            'confidence_score': 82,
            'problem_solving': 'Structured and thoughtful',
            'overall_rating': 80,
            'suggestions': 'Practice clearer examples and quantifiable impact.',
            'strengths': 'Clear structure and calm pacing',
            'risks': 'Add more quantified impact and ownership examples',
            'next_steps': 'Practice STAR stories and system design tradeoffs',
            'per_answer_feedback': per_answer_feedback,
        }
    prompt = f"""Return ONLY valid JSON with technical_score, communication_score, confidence_score, problem_solving, overall_rating, suggestions, strengths, risks, next_steps, and per_answer_feedback.
per_answer_feedback must be an array with one object per answer: question, answer, score, feedback, confidence_assessment, suggested_better_answer.
Role: {role}
Questions: {questions or []}
Answers: {answers}."""
    response = client.generate_content(prompt)
    fallback = {'technical_score': 75, 'communication_score': 75, 'confidence_score': 75, 'problem_solving': 'Needs more depth', 'overall_rating': 75, 'suggestions': 'Be more specific.', 'strengths': 'Solid basics', 'risks': 'Need sharper articulation', 'next_steps': 'Practice structured STAR answers', 'per_answer_feedback': []}
    return _json_from_response(response.text, fallback)


def match_resume_to_job(resume_text, job_description):
    if not resume_text and not job_description:
        return {'match_score': 0, 'summary': 'No resume or job description submitted.', 'matched_keywords': [], 'missing_keywords': []}

    resume_tokens = set(re.findall(r"[a-zA-Z0-9+#.]+", resume_text.lower()))
    job_tokens = set(re.findall(r"[a-zA-Z0-9+#.]+", job_description.lower()))
    common = sorted(resume_tokens & job_tokens)
    missing = sorted(job_tokens - resume_tokens)
    technical_catalog = {
        'python', 'java', 'javascript', 'typescript', 'react', 'django', 'flask', 'node', 'sql',
        'postgresql', 'mysql', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'apis',
        'machine', 'learning', 'tensorflow', 'pytorch', 'pandas', 'spark', 'redis', 'microservices',
    }
    soft_catalog = {'communication', 'leadership', 'collaboration', 'ownership', 'mentoring', 'stakeholder', 'agile'}
    missing_technical = sorted((job_tokens & technical_catalog) - resume_tokens)
    missing_soft = sorted((job_tokens & soft_catalog) - resume_tokens)

    match_score = min(100, max(0, int((len(common) / max(1, len(job_tokens))) * 100)))
    summary = 'Strong alignment' if match_score >= 70 else 'Needs stronger keyword alignment' if match_score >= 40 else 'Weak fit for this role'
    return {
        'match_score': match_score,
        'summary': f'{summary}. The score reflects direct terminology overlap between the resume and job description; improve it by adding truthful evidence for missing high-value requirements.',
        'matched_keywords': common[:10],
        'missing_keywords': missing[:10],
        'missing_technical_skills': missing_technical[:10],
        'missing_soft_skills': missing_soft[:10],
        'recommendations': [
            'Mirror important job-description language only when it accurately represents your experience.',
            'Rewrite project bullets to include the target stack, measurable impact, and production practices.',
            'Add a focused skills section grouped by language, framework, database, cloud, DevOps, and testing.',
            'Include one role-specific summary line that names the target title and strongest evidence.',
        ],
        'rewritten_examples': [
            'Built REST APIs with authentication, PostgreSQL persistence, validation, and deployment-ready error handling for a production-style SaaS workflow.',
            'Improved ATS relevance by aligning resume bullets with target requirements such as cloud deployment, API design, testing, and data security.',
        ],
        'ats_explanation': 'ATS systems parse sections, normalize keywords, compare titles and skills against the job description, and rank resumes that contain clear, repeated, context-rich evidence. Formatting and truthful keyword placement both matter.',
    }


ROLE_CATALOG = [
    {
        'company': 'NovaCloud',
        'role': 'Backend Engineer',
        'required_skills': ['python', 'django', 'rest', 'postgresql', 'docker', 'testing', 'aws'],
        'salary': '$105k - $145k',
        'location': 'Remote, US',
    },
    {
        'company': 'DataForge',
        'role': 'AI Engineer',
        'required_skills': ['python', 'machine learning', 'pandas', 'tensorflow', 'api', 'sql', 'aws'],
        'salary': '$115k - $165k',
        'location': 'Hybrid, Bengaluru',
    },
    {
        'company': 'FinPilot',
        'role': 'Full Stack Developer',
        'required_skills': ['react', 'javascript', 'python', 'django', 'postgresql', 'rest', 'git'],
        'salary': '$95k - $135k',
        'location': 'Remote',
    },
    {
        'company': 'ScaleOps',
        'role': 'DevOps-focused Software Engineer',
        'required_skills': ['python', 'docker', 'kubernetes', 'aws', 'ci/cd', 'testing', 'postgresql'],
        'salary': '$110k - $155k',
        'location': 'Austin, TX',
    },
    {
        'company': 'InsightGrid',
        'role': 'Data Analyst',
        'required_skills': ['sql', 'python', 'pandas', 'analytics', 'dashboard', 'communication', 'excel'],
        'salary': '$80k - $115k',
        'location': 'Remote, India',
    },
]


def _resume_skill_tokens(resume_text):
    text = (resume_text or '').lower()
    aliases = {
        'machine learning': ['machine learning', 'ml'],
        'ci/cd': ['ci/cd', 'ci cd', 'continuous integration'],
        'postgresql': ['postgresql', 'postgres'],
        'javascript': ['javascript', 'js'],
        'rest': ['rest', 'rest api', 'restful'],
        'dashboard': ['dashboard', 'dashboards', 'visualization', 'analytics'],
    }
    catalog = sorted({skill for role in ROLE_CATALOG for skill in role['required_skills']})
    found = set()
    for skill in catalog:
        candidates = aliases.get(skill, [skill])
        if any(re.search(rf'\b{re.escape(candidate)}\b', text) for candidate in candidates):
            found.add(skill)
    return found


def generate_job_matches(resume_text):
    resume_skills = _resume_skill_tokens(resume_text)
    matches = []
    for role in ROLE_CATALOG:
        required = set(role['required_skills'])
        matched = sorted(required & resume_skills)
        missing = sorted(required - resume_skills)
        match_percentage = round((len(matched) / max(1, len(required))) * 100)
        prep_focus = missing[:4] or ['role-specific project storytelling', 'system design tradeoffs']
        matches.append({
            **role,
            'match_percentage': match_percentage,
            'matched_skills': matched,
            'missing_skills': missing,
            'prep_guide': [
                f"Refresh {skill} with one practical project or proof point." for skill in prep_focus
            ] + [
                'Prepare two STAR stories that prove ownership, collaboration, and measurable impact.',
                'Rewrite one resume bullet to mirror the role requirements truthfully.',
            ],
        })
    return sorted(matches, key=lambda item: item['match_percentage'], reverse=True)


def generate_career_coach_response(question, context):
    resume = context.get('resume') or {}
    latest_analysis = context.get('latest_analysis') or {}
    interviews = context.get('interviews') or []
    roadmap = context.get('roadmap') or {}
    skill_gap = context.get('skill_gap') or {}
    coding = context.get('coding') or {}

    client = _client()
    if client is None:
        score = latest_analysis.get('ats_score') or 0
        resume_name = resume.get('filename') or 'your active resume'
        interview_count = len(interviews)
        roadmap_career = roadmap.get('career') or 'your target role'
        missing = skill_gap.get('missing_skills', '') or ''
        coding_total = coding.get('total', 0)
        coding_accepted = coding.get('accepted', 0)
        return (
            f"Based on {resume_name}, your current ATS signal is {score}/100, "
            f"you have {interview_count} interview session(s), "
            f"and {coding_accepted}/{coding_total} coding problems accepted. "
            f"For {roadmap_career}, focus on the highest-value gap first: "
            f"{missing or 'strengthen missing resume keywords and add measurable project results'}. "
            f"For your question: {question} — my recommendation is to pick one target role, "
            f"compare your resume against it, then spend this week improving proof for the top 3 missing skills."
        )

    prompt = f"""You are CareerPilot AI's personalized career coach.
Use the user's saved context below to answer their question with practical, specific, actionable guidance.
Reference resume details, ATS score, interview history, skill gaps, roadmap progress, and coding results when relevant.
Do not be generic. Be direct and give concrete next steps.

Context:
{json.dumps(context, default=str)[:9000]}

User question:
{question}
"""
    response = client.generate_content(prompt)
    return response.text.strip()


def explain_coding_solution(code, language, problem_title, problem_prompt='', status=''):
    """Return a structured AI explanation of a submitted coding solution."""
    client = _client()

    fallback = {
        'why_it_works': (
            f'This {language} solution addresses the problem by implementing the expected algorithm pattern. '
            'It processes the input and returns the correct output for the given test cases.'
        ),
        'data_structure': 'The solution uses appropriate data structures for this problem type.',
        'algorithm': 'The algorithm follows the standard approach for this category of problem.',
        'time_complexity': 'O(n) — linear in the size of the input.',
        'space_complexity': 'O(n) — proportional to the input in the worst case.',
        'optimizations': [
            'Consider edge cases: empty input, single element, all negatives.',
            'Profile with larger inputs to validate runtime assumptions.',
            'Review whether a two-pointer or sliding window approach applies.',
        ],
    }

    if client is None:
        return fallback

    prompt = f"""You are a senior software engineer explaining a coding solution to an interviewer.

Problem: {problem_title}
{('Problem description: ' + problem_prompt) if problem_prompt else ''}
Language: {language}
Submission status: {status or 'submitted'}

Code:
```{language}
{code[:3000]}
```

Return ONLY valid JSON with these exact keys:
{{
  "why_it_works": "2-3 sentences explaining the logic and correctness",
  "data_structure": "Name and purpose of the primary data structure used",
  "algorithm": "Algorithm or pattern name and brief description",
  "time_complexity": "Big-O with explanation",
  "space_complexity": "Big-O with explanation",
  "optimizations": ["improvement 1", "improvement 2", "improvement 3"]
}}"""

    response = client.generate_content(prompt)
    result = _json_from_response(response.text, None)
    if result and isinstance(result, dict) and 'why_it_works' in result:
        return result
    return fallback
