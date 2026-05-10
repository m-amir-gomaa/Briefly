import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Copy,
  FilePlus2,
  FileText,
  Image,
  Loader2,
  Mic,
  RefreshCw,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useIntakeStore } from '../store/useIntakeStore'
import type { BackendIntakeStatus, IntakeRecord, IntakeType } from '../lib/api'

interface DashboardProps {
  onNavigate: (path: string) => void
}

const statusConfig: Record<
  BackendIntakeStatus,
  { icon: LucideIcon; label: string; className: string }
> = {
  PENDING: {
    icon: Clock3,
    label: 'Queued',
    className: 'bg-amber-100 text-amber-600',
  },
  PROCESSING: {
    icon: Loader2,
    label: 'Processing',
    className: 'bg-brand-100 text-brand-700',
  },
  COMPLETED: {
    icon: CheckCircle2,
    label: 'Complete',
    className: 'bg-teal-100 text-teal-600',
  },
  FAILED: {
    icon: AlertCircle,
    label: 'Failed',
    className: 'bg-red-100 text-red-600',
  },
}

const typeIcons: Record<IntakeType, LucideIcon> = {
  TEXT: FileText,
  VOICE: Mic,
  IMAGE: Image,
  MULTI: Zap,
}

function formatDate(value: string) {
  if (!value) return 'Just now'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function summarize(record: IntakeRecord) {
  if (record.brief?.summary) return record.brief.summary
  if (record.raw_text?.trim()) return record.raw_text.trim()
  if (record.type === 'VOICE') return 'Audio intake'
  if (record.type === 'IMAGE') return 'Image intake'
  return 'Multimodal intake'
}

export default function DashboardView({ onNavigate }: DashboardProps) {
  const {
    intakes,
    dashboardStatus,
    refreshTrackedIntakes,
    errorMessage,
  } = useIntakeStore()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    void refreshTrackedIntakes()
  }, [refreshTrackedIntakes])

  const metrics = useMemo(() => {
    const completed = intakes.filter((record) => record.status === 'COMPLETED').length
    const inFlight = intakes.filter((record) =>
      record.status === 'PENDING' || record.status === 'PROCESSING'
    ).length
    const confirmed = intakes.filter((record) => record.brief?.is_confirmed).length
    const averageConfidence = intakes.length
      ? Math.round(
          (intakes.reduce((sum, record) => sum + (record.brief?.confidence_score || 0), 0)
            / Math.max(completed, 1))
            * 100,
        )
      : 0

    return { completed, inFlight, confirmed, averageConfidence }
  }, [intakes])

  const copyPublicLink = async (record: IntakeRecord) => {
    if (!record.brief?.share_token) return

    const url = `${window.location.origin}/public/brief/${record.brief.share_token}`
    await navigator.clipboard.writeText(url)
    setCopiedId(record.id)
    window.setTimeout(() => setCopiedId(null), 1600)
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-700">
            Intake operations
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink-950 sm:text-4xl">
            Project briefs, from intake to sign-off
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">
            Recent submissions from this browser are hydrated through the Go API and updated after the AI worker finishes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void refreshTrackedIntakes()}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:border-ink-400 hover:text-ink-950"
          >
            <RefreshCw className={`h-4 w-4 ${dashboardStatus === 'LOADING' ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/intake/new')}
            className="flex items-center gap-2 rounded-lg bg-ink-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-800"
          >
            <FilePlus2 className="h-4 w-4" />
            New Intake
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Tracked', value: intakes.length, helper: 'Local history', icon: ClipboardCheck },
          { label: 'Complete', value: metrics.completed, helper: 'Ready briefs', icon: CheckCircle2 },
          { label: 'In flight', value: metrics.inFlight, helper: 'Queued or processing', icon: Clock3 },
          {
            label: 'Avg confidence',
            value: metrics.averageConfidence ? `${metrics.averageConfidence}%` : '0%',
            helper: `${metrics.confirmed} confirmed`,
            icon: Zap,
          },
        ].map((stat, index) => {
          const Icon = stat.icon

          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-lg border border-line bg-surface p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-ink-600">{stat.label}</p>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-muted text-ink-700">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-normal text-ink-950">{stat.value}</p>
              <p className="mt-1 text-xs font-medium text-ink-500">{stat.helper}</p>
            </motion.div>
          )
        })}
      </section>

      <section className="rounded-lg border border-line bg-surface shadow-sm">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink-950">Recent intakes</h2>
            <p className="text-sm text-ink-500">Open an intake to review the generated brief and public link.</p>
          </div>
          {dashboardStatus === 'LOADING' && (
            <span className="flex items-center gap-2 rounded-lg bg-brand-100 px-3 py-1.5 text-xs font-semibold text-brand-700">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Syncing
            </span>
          )}
        </div>

        {errorMessage && dashboardStatus === 'ERROR' && (
          <div className="border-b border-line bg-red-100 px-4 py-3 text-sm font-medium text-red-600">
            {errorMessage}
          </div>
        )}

        {!intakes.length && dashboardStatus !== 'LOADING' ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <FilePlus2 className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-ink-950">No intakes yet</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-ink-600">
              Submit the first intake to create a structured brief and start local tracking.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('/intake/new')}
              className="mt-5 flex items-center gap-2 rounded-lg bg-ink-950 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <FilePlus2 className="h-4 w-4" />
              New Intake
            </button>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {intakes.map((record, index) => {
              const status = statusConfig[record.status]
              const StatusIcon = status.icon
              const TypeIcon = typeIcons[record.type]
              const isWorking = record.status === 'PROCESSING'
              const canCopy = Boolean(record.brief?.share_token)

              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="grid gap-4 p-4 transition hover:bg-surface-muted/70 lg:grid-cols-[minmax(0,1fr)_auto_auto]"
                >
                  <button
                    type="button"
                    onClick={() => onNavigate(`/intake/${record.id}`)}
                    className="flex min-w-0 items-start gap-3 text-left"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-700">
                      <TypeIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink-950">
                        {summarize(record)}
                      </span>
                      <span className="mt-1 block text-xs font-medium text-ink-500">
                        {record.type} intake - {formatDate(record.created_at)}
                      </span>
                    </span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${status.className}`}>
                      <StatusIcon className={`h-3.5 w-3.5 ${isWorking ? 'animate-spin' : ''}`} />
                      {status.label}
                    </span>
                    {record.brief && (
                      <span className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink-600">
                        {Math.round(record.brief.confidence_score * 100)}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 lg:justify-end">
                    {canCopy && (
                      <button
                        type="button"
                        onClick={() => void copyPublicLink(record)}
                        className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink-600 transition hover:border-ink-400 hover:text-ink-950"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {copiedId === record.id ? 'Copied' : 'Public link'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onNavigate(`/intake/${record.id}`)}
                      className="flex items-center gap-2 rounded-lg bg-ink-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-ink-800"
                    >
                      Open
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
