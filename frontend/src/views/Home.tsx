import { motion } from 'framer-motion'
import {
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  Link2,
  Sparkles,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import HomeHeader from '../components/layout/HomeHeader'
import HomeFooter from '../components/layout/HomeFooter'
import FeatureShowcase from '../components/home/FeatureShowcase'
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

export default function HomeView({ onNavigate }: HomeViewProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const primaryPath = isAuthenticated ? '/dashboard' : '/register'

  return (
    <div className="home-gradient-bg flex min-h-screen flex-col text-zinc-950 transition-colors duration-300 dark:text-zinc-100">
      <HomeHeader onNavigate={onNavigate} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <section className="grid items-center gap-8 pb-16 sm:pb-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)]">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
              Agency intake workspace
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight tracking-normal text-zinc-950 sm:text-5xl dark:text-zinc-50">
              Turn rough client input into a polished brief.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
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
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">{item.label}</p>
                  <p className="mt-2 text-sm font-semibold leading-5 text-zinc-950 dark:text-zinc-100">{item.value}</p>
                </Card>
              ))}
            </div>
          </motion.div>

          <motion.div
            id="preview"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.08 }}
            className="flex items-center justify-center"
          >
            <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg shadow-zinc-200/50 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/30">
              <div className="flex h-full w-full flex-col items-center justify-center p-8">
                {/* Decorative skeleton content — matching FeatureShowcase placeholder */}
                <div className="w-full max-w-xs space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="h-10 w-10 shrink-0 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                      <div className="h-2.5 w-1/2 rounded-full bg-zinc-50 dark:bg-zinc-800/60" />
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <div className="h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
                    <div className="h-3 w-5/6 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                    <div className="h-3 w-2/3 rounded-full bg-zinc-50 dark:bg-zinc-800/60" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
                      <div className="h-2.5 w-3/4 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                      <div className="mt-2 h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-700/60" />
                    </div>
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
                      <div className="h-2.5 w-1/2 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                      <div className="mt-2 h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-700/60" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="h-2.5 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                    <div className="h-7 w-20 rounded-md bg-zinc-950 dark:bg-zinc-100" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <FeatureShowcase />

        <section id="workflow" className="mt-24 sm:mt-32">
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Workflow</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-zinc-950 sm:text-3xl dark:text-zinc-50">
              The same operating rhythm as the workspace.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {workflowItems.map((item) => {
              const Icon = item.icon

              return (
                <Card key={item.title}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-base font-semibold text-zinc-950 dark:text-zinc-100">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{item.description}</p>
                </Card>
              )
            })}
          </div>
        </section>
      </main>

      <HomeFooter onNavigate={onNavigate} />
    </div>
  )
}
