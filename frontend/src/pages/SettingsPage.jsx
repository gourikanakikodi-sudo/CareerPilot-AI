import PremiumShell from '../components/PremiumShell'
import { Card, Button, Input, Badge } from '../components/UI'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const { pushToast } = useToast()

  return (
    <PremiumShell title="Settings" subtitle="Tailor your workspace and preferences">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400">Theme</p>
              <div className="mt-2 flex gap-2">
                <Badge tone={theme === 'dark' ? 'info' : 'default'}>Dark</Badge>
                <Badge tone={theme === 'light' ? 'info' : 'default'}>Light</Badge>
                <Button variant="secondary" onClick={toggleTheme}>Switch theme</Button>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400">Email notifications</p>
              <Input placeholder="name@company.com" className="mt-2" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Interview reminders</p>
              <Input placeholder="Weekly digest" className="mt-2" />
            </div>
            <Button onClick={() => pushToast('Preferences saved locally.', 'success')}>Save preferences</Button>
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-white">Security</h3>
          <p className="mt-2 text-sm text-slate-400">Your account uses secure JWT authentication and encrypted session handling.</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">2FA readiness</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">Audit log enabled</div>
          </div>
        </Card>
      </div>
    </PremiumShell>
  )
}
