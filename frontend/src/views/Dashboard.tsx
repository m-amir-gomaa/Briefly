import { motion } from 'framer-motion'
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Mic,
  Image,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Zap,
} from 'lucide-react'

interface DashboardProps {
  onNavigate: (path: string) => void
}

// Mock data per architecture spec
const mockIntakes = [
  {
    id: '1',
    type: 'TEXT',
    rawText: 'We need a mobile app for our food delivery startup targeting college students...',
    status: 'COMPLETED',
    createdAt: '2025-05-10T10:30:00Z',
    brief: { summary: 'Mobile food delivery app targeting college campuses with social features.', confidenceScore: 0.92 },
  },
  {
    id: '2',
    type: 'VOICE',
    rawText: 'Voice memo about rebranding project for tech company...',
    status: 'COMPLETED',
    createdAt: '2025-05-09T14:15:00Z',
    brief: { summary: 'Complete brand identity overhaul for B2B SaaS platform.', confidenceScore: 0.85 },
  },
  {
    id: '3',
    type: 'IMAGE',
    rawText: 'Whiteboard notes from client meeting about e-commerce platform...',
    status: 'PROCESSING',
    createdAt: '2025-05-10T16:45:00Z',
    brief: null,
  },
  {
    id: '4',
    type: 'TEXT',
    rawText: 'Marketing campaign brief for Q3 product launch across multiple channels...',
    status: 'PENDING',
    createdAt: '2025-05-10T17:00:00Z',
    brief: null,
  },
  {
    id: '5',
    type: 'MULTI',
    rawText: 'Website redesign project with competitor analysis screenshots and voice notes...',
    status: 'FAILED',
    createdAt: '2025-05-08T09:20:00Z',
    brief: null,
  },
]

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  PENDING: { icon: Clock, color: 'text-warning-400', bg: 'bg-warning-400/10', label: 'Pending' },
  PROCESSING: { icon: Loader2, color: 'text-brand-400', bg: 'bg-brand-400/10', label: 'Processing' },
  COMPLETED: { icon: CheckCircle2, color: 'text-success-400', bg: 'bg-success-400/10', label: 'Completed' },
  FAILED: { icon: AlertCircle, color: 'text-danger-400', bg: 'bg-danger-400/10', label: 'Failed' },
}

const typeIcons: Record<string, React.ElementType> = {
  TEXT: FileText,
  VOICE: Mic,
  IMAGE: Image,
  MULTI: Zap,
}

const stats = [
  { label: 'Total Briefs', value: '24', icon: BarChart3, change: '+12%', color: 'from-brand-500 to-brand-600' },
  { label: 'Avg. Confidence', value: '87%', icon: TrendingUp, change: '+3%', color: 'from-accent-500 to-accent-600' },
  { label: 'This Week', value: '8', icon: Zap, change: '+33%', color: 'from-success-400 to-success-500' },
]

export default function DashboardView({ onNavigate }: DashboardProps) {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-50">Dashboard</h1>
          <p className="text-surface-400 mt-1">Overview of your recent intakes and briefs</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('/intake/new')}
          className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-semibold text-sm shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-shadow cursor-pointer"
          id="new-intake-btn"
        >
          <Zap className="w-4 h-4" />
          New Intake
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-2xl p-6 hover:border-surface-600/30 transition-colors"
            id={`stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-success-400 bg-success-400/10 px-2 py-1 rounded-full">
                {stat.change}
              </span>
            </div>
            <p className="text-3xl font-bold text-surface-50">{stat.value}</p>
            <p className="text-sm text-surface-400 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Intakes */}
      <div>
        <h2 className="text-xl font-semibold text-surface-100 mb-4">Recent Intakes</h2>
        <div className="space-y-3">
          {mockIntakes.map((intake, i) => {
            const statusCfg = statusConfig[intake.status]
            const TypeIcon = typeIcons[intake.type] || FileText

            return (
              <motion.div
                key={intake.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl p-5 hover:border-surface-600/30 transition-all group cursor-pointer"
                id={`intake-${intake.id}`}
              >
                <div className="flex items-center gap-4">
                  {/* Type icon */}
                  <div className="w-11 h-11 rounded-xl bg-surface-800 flex items-center justify-center shrink-0">
                    <TypeIcon className="w-5 h-5 text-surface-300" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-100 truncate">
                      {intake.rawText}
                    </p>
                    {intake.brief && (
                      <p className="text-xs text-surface-400 mt-1 truncate">
                        {intake.brief.summary}
                      </p>
                    )}
                    <p className="text-xs text-surface-500 mt-1">
                      {new Date(intake.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* Status badge */}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${statusCfg.bg} shrink-0`}>
                    <statusCfg.icon className={`w-3.5 h-3.5 ${statusCfg.color} ${intake.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                    <span className={`text-xs font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
                  </div>

                  {/* Confidence score */}
                  {intake.brief?.confidenceScore && (
                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="text-xs text-surface-500">Confidence</p>
                      <p className="text-sm font-semibold text-surface-200">
                        {Math.round(intake.brief.confidenceScore * 100)}%
                      </p>
                    </div>
                  )}

                  {/* Arrow */}
                  <ArrowRight className="w-4 h-4 text-surface-600 group-hover:text-surface-300 transition-colors shrink-0" />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
