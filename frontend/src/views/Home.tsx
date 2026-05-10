import { motion } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  Link2,
  Sparkles,
  Zap,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import StatusBadge from '../components/shared/StatusBadge'
import { useAuthStore } from '../store/useAuthStore'

interface HomeViewProps {
  onNavigate: (path: string) => void
}

const proofPoints = [
  { label: 'Inputs', value: 'Text, voice, image' },
  { label: 'Output', value: 'Structured brief' },
  { label: 'Review', value: 'Client-ready link' },
]

const workflowItems = [
  {
    title: 'Collect intake',
    description: 'Drop in messy notes, calls, sketches, and client messages from the first conversation.',
    icon: ClipboardList,
  },
  {
    title: 'Generate the brief',
    description: 'Briefly organizes the raw material into goals, scope, assumptions, risks, and next steps.',
    icon: Sparkles,
  },
  {
    title: 'Share for approval',
    description: 'Send a clean public document and keep every approval tied back to the workspace.',
    icon: Link2,
  },
]

const previewRows = [
  { title: 'Brand refresh kickoff', type: 'MULTI', status: 'COMPLETED', created: 'May 10, 9:42 PM' },
  { title: 'Mobile app discovery', type: 'VOICE', status: 'PROCESSING', created: 'May 10, 9:18 PM' },
] as const

export default function HomeView({ onNavigate }: HomeViewProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const primaryPath = isAuthenticated ? '/dashboard' : '/register'

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="flex min-w-0 items-center gap-3"
            aria-label="Go to Briefly home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-sm">
              <Zap className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-semibold text-zinc-950">Briefly</span>
              <span className="block truncate text-xs font-medium text-zinc-500">AI project briefs</span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 text-sm font-semibold text-zinc-600 md:flex" aria-label="Home navigation">
            <a href="#workflow" className="rounded-md px-3 py-2 transition-all duration-200 ease-in-out hover:bg-zinc-100 hover:text-zinc-950">
              Workflow
            </a>
            <a href="#preview" className="rounded-md px-3 py-2 transition-all duration-200 ease-in-out hover:bg-zinc-100 hover:text-zinc-950">
              Product
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button onClick={() => onNavigate('/dashboard')} icon={<LayoutDashboard className="h-4 w-4" />}>
                Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={() => onNavigate('/login')}
                  className="hidden sm:inline-flex"
                >
                  Sign in
                </Button>
                <Button onClick={() => onNavigate('/register')} icon={<ArrowRight className="h-4 w-4" />}>
                  Sign up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)]">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Agency intake workspace
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight tracking-normal text-zinc-950 sm:text-5xl">
              Turn rough client input into a polished brief.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-600">
              Briefly gives agencies one calm place to capture notes, voice, and visual context, then turn it into a structured scope document ready for review.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              <Button
                size="lg"
                onClick={() => onNavigate(primaryPath)}
                icon={<FilePlus2 className="h-4 w-4" />}
              >
                {isAuthenticated ? 'Create new brief' : 'Create workspace'}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => onNavigate(isAuthenticated ? '/dashboard' : '/login')}
                icon={<LayoutDashboard className="h-4 w-4" />}
              >
                {isAuthenticated ? 'View dashboard' : 'Sign in'}
              </Button>
            </div>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {proofPoints.map((item) => (
                <Card key={item.label} className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">{item.label}</p>
                  <p className="mt-2 text-sm font-semibold leading-5 text-zinc-950">{item.value}</p>
                </Card>
              ))}
            </div>
          </motion.div>

          <motion.div
            id="preview"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.08 }}
          >
            <Card padded={false} className="overflow-hidden">
              <div className="flex h-14 items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-white">
                    <Zap className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-zinc-500">Briefly / New Intake</p>
                    <p className="truncate text-sm font-semibold text-zinc-950">Creative workspace</p>
                  </div>
                </div>
                <span className="hidden rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-600 sm:inline-flex">
                  Demo Agency
                </span>
              </div>

              <div className="grid gap-4 bg-zinc-50 p-4 lg:grid-cols-[minmax(0,1fr)_190px]">
                <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                      Creative workspace
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-normal text-zinc-950">
                      Turn loose intake into a client-ready brief
                    </h2>
                  </div>

                  <div className="mt-5 min-h-40 rounded-md border border-zinc-200 bg-zinc-50 p-4">
                    <div className="h-3 w-3/4 rounded-full bg-zinc-200" />
                    <div className="mt-3 h-3 w-full rounded-full bg-zinc-200" />
                    <div className="mt-3 h-3 w-5/6 rounded-full bg-zinc-200" />
                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-white p-3 ring-1 ring-zinc-200">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Audio</p>
                        <div className="mt-3 h-2 rounded-full bg-zinc-200">
                          <div className="h-full w-2/3 rounded-full bg-zinc-950" />
                        </div>
                      </div>
                      <div className="rounded-xl bg-white p-3 ring-1 ring-zinc-200">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Image</p>
                        <div className="mt-3 grid grid-cols-4 gap-1">
                          {[28, 18, 24, 14].map((height) => (
                            <span
                              key={height}
                              className="block rounded-sm bg-zinc-300"
                              style={{ height }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                        <ClipboardList className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-zinc-950">Submission state</p>
                        <p className="mt-1 text-xs leading-5 text-zinc-500">Ready to generate</p>
                      </div>
                    </div>
                    <Button className="mt-4 w-full" size="sm" icon={<Sparkles className="h-3.5 w-3.5" />}>
                      Generate
                    </Button>
                  </Card>

                  <Card className="p-4">
                    <p className="text-sm font-semibold text-zinc-950">Brief quality</p>
                    <div className="mt-4 space-y-3">
                      {['Scope', 'Risks', 'Timeline'].map((item) => (
                        <div key={item} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-zinc-500">{item}</span>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>

              <div className="overflow-x-auto border-t border-zinc-200 bg-white">
                <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
                  <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
                    <tr>
                      <th className="px-4 py-3">Brief</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white">
                    {previewRows.map((row) => (
                      <tr key={row.title}>
                        <td className="px-4 py-3 font-semibold text-zinc-950">{row.title}</td>
                        <td className="px-4 py-3 font-semibold text-zinc-700">{row.type}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{row.created}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        </section>

        <section id="workflow" className="mt-12">
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">Workflow</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-zinc-950 sm:text-3xl">
              The same operating rhythm as the workspace.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {workflowItems.map((item) => {
              const Icon = item.icon

              return (
                <Card key={item.title}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-base font-semibold text-zinc-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{item.description}</p>
                </Card>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
