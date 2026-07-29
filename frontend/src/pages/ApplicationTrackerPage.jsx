import { useEffect, useState } from 'react'
import PremiumShell from '../components/PremiumShell'
import { Badge, Button, Card, Input, Select, SectionTitle } from '../components/UI'
import { useToast } from '../context/ToastContext'
import api from '../services/api'

const STATUSES = ['saved', 'applied', 'interview', 'offer', 'rejected']

const STATUS_TONE = {
  saved: 'default',
  applied: 'info',
  interview: 'warning',
  offer: 'success',
  rejected: 'danger',
}

const STATUS_LABEL = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
}

const EMPTY_FORM = {
  company: '', role: '', location: '', salary_range: '',
  job_url: '', status: 'saved', notes: '', applied_date: '',
}

function KanbanColumn({ status, apps, onStatusChange, onDelete }) {
  return (
    <div className="flex min-w-[220px] flex-1 flex-col rounded-2xl border border-white/10 bg-slate-900/50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
        <span className="text-xs text-slate-500">{apps.length}</span>
      </div>
      <div className="space-y-2">
        {apps.map((app) => (
          <div key={app.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-sm font-semibold text-white">{app.role}</p>
            <p className="text-xs text-slate-400">{app.company}</p>
            {app.location ? <p className="mt-1 text-xs text-slate-500">{app.location}</p> : null}
            {app.salary_range ? <p className="text-xs text-cyan-400">{app.salary_range}</p> : null}
            {app.notes ? (
              <p className="mt-2 line-clamp-2 text-xs text-slate-400">{app.notes}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-1">
              {STATUSES.filter((s) => s !== status).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStatusChange(app.id, s)}
                  className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300 hover:border-cyan-300/40 hover:text-white"
                >
                  → {STATUS_LABEL[s]}
                </button>
              ))}
              <button
                type="button"
                onClick={() => onDelete(app.id)}
                className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {apps.length === 0 ? (
          <p className="text-center text-xs text-slate-600 py-4">Empty</p>
        ) : null}
      </div>
    </div>
  )
}

export default function ApplicationTrackerPage() {
  const { pushToast } = useToast()
  const [apps, setApps] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  const loadApps = async () => {
    try {
      const [appsRes, statsRes] = await Promise.all([
        api.get('/applications/'),
        api.get('/applications/stats/'),
      ])
      setApps(appsRes.data)
      setStats(statsRes.data)
    } catch {
      pushToast('Could not load applications.', 'danger')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadApps() }, [])

  const handleFormChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.company.trim() || !form.role.trim()) {
      pushToast('Company and role are required.', 'danger')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.applied_date) delete payload.applied_date
      await api.post('/applications/', payload)
      pushToast('Application saved.', 'success')
      setForm(EMPTY_FORM)
      setShowForm(false)
      loadApps()
    } catch (err) {
      pushToast(err.response?.data?.detail || 'Could not save application.', 'danger')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await api.patch(`/applications/${appId}/`, { status: newStatus })
      setApps((prev) => prev.map((a) => a.id === appId ? { ...a, status: newStatus } : a))
      // Refresh stats
      const res = await api.get('/applications/stats/')
      setStats(res.data)
    } catch {
      pushToast('Could not update status.', 'danger')
    }
  }

  const handleDelete = async (appId) => {
    try {
      await api.delete(`/applications/${appId}/`)
      setApps((prev) => prev.filter((a) => a.id !== appId))
      const res = await api.get('/applications/stats/')
      setStats(res.data)
      pushToast('Application removed.', 'success')
    } catch {
      pushToast('Could not delete application.', 'danger')
    }
  }

  const filtered = filterStatus ? apps.filter((a) => a.status === filterStatus) : apps
  const byStatus = STATUSES.reduce((acc, s) => {
    acc[s] = filtered.filter((a) => a.status === s)
    return acc
  }, {})

  return (
    <PremiumShell title="Application Tracker" subtitle="Track every job from saved to offer">
      <div className="space-y-4">

        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[{ label: 'Total', key: 'total', tone: 'default' }, ...STATUSES.map((s) => ({ label: STATUS_LABEL[s], key: s, tone: STATUS_TONE[s] }))].map((item) => (
            <Card key={item.key} hover={false} className="text-center">
              <p className="text-2xl font-semibold text-white">{stats[item.key] ?? 0}</p>
              <Badge tone={item.tone} className="mt-2">{item.label}</Badge>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : '+ Add application'}
          </Button>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-40"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </Select>
          <span className="text-sm text-slate-400">{filtered.length} application{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Add form */}
        {showForm ? (
          <Card hover={false}>
            <SectionTitle title="Add new application" />
            <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">Company *</label>
                <Input value={form.company} onChange={(e) => handleFormChange('company', e.target.value)} placeholder="Google, Stripe, Notion…" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">Role *</label>
                <Input value={form.role} onChange={(e) => handleFormChange('role', e.target.value)} placeholder="Senior Backend Engineer" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">Location</label>
                <Input value={form.location} onChange={(e) => handleFormChange('location', e.target.value)} placeholder="Remote, NYC…" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">Salary range</label>
                <Input value={form.salary_range} onChange={(e) => handleFormChange('salary_range', e.target.value)} placeholder="$120k – $160k" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">Job URL</label>
                <Input value={form.job_url} onChange={(e) => handleFormChange('job_url', e.target.value)} placeholder="https://…" type="url" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">Status</label>
                <Select value={form.status} onChange={(e) => handleFormChange('status', e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">Applied date</label>
                <Input value={form.applied_date} onChange={(e) => handleFormChange('applied_date', e.target.value)} type="date" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs text-slate-400">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  className="min-h-20 w-full rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-100 outline-none focus:border-cyan-400/50"
                  placeholder="Referral, recruiter name, next steps…"
                />
              </div>
              <div className="flex gap-3 md:col-span-2">
                <Button disabled={saving}>{saving ? 'Saving…' : 'Save application'}</Button>
                <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </Card>
        ) : null}

        {/* Kanban board */}
        {loading ? (
          <Card hover={false}>
            <p className="text-sm text-slate-400">Loading applications…</p>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-3 pb-4" style={{ minWidth: 'max-content' }}>
              {STATUSES.map((s) => (
                <KanbanColumn
                  key={s}
                  status={s}
                  apps={byStatus[s]}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </PremiumShell>
  )
}
