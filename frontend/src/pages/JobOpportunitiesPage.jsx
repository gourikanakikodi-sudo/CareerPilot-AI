import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PremiumShell from '../components/PremiumShell'
import { Card, Badge, Button, ProgressBar, SectionTitle } from '../components/UI'
import { CardSkeleton } from '../components/Skeletons'
import { useToast } from '../context/ToastContext'
import { useCareer } from '../context/CareerContext'
import api from '../services/api'

export default function JobOpportunitiesPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})   // { "Company-Role": true }
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const { resume: ctxResume, atsScore } = useCareer()

  useEffect(() => {
    api.get('/job-opportunities/')
      .then((res) => setData(res.data))
      .catch((err) => {
        const detail = err.response?.data?.detail || 'Unable to load job matches right now.'
        setError(detail)
      })
      .finally(() => setLoading(false))
  }, [])

  const saveToTracker = async (job) => {
    const key = `${job.company}-${job.role}`
    setSaving((prev) => ({ ...prev, [key]: true }))
    try {
      await api.post('/applications/', {
        company: job.company,
        role: job.role,
        location: job.location || '',
        salary_range: job.salary || '',
        job_url: '',
        status: 'saved',
        notes: `Match: ${job.match_percentage}%. Matched: ${(job.matched_skills || []).join(', ')}. Missing: ${(job.missing_skills || []).join(', ')}.`,
        source: 'job_match',
      })
      pushToast(`${job.role} at ${job.company} saved to tracker.`, 'success')
    } catch (err) {
      const detail = err.response?.data?.detail || 'Could not save to tracker.'
      pushToast(detail, 'danger')
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }))
    }
  }

  return (
    <PremiumShell title="Job Opportunities" subtitle="Resume-based role matching">
      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <CardSkeleton /><CardSkeleton />
        </div>
      ) : null}

      {error ? (
        <Card hover={false}>
          <p className="text-slate-300">{error}</p>
          <Button className="mt-4" onClick={() => navigate('/resume/upload')}>Upload resume</Button>
        </Card>
      ) : null}

      {data ? (
        <div className="space-y-4">
          {/* Header */}
          <Card hover={false}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Matched against{' '}
                  <span className="text-cyan-300">{data.resume?.filename || 'your active resume'}</span>
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Match % is computed from skills detected in your resume vs each role's requirements.
                  {atsScore > 0 ? ` Current ATS score: ${atsScore}/100.` : ''}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Badge tone="info">{data.matches?.length || 0} roles</Badge>
                <Button variant="secondary" onClick={() => navigate('/tracker')}>View tracker</Button>
              </div>
            </div>
          </Card>

          {/* Job cards */}
          <div className="grid gap-4 xl:grid-cols-2">
            {(data.matches || []).map((job) => {
              const key = `${job.company}-${job.role}`
              return (
                <Card key={key} hover={false}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm text-cyan-300">{job.company}</p>
                      <h3 className="mt-1 text-xl font-semibold text-white">{job.role}</h3>
                      <p className="mt-1 text-sm text-slate-400">{job.salary} · {job.location}</p>
                    </div>
                    <Badge tone={job.match_percentage >= 70 ? 'success' : job.match_percentage >= 40 ? 'warning' : 'danger'}>
                      {job.match_percentage}% match
                    </Badge>
                  </div>

                  <ProgressBar value={job.match_percentage} className="mt-4" />

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold text-white">Matched skills</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(job.matched_skills || []).map((s) => <Badge key={s} tone="success">{s}</Badge>)}
                        {!job.matched_skills?.length ? <span className="text-xs text-slate-400">None detected</span> : null}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Missing skills</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(job.missing_skills || []).map((s) => <Badge key={s} tone="warning">{s}</Badge>)}
                        {!job.missing_skills?.length ? <span className="text-xs text-emerald-400">Full coverage</span> : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold text-white">Prep guide</p>
                    <div className="mt-2 space-y-1.5">
                      {(job.prep_guide || []).map((step) => (
                        <p key={step} className="text-sm leading-6 text-slate-300">· {step}</p>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => saveToTracker(job)}
                      disabled={saving[key]}
                    >
                      {saving[key] ? 'Saving…' : '+ Save to tracker'}
                    </Button>
                    <Button variant="ghost" onClick={() => navigate('/skill-gap')}>
                      Skill gap
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      ) : null}
    </PremiumShell>
  )
}
