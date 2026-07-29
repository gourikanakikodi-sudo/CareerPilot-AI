import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PremiumShell from '../components/PremiumShell'
import { Badge, Button, Card, Input } from '../components/UI'
import { useToast } from '../context/ToastContext'
import { useCareer } from '../context/CareerContext'
import api from '../services/api'

export default function ResumeUploadPage() {
  const [file, setFile] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [latest, setLatest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const { resume: ctxResume, refresh } = useCareer()

  useEffect(() => {
    api.get('/resumes/latest/')
      .then((res) => {
        setLatest(res.data)
        localStorage.setItem('resume_id', res.data.id)
      })
      .catch(() => setLatest(null))
      .finally(() => setLoading(false))
  }, [])

  // Sync from context if available
  useEffect(() => {
    if (ctxResume && !latest) setLatest(ctxResume)
  }, [ctxResume])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (displayName) formData.append('display_name', displayName)
      const response = await api.post('/upload-resume/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      localStorage.setItem('resume_id', response.data.id)
      setLatest(response.data)
      setMessage('Resume saved as your active version.')
      pushToast('Resume uploaded. Running analysis...', 'success')

      // Auto-trigger analysis chain
      try {
        await api.post('/resume-analysis/', { resume_id: response.data.id })
        pushToast('Resume analysis complete.', 'success')
      } catch {
        // Analysis failure is non-fatal
      }

      // Refresh shared career context so all modules see new data
      refresh()

      navigate('/resume/analysis')
    } catch (err) {
      const detail = err.response?.data?.detail || 'Upload failed. Please try again.'
      setMessage(detail)
      pushToast(detail, 'danger')
    } finally {
      setUploading(false)
    }
  }

  return (
    <PremiumShell title="Resume workspace" subtitle="Upload once, reuse everywhere in CareerPilot">
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card hover={false}>
          <h2 className="text-lg font-semibold text-white">Saved resume</h2>
          {loading ? (
            <p className="mt-4 text-sm text-slate-400">Loading your latest version...</p>
          ) : latest ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{latest.filename}</p>
                    <p className="mt-1 text-sm text-slate-400">{Math.max(1, Math.round(latest.file_size / 1024))} KB · uploaded {new Date(latest.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge tone={latest.analysis_status === 'complete' ? 'success' : 'warning'}>{latest.analysis_status}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => navigate('/resume/analysis')}>Analyze latest</Button>
                <Button variant="secondary" onClick={() => navigate('/ats')}>Run ATS check</Button>
                <Button variant="secondary" onClick={() => navigate('/resume/management')}>Manage versions</Button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">No resume found yet. Upload a PDF and CareerPilot will remember it for future sessions.</p>
          )}
        </Card>

        <Card hover={false}>
          <h2 className="text-lg font-semibold text-white">{latest ? 'Replace active resume' : 'Upload resume'}</h2>
          <p className="mt-1 text-sm text-slate-400">PDF only, up to 5MB. Uploading auto-runs analysis and refreshes your dashboard.</p>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Version name, e.g. AI Engineer resume" />
            <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-100" />
            <Button className="w-full" disabled={!file || uploading}>
              {uploading ? 'Uploading & analyzing...' : latest ? 'Upload new version' : 'Upload and analyze'}
            </Button>
          </form>
          {message ? <p className="mt-4 text-sm text-cyan-300">{message}</p> : null}
        </Card>
      </div>
    </PremiumShell>
  )
}
