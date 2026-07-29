import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) { setError('Email is required.'); return }
    if (!password) { setError('Password is required.'); return }

    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
      navigate('/dashboard')
    } catch (err) {
      const data = err?.response?.data
      if (data?.detail) {
        setError(data.detail)
      } else if (err?.response?.status === 401) {
        setError('Incorrect email or password.')
      } else {
        setError('Unable to sign in right now. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-white/10 bg-slate-950/40 p-8 shadow-glow">
        <h2 className="text-3xl font-semibold">Welcome back</h2>
        <p className="mt-2 text-slate-300">Login to access your career insights.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error ? (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <div>
            <label className="mb-1.5 block text-sm text-slate-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/10 p-3 text-white outline-none focus:border-cyan-400/50"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/10 p-3 text-white outline-none focus:border-cyan-400/50"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-cyan-500 py-3 font-semibold text-slate-950 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-400">
          No account yet? <Link to="/register" className="text-cyan-300">Create one</Link>
        </p>
      </div>
    </Layout>
  )
}
