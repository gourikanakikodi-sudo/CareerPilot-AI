import { Link } from 'react-router-dom'
import Layout from '../components/Layout'

const features = [
  ['Resume intelligence', 'Structured review across ATS score, grammar, formatting, skills, projects, and missing keywords.'],
  ['Interview practice', 'Generate role-aware question sets with expected answers, scoring, feedback, and history.'],
  ['Job matching', 'Compare resume skills against role requirements and get a targeted prep guide.'],
  ['Career coach', 'Ask questions with your resume, ATS, interview, and roadmap context in the loop.'],
]

const steps = [
  'Upload your resume once',
  'Run ATS and resume analysis',
  'Practice interviews and close skill gaps',
]

export default function LandingPage() {
  return (
    <Layout>
      <section className="relative min-h-[72vh] overflow-hidden rounded-[32px] border border-white/10 bg-slate-950">
        <img
          src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1800&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/72 to-slate-950/20" />
        <div className="relative flex min-h-[72vh] max-w-4xl flex-col justify-center px-6 py-16 md:px-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">AI-powered career preparation</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-6xl">CareerPilot AI</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            Prepare for modern hiring with resume analysis, ATS scoring, role-based interview practice, job matching, and a personalized career coach.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/register" className="rounded-full bg-cyan-500 px-5 py-3 font-medium text-slate-950">Get Started</Link>
            <a href="#how-it-works" className="rounded-full border border-white/30 px-5 py-3 text-white hover:bg-white/10">Watch Demo</a>
            <Link to="/resume/upload" className="rounded-full border border-cyan-300/50 bg-cyan-500/10 px-5 py-3 text-cyan-100">Analyze Resume</Link>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {features.map(([title, detail]) => (
          <div key={title} className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{detail}</p>
          </div>
        ))}
      </section>

      <section id="how-it-works" className="mt-8 grid gap-6 rounded-[32px] border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl md:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h2 className="text-2xl font-semibold text-white">How it works</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">A focused workflow for turning career prep into saved, measurable progress.</p>
        </div>
        <div className="grid gap-3">
          {steps.map((step, index) => (
            <div key={step} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-cyan-300">Step {index + 1}</p>
              <p className="mt-1 font-semibold text-white">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ['Aarav M.', 'The resume analysis made my project bullets finally sound like engineering work, not class notes.'],
          ['Nisha R.', 'The mock interview feedback showed exactly where my answers were too generic.'],
          ['Dev P.', 'Job matching helped me stop applying everywhere and focus on roles I could actually prepare for.'],
        ].map(([name, quote]) => (
          <div key={name} className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
            <p className="text-sm leading-6 text-slate-300">{quote}</p>
            <p className="mt-4 font-semibold text-white">{name}</p>
          </div>
        ))}
      </section>
    </Layout>
  )
}
