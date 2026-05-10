import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  PlusCircle,
  Sparkles,
  Settings,
  HelpCircle,
  Zap,
} from 'lucide-react'

interface LayoutProps {
  children: ReactNode
  currentPath: string
  onNavigate: (path: string) => void
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/intake/new', label: 'New Intake', icon: PlusCircle },
]

export default function Layout({ children, currentPath, onNavigate }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside className="glass w-64 flex flex-col shrink-0" id="sidebar-nav">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">Briefly</h1>
            <p className="text-xs text-surface-400">AI Brief Generator</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPath === item.path
            return (
              <motion.button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-400 shadow-lg shadow-brand-500/5'
                    : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
                }`}
                id={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400"
                  />
                )}
              </motion.button>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-4 space-y-1 border-t border-surface-800/50">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-surface-500 hover:text-surface-300 transition-colors">
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-surface-500 hover:text-surface-300 transition-colors">
            <HelpCircle className="w-4 h-4" />
            Help
          </button>
        </div>

        {/* Pro card */}
        <div className="p-4">
          <div className="rounded-2xl p-4 gradient-brand glow-brand">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">AI Powered</span>
            </div>
            <p className="text-xs text-blue-100/80 leading-relaxed">
              Transform messy inputs into structured, actionable project briefs.
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main Content ───────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {/* Ambient background */}
        <div className="fixed inset-0 pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-accent-500/5 rounded-full blur-[100px]" />
        </div>

        <motion.div
          key={currentPath}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
