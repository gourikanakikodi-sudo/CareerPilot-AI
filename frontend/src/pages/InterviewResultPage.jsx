import { useEffect, useState } from 'react'
import PremiumShell from '../components/PremiumShell'
import { Badge } from '../components/UI'

export default function InterviewResultPage() {
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('feedback')
    if (stored) {
      setFeedback(JSON.parse(stored))
    }
  }, [])

  const details = feedback?.feedback_details || {}
  const perAnswer = details.per_answer_feedback || []
  const suggestions = details.summary || feedback?.suggestions || ''

  return (
    <PremiumShell title="Interview" subtitle="Structured feedback from your mock interview">
      <div className="space-y-6">
        <section className="glass p-8">
          <h1 className="text-3xl font-semibold">Interview feedback</h1>
          <p className="mt-2 text-slate-300">A structured review of your mock interview responses.</p>
        </section>
        {feedback ? (
          <div className="glass p-8">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-sm text-slate-400">Technical score</p>
                <p className="mt-2 text-3xl font-semibold">{feedback.technical_score}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-sm text-slate-400">Communication score</p>
                <p className="mt-2 text-3xl font-semibold">{feedback.communication_score}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-sm text-slate-400">Confidence score</p>
                <p className="mt-2 text-3xl font-semibold">{feedback.confidence_score}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-sm text-slate-400">Overall rating</p>
                <p className="mt-2 text-3xl font-semibold">{feedback.overall_rating}</p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-4">
              <h2 className="text-xl font-semibold">Suggestions</h2>
              <p className="mt-3 text-slate-300">{suggestions}</p>
              {details.strengths ? <p className="mt-3 text-sm text-emerald-300">Strengths: {details.strengths}</p> : null}
              {details.risks ? <p className="mt-2 text-sm text-amber-300">Risks: {details.risks}</p> : null}
              {details.next_steps ? <p className="mt-2 text-sm text-cyan-300">Next steps: {details.next_steps}</p> : null}
            </div>
            {perAnswer.length ? (
              <div className="mt-6 space-y-4">
                {perAnswer.map((item, index) => (
                  <div key={`${item.question || index}-${index}`} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="info">Answer {index + 1}</Badge>
                      <Badge tone={item.score >= 75 ? 'success' : item.score >= 55 ? 'warning' : 'danger'}>{item.score}/100</Badge>
                    </div>
                    {item.question ? <p className="mt-3 font-semibold text-white">{item.question}</p> : null}
                    <p className="mt-3 text-sm leading-6 text-slate-300">{item.feedback}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.confidence_assessment}</p>
                    <p className="mt-3 rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-sm leading-6 text-slate-300">{item.suggested_better_answer}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </PremiumShell>
  )
}
