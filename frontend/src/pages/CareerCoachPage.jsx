import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PremiumShell from '../components/PremiumShell'
import { Card, Badge, Button, ProgressBar } from '../components/UI'
import { useToast } from '../context/ToastContext'
import { useCareer } from '../context/CareerContext'
import api from '../services/api'

const SUGGESTED_PROMPTS = [
  'Which missing skills should I learn first to get more interviews?',
  'How should I explain my projects in a behavioral interview?',
  'What role should I target with my current profile?',
  'Give me a 7-day plan to improve my ATS score.',
  'How do I negotiate a better offer after clearing an interview?',
  'What are the gaps between my resume and a senior engineer role?',
]

function ContextStat({ label, value, tone = 'default' }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <span className="text-xs text-slate-400">{label}</span>
      <Badge tone={tone} className="text-xs">{value}</Badge>
    </div>
  )
}

export default function CareerCoachPage() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const {
    resume, analysis, atsScore, resumeScore,
    roadmap, skillGap, coding, interviews,
    missingSkills, jobMatches, loading: ctxLoading,
  } = useCareer()

  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendMessage = async (text) => {
    const trimmed = (text ?? message).trim()
    if (!trimmed) return
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    setMessage('')
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/career-coach/', { message: trimmed })
      setMessages((prev) => [...prev, {
        role: 'coach',
        content: res.data.answer,
        context: res.data.context_used,
      }])
    } catch (err) {
      const detail = err.response?.data?.detail || 'Unable to reach the coach right now.'
      setError(detail)
      pushToast(detail, 'danger')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => { e.preventDefault(); sendMessage() }

  // Derive readiness label
  const atsLabel = atsScore >= 75 ? 'success' : atsScore >= 50 ? 'warning' : 'danger'
  const interviewAvg = interviews.length
    ? Math.round(
        interviews.reduce((sum, iv) => {
          const fbs = iv.feedbacks || []
          const avg = fbs.length
            ? fbs.reduce((s, f) => s + (f.overall_rating || 0), 0) / fbs.length
            : 0
          return sum + avg
        }, 0) / interviews.length
      )
    : 0

  const hasContext = Boolean(resume)

  return (
    <PremiumShell title="Career Coach" subtitle="Personalized guidance from your saved career data">
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">

        {/* Chat panel */}
        <Card hover={false}>
          {!hasContext && !ctxLoading ? (
            <div className="mb-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
              <p className="text-sm text-amber-200">
                Upload a resume first so the coach can give you personalised advice.
              </p>
              <Button variant="secondary" className="mt-3" onClick={() => navigate('/resume/upload')}>
                Upload resume →
              </Button>
            </div>
          ) : null}

          {/* Message thread */}
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-semibold text-white">Ask about your next career move</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  The coach reads your active resume, ATS analysis, interview history, skill gap, roadmap, and coding
                  progress to give you specific, actionable guidance.
                </p>
              </div>
            ) : (
              messages.map((item, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl border p-4 ${
                    item.role === 'user'
                      ? 'border-cyan-400/30 bg-cyan-500/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={item.role === 'user' ? 'info' : 'success'}>
                      {item.role === 'user' ? 'You' : 'Coach'}
                    </Badge>
                    {item.context ? (
                      <span className="text-xs text-slate-500">
                        context: resume {item.context.resume ? '✓' : '✗'} ·
                        ATS {item.context.latest_analysis ? '✓' : '✗'} ·
                        {item.context.interviews} interview{item.context.interviews !== 1 ? 's' : ''} ·
                        roadmap {item.context.roadmap ? '✓' : '✗'} ·
                        skill gap {item.context.skill_gap ? '✓' : '✗'}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-300">{item.content}</p>
                </div>
              ))
            )}

            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-ping rounded-full bg-cyan-400" />
                  <span className="text-sm text-slate-400">Coach is thinking...</span>
                </div>
              </div>
            ) : null}

            {error ? (
              <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>
            ) : null}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 md:flex-row">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              className="min-h-20 flex-1 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-100 outline-none focus:border-cyan-400/50"
              placeholder="Ask anything about your career…"
            />
            <Button className="md:self-end" disabled={loading || !message.trim()}>
              {loading ? 'Thinking…' : 'Send'}
            </Button>
          </form>
        </Card>

        {/* Right panel — context snapshot + quick prompts */}
        <div className="space-y-4">

          {/* Career context snapshot */}
          <Card hover={false}>
            <h3 className="text-sm font-semibold text-white">Your career snapshot</h3>
            <p className="mt-1 text-xs text-slate-500">Data the coach has access to</p>
            <div className="mt-3 space-y-2">
              <ContextStat
                label="Resume"
                value={resume ? resume.filename?.slice(0, 22) + (resume.filename?.length > 22 ? '…' : '') : 'None'}
                tone={resume ? 'success' : 'warning'}
              />
              <ContextStat label="ATS score" value={`${atsScore}/100`} tone={atsLabel} />
              <ContextStat label="Resume score" value={`${resumeScore}/100`} tone={resumeScore >= 75 ? 'success' : 'warning'} />
              <ContextStat
                label="Interview sessions"
                value={interviews.length}
                tone={interviews.length > 0 ? 'success' : 'warning'}
              />
              {interviewAvg > 0 ? (
                <ContextStat label="Avg interview score" value={`${interviewAvg}/100`} tone={interviewAvg >= 75 ? 'success' : 'warning'} />
              ) : null}
              <ContextStat
                label="Skill gap"
                value={skillGap ? skillGap.career : 'Not run'}
                tone={skillGap ? 'info' : 'warning'}
              />
              <ContextStat
                label="Roadmap"
                value={roadmap ? roadmap.career : 'None'}
                tone={roadmap ? 'info' : 'warning'}
              />
              <ContextStat
                label="Coding problems"
                value={`${coding.accepted}/${coding.total} accepted`}
                tone={coding.acceptance_rate >= 60 ? 'success' : coding.total > 0 ? 'warning' : 'default'}
              />
            </div>

            {missingSkills.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs text-slate-500">Missing skills</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {missingSkills.slice(0, 6).map((s) => (
                    <Badge key={s} tone="warning" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {jobMatches.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs text-slate-500">Top job matches</p>
                <div className="mt-2 space-y-2">
                  {jobMatches.slice(0, 2).map((j) => (
                    <div key={`${j.company}-${j.role}`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <p className="text-xs font-semibold text-white">{j.role}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs text-slate-400">{j.company}</span>
                        <Badge tone={j.match_percentage >= 70 ? 'success' : 'warning'} className="text-xs">
                          {j.match_percentage}%
                        </Badge>
                      </div>
                      <ProgressBar value={j.match_percentage} className="mt-1.5" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>

          {/* Suggested prompts */}
          <Card hover={false}>
            <h3 className="text-sm font-semibold text-white">Suggested questions</h3>
            <div className="mt-3 space-y-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  disabled={loading}
                  className="block w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-left text-xs text-slate-300 transition hover:border-cyan-300/40 hover:text-white disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </Card>

        </div>
      </div>
    </PremiumShell>
  )
}
