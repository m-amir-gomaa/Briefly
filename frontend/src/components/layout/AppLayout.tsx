import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FilePlus2,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings,
  Sun,
  Zap,
  Calendar,
  FolderKanban,
  Files,
  Users,
  UsersRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
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
  { path: '/projects', label: 'Projects', icon: FolderKanban },
  { path: '/briefs', label: 'Briefs', icon: Files },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/team', label: 'Team', icon: UsersRound },
  { path: '/account', label: 'Account', icon: Settings },
]

function getBreadcrumb(path: string) {
  if (path.startsWith('/intake/new')) return ['Briefly', 'New Intake']
  if (path.startsWith('/intake/')) return ['Briefly', 'Brief Review']
  if (path.startsWith('/account')) return ['Briefly', 'Account']
  if (path.startsWith('/calendar')) return ['Briefly', 'Calendar']
  if (path.startsWith('/projects')) return ['Briefly', 'Projects']
  if (path.startsWith('/briefs')) return ['Briefly', 'Briefs']
  if (path.startsWith('/clients')) return ['Briefly', 'Clients']
  if (path.startsWith('/team')) return ['Briefly', 'Team']
  return ['Briefly', 'Dashboard']
}

function isActive(currentPath: string, itemPath: string) {
  if (itemPath === '/dashboard') return currentPath === '/' || currentPath === '/dashboard'
  return currentPath.startsWith(itemPath)
}

function getInitialDarkMode(): boolean {
  try {
    const stored = localStorage.getItem('briefly-dark-mode')
    if (stored !== null) return stored === 'true'
  } catch { /* ignore */ }
  return false
}

export default function AppLayout({ children, currentPath, onNavigate }: AppLayoutProps) {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const breadcrumb = getBreadcrumb(currentPath)
  const [darkMode, setDarkMode] = useState(getInitialDarkMode)
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll for transparent header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Sync dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    try { localStorage.setItem('briefly-dark-mode', String(darkMode)) } catch { /* ignore */ }
  }, [darkMode])

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-950 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Sidebar spacer to prevent content push */}
      <div className="hidden lg:block w-[76px] shrink-0"></div>
      
      {/* Actual Sidebar */}
      <aside className="group fixed top-0 left-0 hidden h-screen w-[76px] border-r border-zinc-200/50 bg-white/20 backdrop-blur-xl transition-[width] duration-300 ease-in-out hover:w-64 delay-0 hover:delay-500 overflow-hidden z-40 lg:flex lg:flex-col lg:items-start lg:py-4 lg:px-3 dark:border-zinc-800/50 dark:bg-zinc-950/20">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="mb-6 flex h-11 w-full items-center justify-start rounded-xl px-2.5 transition-all duration-200 ease-in-out hover:opacity-80"
          aria-label="Go to home"
        >
          <div className="relative flex h-6 w-full shrink-0 items-center justify-start">
            <img src="/logo-black.png" alt="Briefly" className="absolute left-[3px] top-0 h-6 object-contain dark:invert transition-opacity duration-300 group-hover:opacity-0" />
            <img src="/logo-title-black.png" alt="Briefly" className="absolute left-[3px] top-0 h-6 w-auto max-w-none object-contain object-left dark:invert opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
        </button>

        <nav className="flex w-full flex-1 flex-col gap-2" aria-label="Primary navigation">
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
                  'flex h-11 w-full items-center justify-start rounded-md px-2.5 transition-all duration-200 ease-in-out',
                  active
                    ? 'bg-zinc-950 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-950'
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
                ].join(' ')}
                aria-label={item.label}
              >
                <div className="flex w-6 shrink-0 justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="ml-3 truncate whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover:opacity-100 font-medium">
                  {item.label}
                </span>
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
          className="flex h-11 w-full items-center justify-start rounded-md px-2.5 text-zinc-500 transition-all duration-200 ease-in-out hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label="Sign out"
        >
          <div className="flex w-6 shrink-0 justify-center">
            <LogOut className="h-5 w-5" />
          </div>
          <span className="ml-3 truncate whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover:opacity-100 font-medium">
            Sign out
          </span>
        </button>
      </aside>

      <main className="min-w-0 flex-1">
        <header className={`sticky top-0 z-30 transition-all duration-300 ${
          isScrolled 
            ? 'border-b border-zinc-200/50 bg-white/20 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/20' 
            : 'border-b border-transparent bg-transparent dark:border-transparent dark:bg-transparent'
        }`}>
          <div className="flex h-20 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/dashboard')}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-white lg:hidden dark:bg-zinc-100 dark:text-zinc-950"
                aria-label="Go to dashboard"
              >
                <Zap className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {breadcrumb.join(' / ')}
                </p>
                <p className="truncate text-base font-semibold text-zinc-950 dark:text-zinc-100">
                  {breadcrumb[breadcrumb.length - 1]}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">

              {/* Dark mode toggle */}
              <button
                type="button"
                onClick={() => setDarkMode((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-all duration-200 ease-in-out hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/account')}
                className="flex h-10 w-10 overflow-hidden items-center justify-center rounded-full border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 shadow-sm transition-all duration-200 ease-in-out hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600"
                aria-label="Open account"
              >
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  (user?.agency_name || user?.email || 'D').slice(0, 1).toUpperCase()
                )}
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
