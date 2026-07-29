import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PremiumShell from '../components/PremiumShell'
import { Badge, Button, Card, ProgressBar } from '../components/UI'
import api from '../services/api'

function TextBlock({ title, children }) {
  return (
    <Card hover={false}>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-300">{children || 'No signal available yet.'}</p>
    </Card>
  )
}

export default function ResumeAnalysisPage() {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        let resumeId = localStorage.getItem('resume_id')
        if (!resumeId) {
          const latest = await api.get('/resumes/latest/')
          resumeId = latest.data.id
          localStorage.setItem('resume_id', resumeId)
        }
        try {
          const res = await api.post('/resume-analysis/', { resume_id: resumeId })
          setAnalysis(res.data)
        } catch (err) {
          if (err.response?.status !== 404) throw err
          const latest = await api.get('/resumes/latest/')
          localStorage.setItem('resume_id', latest.data.id)
          const res = await api.post('/resume-analysis/', { resume_id: latest.data.id })
          setAnalysis(res.data)
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Upload a resume before running analysis.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <PremiumShell title="Resume intelligence" subtitle="Generating recruiter-grade feedback"><Card hover={false}>Analyzing resume...</Card></PremiumShell>
  }

  if (error) {
    return (
      <PremiumShell title="Resume intelligence" subtitle="No resume found">
        <Card hover={false}>
          <p className="text-slate-300">{error}</p>
          <Button className="mt-4" onClick={() => navigate('/resume/upload')}>Upload resume</Button>
        </Card>
      </PremiumShell>
    )
  }

  const sections = analysis.section_analysis || []
  const keywordReport = analysis.keyword_report || {}
  const details = analysis.detailed_report || {}

  return (
    <PremiumShell title="Resume intelligence" subtitle={analysis.resume?.filename || 'Detailed AI resume report'}>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card hover={false}>
          <p className="text-sm text-slate-400">Resume rating</p>
          <p className="mt-2 text-4xl font-semibold text-white">{analysis.resume_rating}/100</p>
          <ProgressBar value={analysis.resume_rating} className="mt-4" />
        </Card>
        <Card hover={false}>
          <p className="text-sm text-slate-400">ATS readiness</p>
          <p className="mt-2 text-4xl font-semibold text-white">{analysis.ats_score}/100</p>
          <ProgressBar value={analysis.ats_score} className="mt-4" />
        </Card>
        <Card hover={false}>
          <p className="text-sm text-slate-400">Recruiter signal</p>
          <p className="mt-2 text-4xl font-semibold text-white">{details.recruiter_score || analysis.resume_rating}/100</p>
          <p className="mt-3 text-sm text-slate-400">{details.employability || 'Improve measurable impact to raise recruiter confidence.'}</p>
        </Card>
      </div>

      <TextBlock title="Executive summary">{analysis.summary}</TextBlock>

      <div className="grid gap-4 lg:grid-cols-2">
        <TextBlock title="Strengths">{analysis.strengths}</TextBlock>
        <TextBlock title="Weaknesses">{analysis.weaknesses}</TextBlock>
        <TextBlock title="Grammar and readability">{analysis.grammar_suggestions}</TextBlock>
        <TextBlock title="Formatting and ATS structure">{analysis.formatting_suggestions}</TextBlock>
        <TextBlock title="Keyword strategy">{analysis.keyword_suggestions}</TextBlock>
        <TextBlock title="Project review">{analysis.project_review}</TextBlock>
      </div>

      <Card hover={false}>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold text-white">Keyword report</h3>
          <Badge tone="info">{keywordReport.keyword_match_percentage || analysis.ats_score}% keyword strength</Badge>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {['detected_skills', 'missing_keywords', 'soft_skills'].map((key) => (
            <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold capitalize text-white">{key.replaceAll('_', ' ')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(keywordReport[key] || []).map((item) => <Badge key={item}>{item}</Badge>)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.section} hover={false}>
            <h3 className="text-lg font-semibold text-white">{section.section}</h3>
            <p className="mt-3 text-sm text-slate-300"><span className="text-cyan-300">Strength:</span> {section.strengths}</p>
            <p className="mt-2 text-sm text-slate-300"><span className="text-amber-300">Gap:</span> {section.weaknesses}</p>
            <p className="mt-2 text-sm text-slate-300"><span className="text-emerald-300">Recommendation:</span> {section.recommendation}</p>
            {section.example ? <p className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">{section.example}</p> : null}
          </Card>
        ))}
      </div>

      <Card hover={false}>
        <h3 className="text-lg font-semibold text-white">Rewritten examples</h3>
        <div className="mt-4 space-y-3">
          {(analysis.rewritten_examples || []).map((example) => <p key={example} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">{example}</p>)}
        </div>
      </Card>
    </PremiumShell>
  )
}
