import { useEffect, useMemo, useState } from 'react'
import PremiumShell from '../components/PremiumShell'
import { Card, Badge, Button, Select } from '../components/UI'
import { CardSkeleton } from '../components/Skeletons'
import { useToast } from '../context/ToastContext'
import api from '../services/api'

const LANGUAGES = [
  { value: 'python',     label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java',       label: 'Java' },
  { value: 'c',          label: 'C' },
  { value: 'cpp',        label: 'C++' },
]

function StatBox({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-slate-500">{sub}</p> : null}
    </div>
  )
}

function TestResultRow({ test, passed }) {
  return (
    <div className={`rounded-2xl border p-3 text-sm ${passed ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-rose-400/30 bg-rose-500/10'}`}>
      <div className="flex items-center gap-2">
        <span>{passed ? '✓' : '✗'}</span>
        <span className="font-mono text-slate-300">{test.input}</span>
        <span className="ml-auto text-xs text-slate-400">expected: {test.output}</span>
      </div>
    </div>
  )
}

export default function CodingPage() {
  const [problems, setProblems] = useState([])
  const [selectedSlug, setSelectedSlug] = useState('')
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [explaining, setExplaining] = useState(false)
  const [explanation, setExplanation] = useState(null)
  const { pushToast } = useToast()

  const loadHistory = () => {
    api.get('/coding/history/').then((r) => setHistory(r.data)).catch(() => setHistory([]))
  }

  useEffect(() => {
    api.get('/coding/problems/')
      .then((res) => {
        setProblems(res.data)
        const first = res.data[0]
        if (first) {
          setSelectedSlug(first.slug)
          setCode(first.starter_code?.python || '')
        }
      })
      .catch(() => pushToast('Unable to load coding problems.', 'danger'))
      .finally(() => setLoading(false))
    loadHistory()
  }, [])

  const selectedProblem = useMemo(
    () => problems.find((p) => p.slug === selectedSlug),
    [problems, selectedSlug],
  )

  const chooseProblem = (slug) => {
    const next = problems.find((p) => p.slug === slug)
    setSelectedSlug(slug)
    setCode(next?.starter_code?.[language] || '')
    setResult(null)
    setExplanation(null)
  }

  const chooseLanguage = async (lang) => {
    setLanguage(lang)
    setResult(null)
    setExplanation(null)
    // Fetch starter template for this language
    if (selectedSlug) {
      try {
        const res = await api.get(`/coding/starter/${selectedSlug}/`, { params: { language: lang } })
        setCode(res.data.starter_code)
      } catch {
        // fallback to stored starter_code
        setCode(selectedProblem?.starter_code?.[lang] || '')
      }
    }
  }

  const submit = async () => {
    if (!selectedProblem) return
    setSubmitting(true)
    setExplanation(null)
    try {
      const res = await api.post('/coding/submit/', {
        slug: selectedProblem.slug,
        language,
        code,
      })
      setResult(res.data)
      loadHistory()
      const tone = res.data.status === 'accepted' ? 'success' : 'info'
      pushToast(res.data.status === 'accepted' ? 'All tests passed!' : `${res.data.passed_tests}/${res.data.total_tests} tests passed.`, tone)
    } catch {
      pushToast('Unable to submit solution right now.', 'danger')
    } finally {
      setSubmitting(false)
    }
  }

  const getExplanation = async () => {
    if (!selectedProblem || !code.trim()) return
    setExplaining(true)
    try {
      const res = await api.post('/coding/explain/', {
        slug: selectedProblem.slug,
        language,
        code,
        status: result?.status || '',
      })
      setExplanation(res.data)
    } catch {
      pushToast('Unable to generate explanation right now.', 'danger')
    } finally {
      setExplaining(false)
    }
  }

  const toggleBookmark = async (submission) => {
    try {
      await api.patch(`/coding/bookmark/${submission.id}/`)
      loadHistory()
      pushToast('Bookmark updated.', 'success')
    } catch {
      pushToast('Unable to update bookmark.', 'danger')
    }
  }

  return (
    <PremiumShell title="Coding Practice" subtitle="Multi-language interview problem practice">
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      ) : null}

      {!loading && !problems.length ? (
        <Card hover={false}><p className="text-slate-300">No coding problems available yet.</p></Card>
      ) : null}

      {selectedProblem ? (
        <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">

          {/* Problem list */}
          <Card hover={false}>
            <h2 className="text-lg font-semibold text-white">Problem set</h2>
            <div className="mt-4 space-y-3">
              {problems.map((problem) => (
                <button
                  key={problem.slug}
                  type="button"
                  onClick={() => chooseProblem(problem.slug)}
                  className={`block w-full rounded-2xl border p-4 text-left transition ${
                    problem.slug === selectedSlug
                      ? 'border-cyan-300/50 bg-cyan-500/10'
                      : 'border-white/10 bg-white/5 hover:border-cyan-300/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{problem.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{problem.company}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(problem.tags || []).map((t) => (
                          <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">{t}</span>
                        ))}
                      </div>
                    </div>
                    <Badge tone={problem.difficulty === 'hard' ? 'danger' : problem.difficulty === 'medium' ? 'warning' : 'success'}>
                      {problem.difficulty}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Editor area */}
          <div className="space-y-4">

            {/* Problem statement */}
            <Card hover={false}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-white">{selectedProblem.title}</h2>
                    <Badge tone={selectedProblem.difficulty === 'hard' ? 'danger' : selectedProblem.difficulty === 'medium' ? 'warning' : 'success'}>
                      {selectedProblem.difficulty}
                    </Badge>
                    <Badge tone="info">{selectedProblem.company}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{selectedProblem.prompt}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(selectedProblem.tags || []).map((tag) => <Badge key={tag}>{tag}</Badge>)}
                  </div>
                </div>
              </div>

              {/* Test cases */}
              <div className="mt-5">
                <p className="text-sm font-semibold text-white">Example test cases</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {(selectedProblem.visible_tests || []).map((test, i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                      <p className="text-xs text-slate-400">Input</p>
                      <p className="mt-1 font-mono text-slate-200">{test.input}</p>
                      <p className="mt-2 text-xs text-slate-400">Expected output</p>
                      <p className="mt-1 font-mono text-emerald-300">{test.output}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Language selector + editor */}
            <Card hover={false}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold text-white">Solution editor</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Language:</span>
                  <Select
                    value={language}
                    onChange={(e) => chooseLanguage(e.target.value)}
                    className="w-40"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck="false"
                className="mt-4 min-h-[360px] w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4 font-mono text-sm leading-6 text-slate-100 outline-none focus:border-cyan-400/50"
                placeholder={`Write your ${language} solution here…`}
              />

              <div className="mt-4 flex flex-wrap gap-2">
                <Button disabled={submitting || !code.trim()} onClick={submit}>
                  {submitting ? 'Running…' : 'Run tests & Submit'}
                </Button>
                <Button
                  variant="secondary"
                  disabled={explaining || !code.trim()}
                  onClick={getExplanation}
                >
                  {explaining ? 'Explaining…' : '✨ Explain my solution'}
                </Button>
              </div>
            </Card>

            {/* Submission result */}
            {result ? (
              <Card hover={false}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white">Submission result</h3>
                  <Badge tone={result.status === 'accepted' ? 'success' : 'warning'}>
                    {result.status.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Stats grid */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  <StatBox label="Passed" value={result.passed_tests} sub={`of ${result.total_tests}`} />
                  <StatBox label="Failed" value={result.failed_tests} />
                  <StatBox label="Runtime" value={`${result.execution_ms}ms`} />
                  <StatBox label="Memory" value={`${Math.round(result.memory_kb / 1024)}MB`} sub={`${result.memory_kb}KB`} />
                  <StatBox label="Time" value={result.feedback?.time_complexity || '—'} />
                  <StatBox label="Space" value={result.feedback?.space_complexity || '—'} />
                </div>

                {/* Test case results */}
                <div className="mt-4">
                  <p className="text-sm font-semibold text-white">Test case results</p>
                  <div className="mt-2 space-y-2">
                    {(selectedProblem.visible_tests || []).map((test, i) => (
                      <TestResultRow
                        key={i}
                        test={test}
                        passed={i < result.passed_tests}
                      />
                    ))}
                    {/* Hidden tests summary */}
                    {result.total_tests > (selectedProblem.visible_tests || []).length ? (
                      <div className={`rounded-2xl border p-3 text-sm ${
                        result.passed_tests === result.total_tests
                          ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                          : 'border-rose-400/30 bg-rose-500/10 text-rose-200'
                      }`}>
                        {result.total_tests - (selectedProblem.visible_tests || []).length} hidden test
                        {result.total_tests - (selectedProblem.visible_tests || []).length !== 1 ? 's' : ''} —
                        {result.passed_tests === result.total_tests ? ' all passed' : ' some failed'}
                      </div>
                    ) : null}
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-300">{result.feedback?.summary}</p>
                <p className="mt-1 text-sm text-cyan-300">{result.feedback?.next_step}</p>
              </Card>
            ) : null}

            {/* AI Explanation */}
            {explanation ? (
              <Card hover={false} className="border-violet-400/25 bg-violet-500/5">
                <h3 className="text-lg font-semibold text-white">✨ AI explanation</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-violet-300">Why it works</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{explanation.why_it_works}</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold text-cyan-300">Data structure</p>
                      <p className="mt-1 text-sm text-slate-300">{explanation.data_structure}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-cyan-300">Algorithm / Pattern</p>
                      <p className="mt-1 text-sm text-slate-300">{explanation.algorithm}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-300">Time complexity</p>
                      <p className="mt-1 text-sm text-slate-300">{explanation.time_complexity}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-300">Space complexity</p>
                      <p className="mt-1 text-sm text-slate-300">{explanation.space_complexity}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-300">Possible optimizations</p>
                    <ul className="mt-2 space-y-1">
                      {(explanation.optimizations || []).map((opt, i) => (
                        <li key={i} className="text-sm text-slate-300">· {opt}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ) : null}

            {/* Submission history */}
            <Card hover={false}>
              <h3 className="text-lg font-semibold text-white">Submission history</h3>
              {!history.length ? (
                <p className="mt-3 text-sm text-slate-400">Your attempts will appear here after you submit.</p>
              ) : null}
              <div className="mt-4 space-y-3">
                {history.map((sub) => (
                  <div key={sub.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-white">{sub.problem?.title}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {LANGUAGES.find((l) => l.value === sub.language)?.label || sub.language}
                          {' · '}{new Date(sub.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={sub.status === 'accepted' ? 'success' : 'warning'}>
                          {sub.status.replace('_', ' ')}
                        </Badge>
                        <Badge>{sub.passed_tests}/{sub.total_tests} tests</Badge>
                        <Badge>{sub.execution_ms}ms</Badge>
                        <Button variant="secondary" onClick={() => toggleBookmark(sub)}>
                          {sub.bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
                        </Button>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{sub.feedback?.summary}</p>
                  </div>
                ))}
              </div>
            </Card>

          </div>
        </div>
      ) : null}
    </PremiumShell>
  )
}
