import { CreditCard, Mail, User, Wand2 } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import LanguageToggle from '../components/shared/LanguageToggle'
import { useAuthStore } from '../store/useAuthStore'

export default function AccountView() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">Account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl">
          Workspace settings
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
          Profile, language, tone defaults, and billing entry points for the Briefly workspace.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-6">
          <Card>
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                <User className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-zinc-950">Profile</h2>
                <p className="text-sm text-zinc-500">Update agency identity shown across the app.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-zinc-600">Agency name</span>
                <Input defaultValue={user?.agencyName || 'Demo Agency'} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-zinc-600">Email</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input defaultValue={user?.email || 'demo@briefly.ai'} className="pl-9" />
                </div>
              </label>
            </div>

            <Button className="mt-5">Save profile</Button>
          </Card>

          <Card>
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                <Wand2 className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-zinc-950">Preferences</h2>
                <p className="text-sm text-zinc-500">Tune the default experience for future briefs.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm font-semibold text-zinc-950">Default language</p>
                <div className="mt-3">
                  <LanguageToggle />
                </div>
              </div>
              <label className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <span className="text-sm font-semibold text-zinc-950">Tone profile</span>
                <select className="mt-3 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 outline-none transition-all duration-200 ease-in-out focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100">
                  <option>Startup Casual</option>
                  <option>Corporate Formal</option>
                  <option>Technical Precise</option>
                </select>
              </label>
            </div>
          </Card>
        </section>

        <aside>
          <Card className="sticky top-24">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-white">
                <CreditCard className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-zinc-950">Billing</h2>
                <p className="text-sm text-zinc-500">Stripe Pro-tier entry point</p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-950">Current plan</p>
              <p className="mt-1 text-2xl font-semibold tracking-normal text-zinc-950">Hackathon Demo</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Upgrade wiring can attach here when Stripe keys and backend billing endpoints are ready.
              </p>
            </div>

            <Button className="mt-5 w-full" disabled>
              Upgrade to Pro
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  )
}
