import Layout from '../components/Layout'

export default function NotFoundPage() {
  return (
    <Layout>
      <div className="mx-auto mt-20 max-w-xl rounded-3xl border border-white/10 bg-slate-950/40 p-10 text-center shadow-glow">
        <h1 className="text-4xl font-semibold">404</h1>
        <p className="mt-3 text-slate-300">The page you are looking for does not exist.</p>
      </div>
    </Layout>
  )
}
