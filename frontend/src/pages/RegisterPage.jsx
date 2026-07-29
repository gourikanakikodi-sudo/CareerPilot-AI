import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'

/** Flatten DRF error objects into a readable string list. */
function parseErrors(data) {
  if (!data) return ['Unable to create an account right now.']
  if (typeof data === 'string') return [data]

  const messages = []
  for (const [field, value] of Object.entries(data)) {
    const fieldLabel = field === 'non_field_errors' ? '' : `${field}: `
    const errors = Array.isArray(value) ? value : [value]
    for (const err of errors) {
      if (typeof err === 'string') {
        messages.push(`${fieldLabel}${err}`)
      } else if (typeof err === 'object' && err !== null) {
        messages.push(`${fieldLabel}${JSON.stringify(err)}`)
      }
    }
  }
  return messages.length ? messages : ['Unable to create an account right now.']
}

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', profession: '' })
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setErrors([])

    // Client-side pre-validation
    const clientErrors = []
    if (!form.username.trim()) clientErrors.push('Username is required.')
    if (!form.email.trim()) clientErrors.push('Email is required.')
    if (!form.password) clientErrors.push('Password is required.')
    else if (form.password.length < 8) clientErrors.push('Password must be at least 8 characters.')
    if (clientErrors.length) { setErrors(clientErrors); return }

    setLoading(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      const data = err?.response?.data
      setErrors(parseErrors(data))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-white/10 bg-slate-950/40 p-8 shadow-glow">
        <h2 className="text-3xl font-semibold">Create your account</h2>
        <p className="mt-2 text-slate-300">Join CareerPilot AI and unlock personalized growth tools.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {errors.length > 0 ? (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
              {errors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          ) : null}

          <div>
            <label className="mb-1.5 block text-sm text-slate-400">Username</label>
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-white/10 p-3 text-white outline-none focus:border-cyan-400/50"
              placeholder="johndoe"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-400">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-white/10 p-3 text-white outline-none focus:border-cyan-400/50"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-400">Password <span className="text-slate-500">(min 8 characters)</span></label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-white/10 p-3 text-white outline-none focus:border-cyan-400/50"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-400">Profession <span className="text-slate-500">(optional)</span></label>
            <input
              value={form.profession}
              onChange={(e) => setForm({ ...form, profession: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-white/10 p-3 text-white outline-none focus:border-cyan-400/50"
              placeholder="Software Engineer, Data Scientist…"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-cyan-500 py-3 font-semibold text-slate-950 disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-400">
          Already have an account? <Link to="/login" className="text-cyan-300">Login</Link>
        </p>
      </div>
    </Layout>
  )
}
