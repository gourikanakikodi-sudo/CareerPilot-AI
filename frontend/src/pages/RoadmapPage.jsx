import { useEffect, useState, useMemo } from 'react'
import PremiumShell from '../components/PremiumShell'
import { Badge, Button, Card, ProgressBar, Select, SectionTitle } from '../components/UI'
import { useToast } from '../context/ToastContext'
import { useCareer } from '../context/CareerContext'
import api from '../services/api'

const CAREER_OPTIONS = [
  'AI Engineer', 'Backend Developer', 'Full Stack Developer',
  'Data Scientist', 'Data Analyst', 'Machine Learning Engineer',
  'DevOps Engineer', 'Java Developer', 'Python Developer',
]

const WEEK_OPTIONS = [
  { label: '2 Weeks', value: 2 },
  { label: '4 Weeks', value: 4 },
  { label: '8 Weeks', value: 8 },
  { label: '12 Weeks', value: 12 },
  { label: 'Custom', value: 0 },
]

const CATEGORY_META = {
  topics:        { label: 'Learning topics',      color: 'text-cyan-300' },
  practice:      { label: 'Practice tasks',       color: 'text-violet-300' },
  mini_projects: { label: 'Mini project',         color: 'text-amber-300' },
  interview_prep:{ label: 'Interview prep',       color: 'text-emerald-300' },
}

// Compute overall % and current week from progress map + weeks array
function computeProgress(weeks, progress) {
  let total = 0
  let done = 0
  let currentWeek = 0

  weeks.forEach((week, idx) => {
    const weekLabel = week.week || week.title || `Week ${idx + 1}`
    let weekTotal = 0
    let weekDone = 0
    for (const cat of Object.keys(CATEGORY_META)) {
      for (const item of (week[cat] || [])) {
        const key = `${weekLabel}::${cat}::${item}`
        weekTotal++
        if (progress[key]) weekDone++
      }
    }
    total += weekTotal
    done += weekDone
    if (weekDone > 0 && weekDone < weekTotal) currentWeek = idx + 1
    if (weekDone === weekTotal && weekTotal > 0) currentWeek = idx + 1
  })

  return {
    overall: total ? Math.round((done / total) * 100) : 0,
    currentWeek: currentWeek || (weeks.length ? 1 : 0),
    done,
    total,
  }
}

export default function RoadmapPage() {
  const { pushToast } = useToast()
  const { analysis, skillGap, atsScore, refresh: refreshContext } = useCareer()

  // form state
  const [career, setCareer] = useState('AI Engineer')
  const [weeksOption, setWeeksOption] = useState(8)
  const [customWeeks, setCustomWeeks] = useState(6)
  const [generating, setGenerating] = useState(false)

  // roadmap state
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingTask, setSavingTask] = useState('')
  const [completingWeek, setCompletingWeek] = useState(null)
  const [expandedWeek, setExpandedWeek] = useState(0)

  const effectiveWeeks = weeksOption === 0 ? customWeeks : weeksOption

  const loadRoadmap = () => {
    setLoading(true)
    api.get('/learning-roadmap/')
      .then((res) => {
        setRoadmap(res.data)
        if (res.data?.career) setCareer(res.data.career)
      })
      .catch(() => setRoadmap(null))
      .finally(() => setLoading(false))
  }

  useEffect(loadRoadmap, [])

  // Pre-fill career from skill gap if available
  useEffect(() => {
    if (skillGap?.career) setCareer(skillGap.career)
  }, [skillGap])

  const handleGenerate = async (e) => {
    e.preventDefault()
    setGenerating(true)
    try {
      const payload = {
        career,
        weeks_count: effectiveWeeks,
        current_skills: skillGap?.current_skills || analysis?.keyword_report?.detected_skills?.join(', ') || '',
        missing_skills: skillGap?.missing_skills || analysis?.missing_skills || '',
        ats_score: atsScore || '',
        resume_summary: analysis?.summary?.slice(0, 300) || '',
      }
      const res = await api.post('/learning-roadmap/', payload)
      setRoadmap(res.data)
      setExpandedWeek(0)
      pushToast(`${effectiveWeeks}-week roadmap generated for ${career}.`, 'success')
      refreshContext()
    } catch (err) {
      pushToast(err.response?.data?.detail || 'Could not generate roadmap.', 'danger')
    } finally {
      setGenerating(false)
    }
  }

  const taskKey = (week, category, item) => {
    const label = week.week || week.title || 'Week'
    return `${label}::${category}::${item}`
  }

  const toggleTask = async (key) => {
    if (!roadmap?.id) return
    const current = Boolean(roadmap.roadmap?.progress?.[key])
    setSavingTask(key)
    try {
      const res = await api.patch(`/learning-roadmap/${roadmap.id}/progress/`, {
        task_id: key,
        completed: !current,
      })
      setRoadmap(res.data)
    } catch {
      pushToast('Could not save progress.', 'danger')
    } finally {
      setSavingTask('')
    }
  }

  const completeWeek = async (weekIndex, markDone) => {
    if (!roadmap?.id) return
    setCompletingWeek(weekIndex)
    try {
      const res = await api.patch(`/learning-roadmap/${roadmap.id}/complete-week/`, {
        week_index: weekIndex,
        completed: markDone,
      })
      setRoadmap(res.data)
      pushToast(markDone ? `Week ${weekIndex + 1} marked complete.` : `Week ${weekIndex + 1} reopened.`, 'success')
    } catch {
      pushToast('Could not update week.', 'danger')
    } finally {
      setCompletingWeek(null)
    }
  }

  const weeks = roadmap?.roadmap?.weeks || []
  const progress = roadmap?.roadmap?.progress || {}
  const stats = useMemo(() => computeProgress(weeks, progress), [weeks, progress])

  // Per-week completion check
  const isWeekComplete = (week, idx) => {
    const label = week.week || week.title || `Week ${idx + 1}`
    for (const cat of Object.keys(CATEGORY_META)) {
      for (const item of (week[cat] || [])) {
        if (!progress[`${label}::${cat}::${item}`]) return false
      }
    }
    return (week.topics || []).length > 0
  }

  return (
    <PremiumShell title="Learning Roadmap" subtitle="Personalised week-by-week career training plan">
      <div className="space-y-4">

        {/* Generation form */}
        <Card hover={false}>
          <SectionTitle
            title="Generate your roadmap"
            subtitle={
              skillGap
                ? `Auto-personalised from your ${skillGap.career} skill gap analysis`
                : 'Personalised from your resume and skill gap when available'
            }
          />
          <form onSubmit={handleGenerate} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-xs text-slate-400">Target career</label>
              <Select value={career} onChange={(e) => setCareer(e.target.value)}>
                {CAREER_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-slate-400">Duration</label>
              <Select value={weeksOption} onChange={(e) => setWeeksOption(Number(e.target.value))}>
                {WEEK_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>

            {weeksOption === 0 ? (
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">Custom weeks (1–52)</label>
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={customWeeks}
                  onChange={(e) => setCustomWeeks(Math.max(1, Math.min(52, Number(e.target.value))))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400/50"
                />
              </div>
            ) : (
              <div className="flex items-end">
                <Button disabled={generating} className="w-full">
                  {generating ? 'Generating…' : `Generate ${effectiveWeeks}-week plan`}
                </Button>
              </div>
            )}

            {weeksOption === 0 ? (
              <div className="sm:col-span-2 lg:col-span-4 flex justify-start">
                <Button disabled={generating}>
                  {generating ? 'Generating…' : `Generate ${effectiveWeeks}-week plan`}
                </Button>
              </div>
            ) : null}
          </form>
        </Card>

        {/* Loading skeleton */}
        {loading ? (
          <Card hover={false}>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-4 w-full animate-pulse rounded-full bg-white/10" />)}
            </div>
          </Card>
        ) : null}

        {/* No roadmap yet */}
        {!loading && !roadmap ? (
          <Card hover={false}>
            <p className="text-sm text-slate-400">
              No saved roadmap yet. Configure the options above and click Generate to build your personalised plan.
            </p>
          </Card>
        ) : null}

        {/* Progress summary */}
        {roadmap && weeks.length > 0 ? (
          <Card hover={false} className="border-cyan-400/20 bg-cyan-500/5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  {roadmap.career} · {roadmap.weeks_count || weeks.length}-week plan
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {stats.done} of {stats.total} tasks complete
                  {stats.currentWeek ? ` · Currently on Week ${stats.currentWeek}` : ''}
                </p>
              </div>
              <div className="w-full md:w-64">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Overall progress</span>
                  <span className="font-semibold text-white">{stats.overall}%</span>
                </div>
                <ProgressBar value={stats.overall} className="mt-2" />
              </div>
            </div>
          </Card>
        ) : null}

        {/* Week cards */}
        {roadmap && weeks.length > 0 ? (
          <div className="space-y-3">
            {weeks.map((week, weekIdx) => {
              const weekLabel = week.week || week.title || `Week ${weekIdx + 1}`
              const isExpanded = expandedWeek === weekIdx
              const done = isWeekComplete(week, weekIdx)

              // Per-week task count
              let wTotal = 0, wDone = 0
              for (const cat of Object.keys(CATEGORY_META)) {
                for (const item of (week[cat] || [])) {
                  wTotal++
                  if (progress[taskKey(week, cat, item)]) wDone++
                }
              }
              const weekPct = wTotal ? Math.round((wDone / wTotal) * 100) : 0

              return (
                <Card key={weekIdx} hover={false} className={done ? 'border-emerald-400/30 bg-emerald-500/5' : ''}>
                  {/* Week header */}
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 text-left"
                    onClick={() => setExpandedWeek(isExpanded ? -1 : weekIdx)}
                  >
                    <div className="flex items-center gap-3">
                      {done
                        ? <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm text-emerald-300">✓</span>
                        : <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 text-xs text-slate-400">{weekIdx + 1}</span>
                      }
                      <div>
                        <p className="font-semibold text-white">{weekLabel}</p>
                        <p className="text-xs text-slate-400">
                          {wDone}/{wTotal} tasks
                          {week.estimated_hours ? ` · ~${week.estimated_hours}h` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden w-28 sm:block">
                        <ProgressBar value={weekPct} />
                      </div>
                      <Badge tone={done ? 'success' : weekPct > 0 ? 'warning' : 'default'}>
                        {done ? 'Complete' : weekPct > 0 ? 'In progress' : 'Not started'}
                      </Badge>
                      <span className="text-slate-400">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded ? (
                    <div className="mt-5 space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        {Object.entries(CATEGORY_META).map(([cat, meta]) => {
                          const items = week[cat] || []
                          if (!items.length) return null
                          return (
                            <div key={cat}>
                              <p className={`mb-2 text-sm font-semibold ${meta.color}`}>{meta.label}</p>
                              <div className="space-y-2">
                                {items.map((item) => {
                                  const key = taskKey(week, cat, item)
                                  const completed = Boolean(progress[key])
                                  return (
                                    <button
                                      key={key}
                                      type="button"
                                      onClick={() => toggleTask(key)}
                                      disabled={savingTask === key}
                                      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left text-sm transition ${
                                        completed
                                          ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100'
                                          : 'border-white/10 bg-slate-950/40 text-slate-300 hover:border-cyan-300/40'
                                      }`}
                                    >
                                      <span className={`shrink-0 text-base ${completed ? 'text-emerald-400' : 'text-slate-600'}`}>
                                        {completed ? '●' : '○'}
                                      </span>
                                      <span className="flex-1">{item}</span>
                                      {savingTask === key
                                        ? <span className="text-xs text-slate-500">saving…</span>
                                        : <span className="shrink-0 text-xs text-slate-500">{completed ? 'Done' : 'Open'}</span>
                                      }
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Mark week complete / reopen */}
                      <div className="flex gap-2 border-t border-white/10 pt-4">
                        {!done ? (
                          <Button
                            variant="secondary"
                            onClick={() => completeWeek(weekIdx, true)}
                            disabled={completingWeek === weekIdx}
                          >
                            {completingWeek === weekIdx ? 'Saving…' : '✓ Mark week complete'}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            onClick={() => completeWeek(weekIdx, false)}
                            disabled={completingWeek === weekIdx}
                          >
                            Reopen week
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : null}
                </Card>
              )
            })}
          </div>
        ) : null}

      </div>
    </PremiumShell>
  )
}
