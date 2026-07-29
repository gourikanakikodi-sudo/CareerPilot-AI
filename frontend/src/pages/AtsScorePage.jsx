import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Chart from 'chart.js/auto'
import PremiumShell from '../components/PremiumShell'
import { Badge, Button, Card, ProgressBar } from '../components/UI'
import { useToast } from '../context/ToastContext'
import api from '../services/api'

function AtsBreakdownChart({ breakdown }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !breakdown) return undefined
    const entries = Object.entries(breakdown)
    const chart = new Chart(canvasRef.current, {
      type: 'radar',
      data: {
        labels: entries.map(([key]) => key.replaceAll('_', ' ')),
        datasets: [{
          label: 'ATS score',
          data: entries.map(([, value]) => value),
          borderColor: '#22d3ee',
          backgroundColor: 'rgba(34, 211, 238, 0.18)',
          pointBackgroundColor: '#a78bfa',
        }],
      },
      options: {
        responsive: true,
        scales: {
          r: {
            min: 0,
            max: 100,
            grid: { color: 'rgba(148, 163, 184, 0.22)' },
            angleLines: { color: 'rgba(148, 163, 184, 0.22)' },
            pointLabels: { color: '#cbd5e1' },
            ticks: { display: false },
          },
        },
        plugins: {
          legend: { labels: { color: '#e2e8f0' } },
        },
      },
    })
    return () => chart.destroy()
  }, [breakdown])

  return <canvas ref={canvasRef} className="max-h-80" />
}

export default function AtsScorePage() {
  const [resume, setResume] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [score, setScore] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { pushToast } = useToast()

  useEffect(() => {
    api.get('/resumes/latest/')
      .then((res) => {
        setResume(res.data)
        localStorage.setItem('resume_id', res.data.id)
      })
      .catch(() => setError('Upload a resume before running ATS comparison.'))
  }, [])

  const runAts = async (e) => {
    e.preventDefault()
    if (!resume) return
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/ats-score/', { resume_id: resume.id, job_description: jobDescription })
      setScore(res.data)
      pushToast('ATS comparison complete.', 'success')
    } catch (err) {
      if (err.response?.status === 404) {
        localStorage.removeItem('resume_id')
        setResume(null)
        setError('Upload a resume before running ATS comparison.')
        pushToast('Upload a resume before ATS comparison.', 'danger')
      } else {
        setError('Unable to run ATS comparison right now.')
        pushToast('Unable to run ATS comparison right now.', 'danger')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <PremiumShell title="ATS checker" subtitle="Compare your active resume against a target job">
      {error ? (
        <Card hover={false}>
          <p className="text-slate-300">{error}</p>
          <Button className="mt-4" onClick={() => navigate('/resume/upload')}>Upload resume</Button>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card hover={false}>
          <h2 className="text-lg font-semibold text-white">Active resume</h2>
          {resume ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white">{resume.filename}</p>
              <p className="mt-1 text-sm text-slate-400">{Math.max(1, Math.round(resume.file_size / 1024))} KB uploaded {new Date(resume.created_at).toLocaleDateString()}</p>
            </div>
          ) : <p className="mt-4 text-sm text-slate-400">No active resume selected.</p>}
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/resume/management')}>Change resume</Button>
        </Card>

        <Card hover={false}>
          <form onSubmit={runAts}>
            <h2 className="text-lg font-semibold text-white">Job description</h2>
            <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the complete job description here..." className="mt-4 min-h-52 w-full rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-100 outline-none focus:border-cyan-400/50" />
            <Button className="mt-4" disabled={!resume || loading}>{loading ? 'Checking...' : 'Run ATS comparison'}</Button>
          </form>
        </Card>
      </div>

      {score ? (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card hover={false}>
              <p className="text-sm text-slate-400">ATS structure</p>
              <p className="mt-2 text-4xl font-semibold text-white">{score.overall_score}/100</p>
              <ProgressBar value={score.overall_score} className="mt-4" />
            </Card>
            <Card hover={false}>
              <p className="text-sm text-slate-400">Job match</p>
              <p className="mt-2 text-4xl font-semibold text-white">{score.match_score}/100</p>
              <ProgressBar value={score.match_score} className="mt-4" />
            </Card>
            <Card hover={false}>
              <p className="text-sm text-slate-400">Keyword match</p>
              <p className="mt-2 text-4xl font-semibold text-white">{score.keyword_match_percentage || 0}%</p>
              <ProgressBar value={score.keyword_match_percentage || 0} className="mt-4" />
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card hover={false}>
              <p className="text-sm text-slate-400">Formatting score</p>
              <p className="mt-2 text-4xl font-semibold text-white">{score.formatting_score || 0}/100</p>
              <ProgressBar value={score.formatting_score || 0} className="mt-4" />
            </Card>
            <Card hover={false}>
              <p className="text-sm text-slate-400">Readability</p>
              <p className="mt-2 text-4xl font-semibold text-white">{score.readability || 0}/100</p>
              <ProgressBar value={score.readability || 0} className="mt-4" />
            </Card>
            <Card hover={false}>
              <p className="text-sm text-slate-400">Recruiter summary</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">{score.summary}</p>
            </Card>
          </div>

          <Card hover={false}>
            <h3 className="text-lg font-semibold text-white">ATS breakdown</h3>
            <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <AtsBreakdownChart breakdown={score.breakdown || {}} />
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(score.breakdown || {}).map(([key, value]) => (
                  <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <span className="capitalize text-slate-300">{key}</span>
                      <span className="font-semibold text-white">{value}</span>
                    </div>
                    <ProgressBar value={value} className="mt-3" />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {[
              ['Matched keywords', score.matched_keywords, 'success'],
              ['Missing keywords', score.missing_keywords, 'warning'],
              ['Technical skills found', score.technical_skills, 'success'],
              ['Soft skills found', score.soft_skills, 'info'],
              ['Missing technical skills', score.missing_technical_skills, 'danger'],
              ['Missing soft skills', score.missing_soft_skills, 'info'],
            ].map(([title, items, tone]) => (
              <Card key={title} hover={false}>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(items || []).map((item) => <Badge key={item} tone={tone}>{item}</Badge>)}
                </div>
              </Card>
            ))}
          </div>

          <Card hover={false}>
            <h3 className="text-lg font-semibold text-white">Optimization plan</h3>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {(score.recommendations || []).map((item) => <p key={item} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">{item}</p>)}
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">{score.ats_explanation}</p>
          </Card>
        </>
      ) : null}
    </PremiumShell>
  )
}
