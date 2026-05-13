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

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-10 pt-20 sm:px-6 sm:pb-14 sm:pt-28 lg:px-8 lg:pb-16 lg:pt-36">
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

            </motion.div>

          <motion.div
            id="preview"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.08 }}
            className="flex items-center justify-center w-full"
          >
            <div className="aspect-video w-full overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/50 backdrop-blur-sm shadow-lg shadow-zinc-200/50 dark:border-zinc-700/50 dark:bg-zinc-900/50 dark:shadow-black/30">
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
                    <div className="h-7 w-20 rounded-full bg-zinc-950 dark:bg-zinc-100" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <motion.section
          className="mt-20 flex flex-col items-center text-center sm:mt-28"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h2 className="max-w-4xl text-4xl font-bold tracking-tight text-zinc-950 sm:text-6xl dark:text-zinc-50">
            Less time organizing.<br />
            <span className="text-zinc-400 dark:text-zinc-500">More time creating.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Briefly acts as your intelligent partner. From the very first client meeting to the final approved scope, it ensures no detail is lost in translation. Stop wrestling with disjointed notes and focus on delivering brilliant work.
          </p>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <FeatureShowcase />
        </motion.div>

        <section id="workflow" className="mt-24 sm:mt-32">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Workflow</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
              The same operating rhythm as the workspace.
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {workflowItems.map((item, index) => {
              const Icon = item.icon

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: index * 0.15, ease: 'easeOut' }}
                >
                  <Card className="h-full border border-zinc-200/50 bg-white/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-zinc-200/50 dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:hover:shadow-black/50">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-6 text-lg font-semibold text-zinc-950 dark:text-zinc-100">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{item.description}</p>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </section>
      </main>

      <HomeFooter onNavigate={onNavigate} />
    </div>
  )
}
