import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PremiumShell from '../components/PremiumShell'
import { Badge, Button, Card, ProgressBar, SectionTitle } from '../components/UI'
import { useCareer } from '../context/CareerContext'
import api from '../services/api'

// ── small helpers ──────────────────────────────────────────────────
function ScoreCard({ label, value, max = 100, to, tone }) {
  const pct = max === 100 ? value : Math.round((value / max) * 100)
  const color =
    tone === 'success' ? 'text-emerald-300'
    : tone === 'warning' ? 'text-amber-300'
    : tone === 'danger'  ? 'text-rose-300'
    : 'text-white'
  return (
    <Link to={to || '#'}>
      <Card className="h-full cursor-pointer hover:border-cyan-400/30">
        <p className="text-sm text-slate-400">{label}</p>
        <p className={`mt-2 text-4xl font-semibold ${color}`}>{value}{max === 100 ? '/100' : `/${max}`}</p>
        <ProgressBar value={pct} className="mt-4" />
      </Card>
    </Link>
  )
}

function ActivityIcon({ type }) {
  const map = { resume_analysis: '📄', interview: '🎙️', coding: '💻' }
  return <span className="text-base">{map[type] || '📌'}</span>
}

function PriorityDot({ priority }) {
  const map = { high: 'bg-rose-400', medium: 'bg-amber-400', low: 'bg-emerald-400' }
  return <span className={`inline-block h-2 w-2 rounded-full ${map[priority] || 'bg-slate-400'}`} />
}

// ── main page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate()
  const { refresh } = useCareer()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/')
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false))
  }, [])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const res = await api.get('/dashboard/')
      setSummary(res.data)
      refresh()
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <PremiumShell title="Overview" subtitle="Career command center">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} hover={false}>
              <div className="h-4 w-24 animate-pulse rounded-full bg-white/10" />
              <div className="mt-3 h-8 w-16 animate-pulse rounded-full bg-white/10" />
              <div className="mt-4 h-2 w-full animate-pulse rounded-full bg-white/10" />
            </Card>
          ))}
        </div>
      </PremiumShell>
    )
  }

  const noResume = !summary || summary.uploaded_resumes === 0
  const resumeHealth = summary?.resume_health || {}
  const learningProgress = summary?.learning_progress || {}
  const interviewReadiness = summary?.interview_readiness || {}
  const codingProgress = summary?.coding_progress || {}
  const missingSkills = summary?.missing_skills || []
  const recommendedJobs = summary?.recommended_jobs || []
  const recentActivity = summary?.recent_activity || []
  const nextAction = summary?.next_action || null

  return (
    <PremiumShell title="Overview" subtitle="Career command center">
      <div className="space-y-5">

        {/* Welcome banner */}
        <Card hover={false} className="bg-gradient-to-r from-cyan-500/10 to-violet-500/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white">
                {summary?.welcome_message || 'Welcome back!'}
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                {summary?.uploaded_resumes ?? 0} resume{summary?.uploaded_resumes !== 1 ? 's' : ''} uploaded ·
                ATS {summary?.latest_ats_score ?? 0}/100 · {interviewReadiness.total_sessions ?? 0} interview sessions
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleRefresh}>Refresh</Button>
              {noResume
                ? <Button onClick={() => navigate('/resume/upload')}>Upload resume</Button>
                : <Button onClick={() => navigate('/resume/analysis')}>View analysis</Button>}
            </div>
          </div>
        </Card>

        {/* Today's next action */}
        {nextAction ? (
          <Card hover={false} className="border-amber-400/25 bg-amber-500/5">
            <div className="flex items-center gap-3">
              <PriorityDot priority={nextAction.priority} />
              <p className="text-sm font-semibold text-white">Today's priority action</p>
              <Badge tone={nextAction.priority === 'high' ? 'danger' : nextAction.priority === 'medium' ? 'warning' : 'success'}>
                {nextAction.priority}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-slate-300">{nextAction.action}</p>
            <Button variant="secondary" className="mt-3" onClick={() => navigate(nextAction.link)}>
              Go →
            </Button>
          </Card>
        ) : null}

        {/* 6-metric score grid */}
        <div>
          <SectionTitle title="Career metrics" subtitle="Scores from your latest activity" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <ScoreCard
              label="Resume health"
              value={resumeHealth.score ?? summary?.resume_score ?? 0}
              to="/resume/analysis"
              tone={resumeHealth.score >= 80 ? 'success' : resumeHealth.score >= 60 ? 'warning' : 'danger'}
            />
            <ScoreCard
              label="ATS score"
              value={resumeHealth.ats_score ?? summary?.latest_ats_score ?? 0}
              to="/ats"
              tone={(resumeHealth.ats_score ?? 0) >= 75 ? 'success' : (resumeHealth.ats_score ?? 0) >= 50 ? 'warning' : 'danger'}
            />
            <ScoreCard
              label="Learning progress"
              value={Math.round(learningProgress.completion_pct ?? 0)}
              to="/roadmap"
              tone={(learningProgress.completion_pct ?? 0) >= 50 ? 'success' : 'warning'}
            />
            <ScoreCard
              label="Interview readiness"
              value={interviewReadiness.last_score ?? interviewReadiness.avg_score ?? 0}
              to="/interview"
              tone={(interviewReadiness.last_score ?? 0) >= 75 ? 'success' : 'warning'}
            />
            <ScoreCard
              label="Coding acceptance"
              value={codingProgress.acceptance_rate ?? 0}
              to="/coding"
              tone={(codingProgress.acceptance_rate ?? 0) >= 60 ? 'success' : 'warning'}
            />
            <ScoreCard
              label="Avg interview score"
              value={Math.round(summary?.average_interview_score ?? 0)}
              to="/interview"
              tone={(summary?.average_interview_score ?? 0) >= 75 ? 'success' : 'warning'}
            />
          </div>
        </div>

        {/* Missing skills + recommended jobs */}
        <div className="grid gap-4 lg:grid-cols-2">

          <Card hover={false}>
            <SectionTitle
              title="Missing skills"
              subtitle="From your latest skill gap or resume analysis"
              action={<Button variant="ghost" className="text-xs" onClick={() => navigate('/skill-gap')}>Analyze →</Button>}
            />
            <div className="mt-4 min-h-[60px]">
              {missingSkills.length ? (
                <div className="flex flex-wrap gap-2">
                  {missingSkills.map((s) => (
                    <Badge key={s} tone="warning">{s}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  {noResume
                    ? 'Upload a resume to detect missing skills.'
                    : 'Run a skill gap analysis to see what to learn next.'}
                </p>
              )}
            </div>
            {missingSkills.length ? (
              <Button variant="secondary" className="mt-4" onClick={() => navigate('/roadmap')}>
                Build learning roadmap
              </Button>
            ) : null}
          </Card>

          <Card hover={false}>
            <SectionTitle
              title="Recommended jobs"
              subtitle="Top matches from your active resume"
              action={<Button variant="ghost" className="text-xs" onClick={() => navigate('/jobs')}>All jobs →</Button>}
            />
            <div className="mt-4 space-y-3">
              {recommendedJobs.length ? (
                recommendedJobs.map((job) => (
                  <div key={`${job.company}-${job.role}`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{job.role}</p>
                      <p className="text-xs text-slate-400">{job.company} · {job.location}</p>
                    </div>
                    <Badge tone={job.match_percentage >= 70 ? 'success' : job.match_percentage >= 40 ? 'warning' : 'danger'}>
                      {job.match_percentage}%
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">
                  {noResume ? 'Upload a resume to see job matches.' : 'No matches yet — check the Job Opportunities page.'}
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Coding progress detail + learning roadmap progress */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card hover={false}>
            <SectionTitle
              title="Coding practice"
              subtitle="Problems solved this session"
              action={<Button variant="ghost" className="text-xs" onClick={() => navigate('/coding')}>Practice →</Button>}
            />
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Total', value: codingProgress.total ?? 0 },
                { label: 'Accepted', value: codingProgress.accepted ?? 0 },
                { label: 'Rate', value: `${codingProgress.acceptance_rate ?? 0}%` },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 py-4">
                  <p className="text-2xl font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card hover={false}>
            <SectionTitle
              title="Learning roadmap"
              subtitle={learningProgress.career || 'No roadmap yet'}
              action={<Button variant="ghost" className="text-xs" onClick={() => navigate('/roadmap')}>View →</Button>}
            />
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Progress</span>
                <span className="font-semibold text-white">{Math.round(learningProgress.completion_pct ?? 0)}%</span>
              </div>
              <ProgressBar value={learningProgress.completion_pct ?? 0} className="mt-2" />
              {!learningProgress.career ? (
                <Button variant="secondary" className="mt-4" onClick={() => navigate('/roadmap')}>
                  Generate roadmap
                </Button>
              ) : null}
            </div>
          </Card>
        </div>

        {/* Recent activity */}
        <Card hover={false}>
          <SectionTitle title="Recent activity" subtitle="Your last 6 actions across all modules" />
          <div className="mt-4 space-y-2">
            {recentActivity.length ? (
              recentActivity.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <ActivityIcon type={item.type} />
                  <div className="flex-1">
                    <p className="text-sm text-slate-200">{item.label}</p>
                    <p className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">
                No activity yet. Upload a resume to get started.
              </p>
            )}
          </div>
        </Card>

        {/* Quick navigation row */}
        <Card hover={false}>
          <SectionTitle title="Quick actions" />
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { label: 'Upload resume',    to: '/resume/upload' },
              { label: 'ATS check',        to: '/ats' },
              { label: 'Skill gap',        to: '/skill-gap' },
              { label: 'Mock interview',   to: '/interview' },
              { label: 'Coding practice',  to: '/coding' },
              { label: 'Learning roadmap', to: '/roadmap' },
              { label: 'Job matches',      to: '/jobs' },
              { label: 'App tracker',      to: '/tracker' },
              { label: 'Career coach',     to: '/coach' },
            ].map((item) => (
              <Button key={item.to} variant="secondary" onClick={() => navigate(item.to)}>
                {item.label}
              </Button>
            ))}
          </div>
        </Card>

      </div>
    </PremiumShell>
  )
}
