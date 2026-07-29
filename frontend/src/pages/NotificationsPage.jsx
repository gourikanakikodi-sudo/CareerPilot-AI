import { useEffect, useState } from 'react'
import PremiumShell from '../components/PremiumShell'
import { Card, Badge } from '../components/UI'
import { CardSkeleton } from '../components/Skeletons'
import api from '../services/api'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/notifications/')
      .then((response) => setNotifications(response.data.notifications || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PremiumShell title="Notifications" subtitle="Stay on top of interview prep and career updates">
      {loading ? <CardSkeleton /> : null}
      {!loading ? <Card>
        <div className="space-y-3">
          {notifications.map((item) => <div key={`${item.title}-${item.detail}`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3"><div><p className="font-medium text-white">{item.title}</p><p className="text-sm text-slate-400">{item.detail}</p></div><Badge tone={item.tone}>{item.tone}</Badge></div>)}
          {!notifications.length ? <p className="text-sm text-slate-400">No notifications yet.</p> : null}
        </div>
      </Card> : null}
    </PremiumShell>
  )
}
