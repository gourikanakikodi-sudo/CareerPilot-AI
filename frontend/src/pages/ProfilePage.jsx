import { useEffect, useState } from 'react'
import PremiumShell from '../components/PremiumShell'
import api from '../services/api'

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    api.get('/auth/profile/').then((res) => setProfile(res.data))
  }, [])

  return (
    <PremiumShell title="Profile" subtitle="Account and career identity">
      <div className="space-y-6">
        <section className="glass p-8">
          <h1 className="text-3xl font-semibold">Profile</h1>
          <p className="mt-2 text-slate-300">A snapshot of your account, recent activity, and growth metrics.</p>
        </section>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass p-8">
            <p className="text-sm text-slate-400">Name</p>
            <p className="mt-2 text-xl font-semibold">{profile?.username || 'CareerPilot user'}</p>
            <p className="mt-4 text-sm text-slate-400">Email</p>
            <p className="mt-2">{profile?.email || 'n/a'}</p>
          </div>
          <div className="glass p-8">
            <p className="text-sm text-slate-400">Profession</p>
            <p className="mt-2 text-xl font-semibold">{profile?.profession || 'Professional'}</p>
            <p className="mt-4 text-sm text-slate-400">Learning progress</p>
            <p className="mt-2">Consistent practice and roadmap completion.</p>
          </div>
        </div>
      </div>
    </PremiumShell>
  )
}
