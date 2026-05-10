import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  FilePlus2,
  LayoutDashboard,
  PanelLeft,
  Sparkles,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

interface LayoutProps {
  children: ReactNode
  currentPath: string
  onNavigate: (path: string) => void
}

interface NavItem {
  path: string
  label: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/intake/new', label: 'New Intake', icon: FilePlus2 },
]

function isActive(currentPath: string, itemPath: string) {
  if (itemPath === '/') return currentPath === '/'
  return currentPath.startsWith(itemPath)
}

export default function Layout({ children, currentPath, onNavigate }: LayoutProps) {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="min-h-screen bg-canvas text-ink-950 lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden border-r border-line bg-surface lg:flex lg:min-h-screen lg:flex-col">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 border-b border-line px-5 py-5"
          aria-label="Go to dashboard"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-950 text-white">
            <Zap className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-base font-semibold tracking-normal">Briefly</span>
            <span className="block text-xs font-medium text-ink-500">Agency workspace</span>
          </span>
        </button>

        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Primary navigation">
          {navItems.map((item) => {
            const active = isActive(currentPath, item.path)
            const Icon = item.icon

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => onNavigate(item.path)}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-brand-100 text-brand-700'
                    : 'text-ink-600 hover:bg-surface-muted hover:text-ink-950'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="border-t border-line p-4">
          <div className="rounded-lg border border-line bg-canvas p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-600" />
              <span className="text-sm font-semibold text-ink-950">
                {user?.agencyName || 'Demo Agency'}
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-ink-500">{user?.email}</p>
          </div>
        </div>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-950 text-white">
                <Zap className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">Briefly</p>
                <p className="text-xs text-ink-500">Workspace</p>
              </div>
            </div>

            <div className="hidden items-center gap-2 text-sm text-ink-500 lg:flex">
              <PanelLeft className="h-4 w-4" />
              <span>Brief pipeline</span>
            </div>

            <div className="flex items-center gap-2">
              {navItems.map((item) => {
                const active = isActive(currentPath, item.path)
                const Icon = item.icon

                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => onNavigate(item.path)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active
                        ? 'bg-ink-950 text-white'
                        : 'border border-line bg-surface text-ink-600 hover:border-ink-400 hover:text-ink-950'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </header>

        <motion.div
          key={currentPath}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
