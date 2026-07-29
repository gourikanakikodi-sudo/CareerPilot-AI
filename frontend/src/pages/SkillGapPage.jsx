import { useEffect, useState } from 'react'
import PremiumShell from '../components/PremiumShell'
import { Badge, Button, Card, Select } from '../components/UI'
import { useToast } from '../context/ToastContext'
import { useCareer } from '../context/CareerContext'
import api from '../services/api'

const CAREER_OPTIONS = [
  'AI Engineer', 'Backend Developer', 'Full Stack Developer',
  'Data Analyst', 'Data Scientist', 'Java Developer', 'Python Developer',
  'DevOps Engineer', 'Machine Learning Engineer',
]

export default function SkillGapPage() {
  const { analysis, skillGap: savedGap, resume, refresh } = useCareer()
  const { pushToast } = useToast()

  const [career, setCareer] = useState('AI Engineer')
  const [currentSkills, setCurrentSkills] = useState('')
  const [requiredSkills, setRequiredSkills] = useState('Machine Learning, LangChain, Cloud, Docker, Testing')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  // Pre-fill from resume analysis if available
  useEffect(() => {
    if (savedGap) {
      setResult(savedGap)
      setCareer(savedGap.career || 'AI Engineer')
      setCurrentSkills(savedGap.current_skills || '')
    } else if (analysis) {
      const detected = analysis.keyword_report?.detected_skills || []
      setCurrentSkills(detected.join(', '))
    }
  }, [savedGap, analysis])

  // Pre-fill current skills from resume keyword report
  useEffect(() => {
    if (!currentSkills && analysis?.keyword_report?.detected_skills?.length) {
      setCurrentSkills(analysis.keyword_report.detected_skills.join(', '))
    }
  }, [analysis])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/skill-gap/', {
        career,
        current_skills: currentSkills,
        required_skills: requiredSkills,
      })
      setResult(res.data)
      pushToast('Skill gap analysis complete.', 'success')
      refresh()
    } catch (err) {
      pushToast(err.response?.data?.detail || 'Analysis failed.', 'danger')
    } finally {
      setLoading(false)
    }
  }

  const missingList = result?.missing_skills
    ? result.missing_skills.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  return (
    <PremiumShell title="Skill Gap Analysis" subtitle="Compare your skills against your target role">
      <div className="space-y-4">
        <Card hover={false}>
          <h2 className="text-lg font-semibold text-white">Analyze your skill gap</h2>
          <p className="mt-1 text-sm text-slate-400">
            {resume
              ? `Skills auto-detected from "${resume.filename}". Adjust as needed.`
              : 'Upload a resume to auto-detect your current skills.'}
          </p>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-slate-400">Target career</label>
              <Select value={career} onChange={(e) => setCareer(e.target.value)}>
                {CAREER_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-400">Your current skills (comma-separated)</label>
              <textarea
                value={currentSkills}
                onChange={(e) => setCurrentSkills(e.target.value)}
                className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-100 outline-none focus:border-cyan-400/50"
                placeholder="Python, Django, REST APIs, PostgreSQL..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-400">Required skills for target role (comma-separated)</label>
              <textarea
                value={requiredSkills}
                onChange={(e) => setRequiredSkills(e.target.value)}
                className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-100 outline-none focus:border-cyan-400/50"
                placeholder="Machine Learning, Cloud, Docker..."
              />
            </div>
            <Button disabled={loading}>{loading ? 'Analyzing...' : 'Generate gap analysis'}</Button>
          </form>
        </Card>

        {result ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card hover={false}>
              <h3 className="text-lg font-semibold text-white">Missing skills</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {missingList.length
                  ? missingList.map((s) => <Badge key={s} tone="warning">{s}</Badge>)
                  : <p className="text-sm text-slate-400">No missing skills detected — great coverage!</p>}
              </div>
            </Card>
            <Card hover={false}>
              <h3 className="text-lg font-semibold text-white">Analysis details</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                <li><span className="font-semibold text-white">Priority:</span> {result.priority || '—'}</li>
                <li><span className="font-semibold text-white">Difficulty:</span> {result.difficulty || '—'}</li>
                <li><span className="font-semibold text-white">Estimated learning time:</span> {result.learning_time || '—'}</li>
                {result.career ? <li><span className="font-semibold text-white">Target role:</span> {result.career}</li> : null}
              </ul>
            </Card>
            <Card hover={false} className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-white">Next steps</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Focus on <span className="text-cyan-300">{missingList.slice(0, 3).join(', ') || 'the identified gaps'}</span> first —
                they have the highest hiring value for <span className="text-cyan-300">{result.career || career}</span> roles.
                Add each skill as a project in your resume and generate a fresh learning roadmap to track your progress.
              </p>
              <div className="mt-4 flex gap-3">
                <Button variant="secondary" onClick={() => window.location.href = '/roadmap'}>Generate roadmap</Button>
                <Button variant="secondary" onClick={() => window.location.href = '/coach'}>Ask Career Coach</Button>
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </PremiumShell>
  )
}
