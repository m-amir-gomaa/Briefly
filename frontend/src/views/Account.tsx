import { useState } from 'react'
import { CreditCard, Globe, KeyRound, LockKeyhole, Mail, Shield, User, Wand2 } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import { useAuthStore } from '../store/useAuthStore'

type Tab = 'profile' | 'security' | 'preferences' | 'billing'

const tabs: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'preferences', label: 'Preferences', icon: Wand2 },
  { id: 'billing', label: 'Billing', icon: CreditCard },
]

export default function AccountView() {
  const user = useAuthStore((state) => state.user)
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [agencyName, setAgencyName] = useState(user?.agency_name || '')
  const [geminiKey, setGeminiKey] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpdateProfile = async () => {
    setLoading(true)
    try {
      const { updateProfile } = await import('../services/api').then(m => ({ updateProfile: m.updateProfile || m.updateProfile /* fallback if I rename */ }))
      // Actually I named it UpdateProfile in the backend but I need to check the frontend service.
      const api = await import('../services/api')
      await api.updateProfile({ agency_name: agencyName, gemini_api_key: geminiKey })
      alert('Profile updated successfully!')
      // Refresh user data
      await useAuthStore.getState().checkAuth()
    } catch (e) {
      alert('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl dark:text-zinc-50">
          Settings
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Manage your profile, security, preferences, and billing.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Sidebar navigation */}
        <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'flex items-center gap-3 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-zinc-950 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-950'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
                ].join(' ')}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* Tab content */}
        <div className="space-y-6">
          {/* ─── Profile ─── */}
          {activeTab === 'profile' && (
            <>
              <Card>
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 overflow-hidden items-center justify-center rounded-full bg-zinc-100 text-2xl font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      (user?.agency_name || user?.email || 'D').slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">{user?.agency_name || 'Demo Agency'}</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{user?.email}</p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label>
                    <Input value={agencyName} onChange={(e) => setAgencyName(e.target.value)} />
                  </label>
                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">Gemini API Key (Optional)</span>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <Input 
                        type="password" 
                        placeholder="Paste your key here" 
                        className="pl-9" 
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                      />
                    </div>
                  </label>
                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">Email address</span>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <Input disabled defaultValue={user?.email || ''} className="pl-9" />
                    </div>
                  </label>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-zinc-200 pt-5 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Changes are applied workspace-wide.</p>
                  <Button disabled={loading} onClick={handleUpdateProfile}>Save changes</Button>
                </div>
              </Card>
            </>
          )}

          {/* ─── Security ─── */}
          {activeTab === 'security' && (
            <>
              <Card>
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    <KeyRound className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-100">Change password</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Update your password to keep your account secure.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">Current password</span>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <Input type="password" placeholder="••••••••" className="pl-9" />
                    </div>
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label>
                      <span className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">New password</span>
                      <Input type="password" placeholder="At least 8 characters" />
                    </label>
                    <label>
                      <span className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">Confirm new password</span>
                      <Input type="password" placeholder="Re-enter password" />
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-zinc-200 pt-5 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">You will be signed out after changing your password.</p>
                  <Button>Update password</Button>
                </div>
              </Card>

              <Card>
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    <Shield className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-red-600 dark:text-red-400">Danger zone</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Irreversible actions for your account.</p>
                  </div>
                </div>

                <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">Delete workspace</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Permanently remove your workspace, briefs, and all data.</p>
                    </div>
                    <Button variant="danger" className="shrink-0">Delete workspace</Button>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* ─── Preferences ─── */}
          {activeTab === 'preferences' && (
            <Card>
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <Globe className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-100">Preferences</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Customize defaults for new briefs.</p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                <label className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                  <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">Tone profile</span>
                  <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">Set the voice for generated briefs.</p>
                  <select className="min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 outline-none transition-all duration-200 ease-in-out focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200 dark:focus:border-zinc-500 dark:focus:ring-zinc-600/40">
                    <option>Startup Casual</option>
                    <option>Corporate Formal</option>
                    <option>Technical Precise</option>
                  </select>
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end border-t border-zinc-200 pt-5 dark:border-zinc-800">
                <Button>Save preferences</Button>
              </div>
            </Card>
          )}

          {/* ─── Billing ─── */}
          {activeTab === 'billing' && (
            <Card>
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950">
                  <CreditCard className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-100">Billing & Plan</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage your subscription and payment methods.</p>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-800">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">Current plan</p>
                    <p className="mt-1 text-2xl font-semibold tracking-normal capitalize text-zinc-950 dark:text-zinc-100">{user?.plan_tier || 'Free'}</p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {user?.plan_tier === 'pro' ? 'Unlimited briefs.' : 'Free tier — 3 briefs per month.'}
                    </p>
                  </div>
                  <Button 
                    disabled={user?.plan_tier === 'pro'} 
                    className="shrink-0"
                    onClick={async () => {
                      try {
                        const { url } = await import('../services/api').then(m => m.createCheckoutSession())
                        window.location.href = url
                      } catch (e) {
                        alert('Failed to start checkout session')
                      }
                    }}
                  >
                    {user?.plan_tier === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
                  </Button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Briefs generated', value: '∞' },
                  { label: 'Storage used', value: '—' },
                  { label: 'Team members', value: '1' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">{stat.label}</p>
                    <p className="mt-2 text-xl font-semibold text-zinc-950 dark:text-zinc-100">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-zinc-200 pt-5 dark:border-zinc-800">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Payments are processed securely via Stripe.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
