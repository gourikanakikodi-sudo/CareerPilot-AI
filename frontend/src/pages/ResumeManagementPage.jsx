import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PremiumShell from '../components/PremiumShell'
import { Badge, Button, Card, Input } from '../components/UI'
import { useToast } from '../context/ToastContext'
import api from '../services/api'

export default function ResumeManagementPage() {
  const [resumes, setResumes] = useState([])
  const [editing, setEditing] = useState({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { pushToast } = useToast()

  const loadResumes = () => {
    setLoading(true)
    api.get('/resumes/')
      .then((res) => setResumes(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(loadResumes, [])

  const updateResume = async (resume, payload) => {
    const res = await api.patch(`/resumes/${resume.id}/`, payload)
    if (res.data.is_active) localStorage.setItem('resume_id', res.data.id)
    pushToast(res.data.is_active ? 'Active resume updated.' : 'Resume updated.', 'success')
    loadResumes()
  }

  const deleteResume = async (resume) => {
    await api.delete(`/resumes/${resume.id}/`)
    if (String(localStorage.getItem('resume_id')) === String(resume.id)) localStorage.removeItem('resume_id')
    pushToast('Resume deleted.', 'success')
    loadResumes()
  }

  return (
    <PremiumShell title="Resume hub" subtitle="Manage every version without losing your active resume">
      <Card hover={false}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Resume versions</h2>
            <p className="mt-1 text-sm text-slate-400">Latest active resume is reused automatically across analysis, ATS, coach, and interviews.</p>
          </div>
          <Button onClick={() => navigate('/resume/upload')}>Upload version</Button>
        </div>

        {loading ? <p className="mt-6 text-sm text-slate-400">Loading resumes...</p> : null}
        {!loading && resumes.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center">
            <p className="font-semibold text-white">No resume uploaded yet</p>
            <p className="mt-1 text-sm text-slate-400">Upload once and CareerPilot will keep it ready for every module.</p>
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          {resumes.map((resume) => (
            <div key={resume.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-white">{resume.filename}</p>
                    {resume.is_active ? <Badge tone="success">Active</Badge> : null}
                    <Badge tone={resume.analysis_status === 'complete' ? 'info' : 'warning'}>{resume.analysis_status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{Math.max(1, Math.round(resume.file_size / 1024))} KB - Uploaded {new Date(resume.created_at).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => window.open(resume.file_url, '_blank')}>Preview</Button>
                  <Button variant="secondary" onClick={() => updateResume(resume, { is_active: true })}>Make active</Button>
                  <Button onClick={() => {
                    localStorage.setItem('resume_id', resume.id)
                    navigate('/resume/analysis')
                  }}>Analyze</Button>
                  <Button variant="ghost" onClick={() => deleteResume(resume)}>Delete</Button>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 md:flex-row">
                <Input value={editing[resume.id] ?? resume.display_name ?? ''} onChange={(e) => setEditing((current) => ({ ...current, [resume.id]: e.target.value }))} placeholder="Rename this version" />
                <Button variant="secondary" onClick={() => updateResume(resume, { display_name: editing[resume.id] })}>Rename</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PremiumShell>
  )
}
