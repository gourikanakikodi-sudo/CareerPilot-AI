import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Button, Badge } from './UI'

const navItems = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/resume/upload', label: 'Resume' },
  { to: '/ats', label: 'ATS' },
  { to: '/skill-gap', label: 'Skill Gap' },
  { to: '/interview', label: 'Interview' },
  { to: '/coding', label: 'Coding' },
  { to: '/roadmap', label: 'Learning Roadmap' },
  { to: '/jobs', label: 'Job Opportunities' },
  { to: '/tracker', label: 'App Tracker' },
  { to: '/coach', label: 'Career Coach' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/settings', label: 'Settings' },
]

export default function PremiumShell({ children, title, subtitle }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const userInitial = (user?.username || user?.email || 'U').charAt(0).toUpperCase()
  const isNavActive = (item) => {
    if (item.to === '/resume/upload') return location.pathname.startsWith('/resume')
    if (item.to === '/interview') return location.pathname.startsWith('/interview')
    if (item.to === '/skill-gap') return location.pathname === '/skill-gap' || location.pathname === '/analytics'
    return location.pathname === item.to
  }
  const navClass = (item) => {
    const active = isNavActive(item)
    return `flex items-center rounded-2xl px-3 py-3 text-sm transition-colors ${active ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`
  }
  const mobileNavClass = (item) => {
    const active = isNavActive(item)
    return `rounded-2xl px-3 py-2 text-sm ${active ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`
  }

  return (
    <div className="theme-page min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_30%),linear-gradient(135deg,_#060816_0%,_#0f172a_45%,_#111827_100%)] text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col px-4 py-4 lg:px-6">
        <header className="mb-4 rounded-[28px] border border-white/10 bg-slate-900/70 px-4 py-3 shadow-[0_20px_70px_-35px_rgba(6,182,212,0.7)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button className="rounded-2xl border border-white/10 bg-white/10 p-2 lg:hidden" onClick={() => setMobileMenuOpen((v) => !v)} aria-label="Toggle menu">
                Menu
              </button>
              <Link to={user ? '/dashboard' : '/'} className="text-lg font-semibold tracking-tight text-white">CareerPilot AI</Link>
              <Badge tone="info">Premium Workspace</Badge>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={toggleTheme}
                className="mr-3 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/15"
              >
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((value) => !value)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-cyan-500 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20"
                aria-label="Open profile menu"
              >
                {userInitial}
              </button>
              {profileMenuOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl shadow-black/40">
                  <div className="border-b border-white/10 px-3 py-2">
                    <p className="truncate text-sm font-semibold text-white">{user?.username || 'Profile'}</p>
                    <p className="truncate text-xs text-slate-400">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="mt-2 block rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/10 hover:text-white"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          {mobileMenuOpen ? <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3 lg:hidden">
            {navItems.map((item) => <NavLink key={item.to} to={item.to} className={mobileNavClass(item)} onClick={() => setMobileMenuOpen(false)}>{item.label}</NavLink>)}
          </div> : null}
        </header>

        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="hidden rounded-[28px] border border-white/10 bg-slate-900/70 p-4 shadow-[0_20px_70px_-35px_rgba(0,0,0,0.8)] backdrop-blur-xl lg:block">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/15 to-violet-500/15 p-4">
              <p className="text-sm text-slate-300">Prepared for</p>
              <p className="mt-1 font-semibold text-white">High-growth careers</p>
            </div>
            <nav className="mt-4 space-y-1">
              {navItems.map((item) => <NavLink key={item.to} to={item.to} className={navClass(item)}>
                {item.label}
              </NavLink>)}
            </nav>
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Weekly momentum</p>
              <p className="mt-2 text-2xl font-semibold text-white">82%</p>
              <p className="mt-1 text-sm text-slate-400">Interview readiness</p>
            </div>
          </aside>

          <main className="space-y-4">
            <section className="rounded-[28px] border border-white/10 bg-slate-900/70 p-5 shadow-[0_20px_70px_-35px_rgba(0,0,0,0.8)] backdrop-blur-xl">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm text-cyan-300">{title || 'Career intelligence workspace'}</p>
                  <h1 className="mt-1 text-2xl font-semibold text-white">{subtitle || 'A premium experience for ambitious professionals'}</h1>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary">Export report</Button>
                  <Button>New session</Button>
                </div>
              </div>
            </section>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
