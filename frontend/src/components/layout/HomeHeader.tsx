import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Sparkles, ClipboardList, Link2, Mic, Image, Moon, Sun, LayoutDashboard, Settings, LogOut, User } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'

interface HomeHeaderProps {
  onNavigate: (path: string) => void
}

const features = [
  { label: 'AI Brief Generation', description: 'Turn raw client input into structured briefs', icon: Sparkles },
  { label: 'Intake Management', description: 'Organize notes, voice memos, and images', icon: ClipboardList },
  { label: 'Shareable Links', description: 'Send client-ready documents for review', icon: Link2 },
  { label: 'Voice Recording', description: 'Capture and transcribe client conversations', icon: Mic },
  { label: 'Image Attachments', description: 'Include whiteboard photos and screenshots', icon: Image },
]

function getInitialDarkMode(): boolean {
  try {
    const stored = localStorage.getItem('briefly-dark-mode')
    if (stored !== null) return stored === 'true'
  } catch { /* ignore */ }
  return false
}

export default function HomeHeader({ onNavigate }: HomeHeaderProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [featuresOpen, setFeaturesOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(getInitialDarkMode)
  const featuresRef = useRef<HTMLDivElement>(null)
  const accountRef = useRef<HTMLDivElement>(null)

  // Apply dark mode class to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    try { localStorage.setItem('briefly-dark-mode', String(darkMode)) } catch { /* ignore */ }
  }, [darkMode])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (featuresRef.current && !featuresRef.current.contains(event.target as Node)) {
        setFeaturesOpen(false)
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const userInitial = (user?.agencyName || user?.email || 'U').slice(0, 1).toUpperCase()

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* Left side — Logo + Navigation */}
        <div className="flex items-center gap-1">
          {/* Logo */}
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="flex shrink-0 items-center gap-0 transition-opacity duration-200 hover:opacity-80 mr-2"
            aria-label="Go to Briefly home"
          >
            <img
              src="/logo-title-black.png"
              alt="Briefly"
              className="h-6 dark:invert"
              draggable={false}
            />
          </button>

          {/* Navigation */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Home navigation">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="rounded-lg px-3.5 py-2 text-sm font-semibold text-zinc-950 transition-all duration-200 ease-in-out hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Home
            </button>

            {/* Features dropdown */}
            <div className="relative" ref={featuresRef}>
              <button
                type="button"
                onClick={() => setFeaturesOpen(!featuresOpen)}
                className={[
                  'inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all duration-200 ease-in-out',
                  featuresOpen
                    ? 'bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-100'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
                ].join(' ')}
              >
                Features
                <ChevronDown
                  className={[
                    'h-3.5 w-3.5 transition-transform duration-200',
                    featuresOpen ? 'rotate-180' : '',
                  ].join(' ')}
                />
              </button>

              {featuresOpen && (
                <div className="absolute left-1/2 top-full mt-2 w-80 -translate-x-1/2 overflow-hidden rounded-xl border border-zinc-200 bg-white p-2 shadow-xl shadow-zinc-200/60 animate-in fade-in slide-in-from-top-1 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/40">
                  {features.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          setFeaturesOpen(false)
                          onNavigate(isAuthenticated ? '/intake/new' : '/register')
                        }}
                        className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150 ease-in-out hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">{item.label}</p>
                          <p className="mt-0.5 text-xs leading-4 text-zinc-500 dark:text-zinc-400">{item.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right side — Dark mode toggle + Account */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-all duration-200 ease-in-out hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>

          {isAuthenticated ? (
            /* Account circle + dropdown */
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen(!accountOpen)}
                className={[
                  'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold shadow-sm transition-all duration-200 ease-in-out',
                  accountOpen
                    ? 'border-zinc-400 bg-zinc-950 text-white dark:border-zinc-500 dark:bg-zinc-100 dark:text-zinc-950'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600',
                ].join(' ')}
                aria-label="Open account menu"
              >
                {userInitial}
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1.5 shadow-xl shadow-zinc-200/60 animate-in fade-in slide-in-from-top-1 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/40">
                  {/* User info */}
                  <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                    <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">{user?.agencyName || 'User'}</p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">{user?.email || ''}</p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAccountOpen(false)
                        onNavigate('/dashboard')
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-zinc-700 transition-colors duration-150 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <LayoutDashboard className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                      Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountOpen(false)
                        onNavigate('/account')
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-zinc-700 transition-colors duration-150 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <Settings className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                      Account Settings
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountOpen(false)
                        onNavigate('/intake/new')
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-zinc-700 transition-colors duration-150 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <User className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                      New Intake
                    </button>
                  </div>

                  {/* Log out */}
                  <div className="border-t border-zinc-100 py-1 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        setAccountOpen(false)
                        logout()
                        onNavigate('/')
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-red-600 transition-colors duration-150 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <LogOut className="h-4 w-4" />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="hidden rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm font-semibold text-zinc-800 transition-all duration-200 ease-in-out hover:border-zinc-400 hover:bg-zinc-50 sm:inline-flex dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-700"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/register')}
                className="inline-flex rounded-full bg-zinc-950 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 ease-in-out hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
