import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Layout({ children }) {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="theme-page min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.15),_transparent_30%),linear-gradient(135deg,_#050816_0%,_#111827_60%,_#1d4ed8_100%)] text-slate-100">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to={user ? '/dashboard' : '/'} className="text-2xl font-semibold tracking-tight">CareerPilot AI</Link>
        <div className="flex items-center gap-4 text-sm">
          <button type="button" onClick={toggleTheme} className="rounded-full border border-white/20 px-4 py-2 hover:bg-white/10">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          {!user ? (
            <>
              <Link to="/login" className="rounded-full border border-white/20 px-4 py-2 hover:bg-white/10">Login</Link>
              <Link to="/register" className="rounded-full bg-cyan-500/90 px-4 py-2 font-medium text-slate-950">Get Started</Link>
            </>
          ) : null}
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-6 pb-10">{children}</main>
    </div>
  )
}
