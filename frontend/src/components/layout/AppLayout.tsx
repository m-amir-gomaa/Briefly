import { motion } from 'framer-motion'
import {
  FilePlus2,
  LayoutDashboard,
  LogOut,
  Settings,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import LanguageToggle from '../shared/LanguageToggle'
import { useAuthStore } from '../../store/useAuthStore'

interface AppLayoutProps {
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
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/intake/new', label: 'New Intake', icon: FilePlus2 },
  { path: '/account', label: 'Account', icon: Settings },
]

function getBreadcrumb(path: string) {
  if (path.startsWith('/intake/new')) return ['Briefly', 'New Intake']
  if (path.startsWith('/intake/')) return ['Briefly', 'Brief Review']
  if (path.startsWith('/account')) return ['Briefly', 'Account']
  return ['Briefly', 'Dashboard']
}

function isActive(currentPath: string, itemPath: string) {
  if (itemPath === '/dashboard') return currentPath === '/' || currentPath === '/dashboard'
  return currentPath.startsWith(itemPath)
}

export default function AppLayout({ children, currentPath, onNavigate }: AppLayoutProps) {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const breadcrumb = getBreadcrumb(currentPath)

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 lg:grid lg:grid-cols-[76px_minmax(0,1fr)]">
      <aside className="hidden border-r border-zinc-200 bg-white lg:flex lg:min-h-screen lg:flex-col lg:items-center lg:py-4">
        <button
          type="button"
          onClick={() => onNavigate('/dashboard')}
          className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-sm transition-all duration-200 ease-in-out hover:bg-zinc-800"
          aria-label="Go to dashboard"
        >
          <Zap className="h-5 w-5" />
        </button>

        <nav className="flex flex-1 flex-col gap-2" aria-label="Primary navigation">
          {navItems.map((item) => {
            const active = isActive(currentPath, item.path)
            const Icon = item.icon

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => onNavigate(item.path)}
                title={item.label}
                className={[
                  'flex h-11 w-11 items-center justify-center rounded-md transition-all duration-200 ease-in-out',
                  active
                    ? 'bg-zinc-950 text-white shadow-sm'
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950',
                ].join(' ')}
                aria-label={item.label}
              >
                <Icon className="h-5 w-5" />
              </button>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={() => {
            logout()
            onNavigate('/login')
          }}
          title="Sign out"
          className="flex h-11 w-11 items-center justify-center rounded-md text-zinc-500 transition-all duration-200 ease-in-out hover:bg-zinc-100 hover:text-zinc-950"
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/85 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/dashboard')}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-white lg:hidden"
                aria-label="Go to dashboard"
              >
                <Zap className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-500">
                  {breadcrumb.join(' / ')}
                </p>
                <p className="truncate text-base font-semibold text-zinc-950">
                  {breadcrumb[breadcrumb.length - 1]}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LanguageToggle />
              <button
                type="button"
                onClick={() => onNavigate('/account')}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 shadow-sm transition-all duration-200 ease-in-out hover:border-zinc-300"
                aria-label="Open account"
              >
                {(user?.agencyName || 'D').slice(0, 1).toUpperCase()}
              </button>
            </div>
          </div>
        </header>

        <motion.div
          key={currentPath}
          initial={{ opacity: 0, y: 10 }}
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
