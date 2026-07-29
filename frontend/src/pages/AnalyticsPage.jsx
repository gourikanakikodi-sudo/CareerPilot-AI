import { useEffect, useRef, useState } from 'react'
import Chart from 'chart.js/auto'
import PremiumShell from '../components/PremiumShell'
import { Card, ProgressBar } from '../components/UI'
import { CardSkeleton } from '../components/Skeletons'
import api from '../services/api'

function LineChart({ analytics }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !analytics) return undefined
    const labels = [...new Set([
      ...(analytics.ats_trend || []).map((item) => item.date),
      ...(analytics.interview_trend || []).map((item) => item.date),
    ])]
    const chart = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'ATS',
            data: labels.map((date) => analytics.ats_trend?.find((item) => item.date === date)?.score || null),
            borderColor: '#22d3ee',
            tension: 0.35,
          },
          {
            label: 'Interview',
            data: labels.map((date) => analytics.interview_trend?.find((item) => item.date === date)?.score || null),
            borderColor: '#a78bfa',
            tension: 0.35,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#e2e8f0' } } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.15)' } },
          y: { min: 0, max: 100, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.15)' } },
        },
      },
    })
    return () => chart.destroy()
  }, [analytics])

  return <canvas ref={canvasRef} className="max-h-80" />
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/analytics/')
      .then((response) => setAnalytics(response.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PremiumShell title="Analytics" subtitle="Track resume, interview, coding, and roadmap momentum">
      {loading ? <div className="grid gap-4 md:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div> : null}
      {analytics ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card hover={false}>
              <p className="text-sm text-slate-400">Coding acceptance</p>
              <p className="mt-2 text-4xl font-semibold text-white">{analytics.coding.acceptance_rate}%</p>
              <ProgressBar value={analytics.coding.acceptance_rate} className="mt-4" />
            </Card>
            <Card hover={false}>
              <p className="text-sm text-slate-400">Roadmap completion</p>
              <p className="mt-2 text-4xl font-semibold text-white">{analytics.roadmap_completion}%</p>
              <ProgressBar value={analytics.roadmap_completion} className="mt-4" />
            </Card>
            <Card hover={false}>
              <p className="text-sm text-slate-400">Saved practice</p>
              <p className="mt-2 text-4xl font-semibold text-white">{analytics.coding.total_submissions}</p>
              <p className="mt-3 text-sm text-slate-400">{analytics.coding.bookmarked} bookmarked solutions</p>
            </Card>
          </div>
          <Card hover={false}>
            <h2 className="text-lg font-semibold text-white">Readiness trend</h2>
            <div className="mt-5">
              <LineChart analytics={analytics} />
            </div>
          </Card>
        </div>
      ) : null}
    </PremiumShell>
  )
}
