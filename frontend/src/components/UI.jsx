export function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 disabled:opacity-60'
  const variants = {
    primary: 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20',
    secondary: 'border border-white/15 bg-white/10 text-slate-100 hover:bg-white/15',
    ghost: 'bg-transparent text-slate-300 hover:bg-white/10 hover:text-white',
  }
  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>
}

export function Card({ children, className = '', hover = true }) {
  return <div className={`rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-[0_20px_70px_-30px_rgba(0,0,0,0.7)] backdrop-blur-xl ${hover ? 'transition-transform duration-200 hover:-translate-y-1' : ''} ${className}`}>{children}</div>
}

export function Input({ className = '', ...props }) {
  return <input className={`w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none ring-0 placeholder:text-slate-400 focus:border-cyan-400/50 ${className}`} {...props} />
}

export function Select({ className = '', children, ...props }) {
  return <select className={`w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400/50 ${className}`} {...props}>{children}</select>
}

export function Badge({ children, tone = 'default', className = '' }) {
  const tones = {
    default: 'bg-white/10 text-slate-300',
    success: 'bg-emerald-500/15 text-emerald-300',
    warning: 'bg-amber-500/15 text-amber-300',
    danger: 'bg-rose-500/15 text-rose-300',
    info: 'bg-cyan-500/15 text-cyan-300',
  }
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${tones[tone]} ${className}`}>{children}</span>
}

export function ProgressBar({ value = 0, className = '' }) {
  return <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-800 ${className}`}><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>
}

export function SectionTitle({ title, subtitle, action }) {
  return <div className="flex items-end justify-between gap-4">
    <div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
    </div>
    {action ? <div>{action}</div> : null}
  </div>
}
