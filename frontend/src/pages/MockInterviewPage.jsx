import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PremiumShell from '../components/PremiumShell'
import { Badge, Button, Card, Input, Select } from '../components/UI'
import { useToast } from '../context/ToastContext'
import api from '../services/api'

const counts = [10, 20, 30, 50, 100]

export default function MockInterviewPage() {
  const [form, setForm] = useState({
    role: 'AI Engineer',
    company: '',
    difficulty: 'medium',
    interview_type: 'technical',
    experience: '0-2 years',
    stack: 'Python, Django, React, SQL',
    count: 10,
  })
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  const [interviewId, setInterviewId] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { pushToast } = useToast()

  const loadHistory = () => {
    api.get('/interview/history/')
      .then((response) => setHistory(response.data))
      .catch(() => setHistory([]))
  }

  useEffect(loadHistory, [])

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const handleGenerate = async (e) => {
    e.preventDefault()
    setLoading(true)
    const response = await api.post('/interview/questions/', form)
    setInterviewId(response.data.interview_id)
    setQuestions(response.data.questions)
    setAnswers(new Array(response.data.questions.length).fill(''))
    pushToast('Interview question set generated.', 'success')
    setLoading(false)
  }

  const handleSubmit = async () => {
    const response = await api.post('/interview/submit/', { interview_id: interviewId, answers })
    localStorage.setItem('feedback', JSON.stringify(response.data))
    pushToast('Interview feedback saved to history.', 'success')
    loadHistory()
    navigate('/interview/result')
  }

  const questionText = (item) => typeof item === 'string' ? item : item.question

  return (
    <PremiumShell title="AI interview generator" subtitle="Company-aware practice with expected answers and evaluation rubrics">
      <Card hover={false}>
        <form onSubmit={handleGenerate} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Input value={form.role} onChange={(e) => update('role', e.target.value)} placeholder="Role" />
          <Input value={form.company} onChange={(e) => update('company', e.target.value)} placeholder="Company, e.g. Google" />
          <Select value={form.experience} onChange={(e) => update('experience', e.target.value)}>
            <option>0-2 years</option>
            <option>2-5 years</option>
            <option>5-8 years</option>
            <option>8+ years</option>
          </Select>
          <Select value={form.interview_type} onChange={(e) => update('interview_type', e.target.value)}>
            <option value="technical">Technical</option>
            <option value="coding">Coding</option>
            <option value="system-design">System design</option>
            <option value="behavioral">Behavioral</option>
            <option value="resume-based">Resume based</option>
            <option value="company-specific">Company specific</option>
            <option value="hr">HR</option>
          </Select>
          <Select value={form.difficulty} onChange={(e) => update('difficulty', e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
          <Select value={form.count} onChange={(e) => update('count', Number(e.target.value))}>
            {counts.map((count) => <option key={count} value={count}>{count} questions</option>)}
          </Select>
          <Input className="md:col-span-2" value={form.stack} onChange={(e) => update('stack', e.target.value)} placeholder="Technology stack" />
          <Button className="lg:col-span-1" disabled={loading}>{loading ? 'Generating...' : 'Generate interview'}</Button>
        </form>
      </Card>

      {questions.length ? (
        <Card hover={false}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Question set</h2>
              <p className="mt-1 text-sm text-slate-400">{questions.length} questions generated for {form.company || 'your target company'}.</p>
            </div>
            <Button onClick={handleSubmit}>Submit answers</Button>
          </div>
          <div className="mt-6 space-y-4">
            {questions.map((q, index) => (
              <div key={`${questionText(q)}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="info">Q{index + 1}</Badge>
                  {q.category ? <Badge>{q.category}</Badge> : null}
                </div>
                <p className="mt-3 font-semibold text-white">{questionText(q)}</p>
                {q.expected_answer ? <p className="mt-3 text-sm leading-6 text-slate-300"><span className="text-cyan-300">Expected answer:</span> {q.expected_answer}</p> : null}
                {q.recruiter_expectations ? <p className="mt-2 text-sm leading-6 text-slate-300"><span className="text-emerald-300">Assessed for:</span> {q.recruiter_expectations}</p> : null}
                {q.evaluation_criteria?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">{q.evaluation_criteria.map((item) => <Badge key={item} tone="success">{item}</Badge>)}</div>
                ) : null}
                <textarea value={answers[index] || ''} onChange={(e) => {
                  const next = [...answers]
                  next[index] = e.target.value
                  setAnswers(next)
                }} className="mt-4 min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-100 outline-none focus:border-cyan-400/50" placeholder="Practice your answer here..." />
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {history.length ? (
        <Card hover={false}>
          <h2 className="text-lg font-semibold text-white">Interview history</h2>
          <div className="mt-4 space-y-3">
            {history.slice(0, 5).map((item) => {
              const latestFeedback = item.feedbacks?.[item.feedbacks.length - 1]
              const details = latestFeedback?.feedback_details || {}
              return (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{item.role}</p>
                      <p className="mt-1 text-sm text-slate-400">{item.difficulty} difficulty · {new Date(item.created_at).toLocaleString()}</p>
                    </div>
                    {latestFeedback ? <Badge tone="success">{latestFeedback.overall_rating}/100</Badge> : <Badge tone="warning">Pending feedback</Badge>}
                  </div>
                  {details.summary ? <p className="mt-3 text-sm leading-6 text-slate-300">{details.summary}</p> : null}
                </div>
              )
            })}
          </div>
        </Card>
      ) : null}
    </PremiumShell>
  )
}
