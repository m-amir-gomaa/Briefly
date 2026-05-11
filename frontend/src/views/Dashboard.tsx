import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Copy,
  FilePlus2,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import StatusBadge from '../components/shared/StatusBadge'
import { useIntakeStore } from '../store/useIntakeStore'
import type { IntakeRecord } from '../services/api'

interface DashboardProps {
  onNavigate: (path: string) => void
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

function getTitle(record: IntakeRecord) {
  if (record.brief?.summary) return record.brief.summary
  if (record.raw_text.trim()) return record.raw_text.trim()
  return `${record.type} intake`
}

export default function DashboardView({ onNavigate }: DashboardProps) {
  const { intakes, dashboardStatus, refreshTrackedIntakes } = useIntakeStore()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    void refreshTrackedIntakes()
  }, [refreshTrackedIntakes])

  const stats = useMemo(() => {
    const completed = intakes.filter((intake) => intake.status === 'COMPLETED').length
    const processing = intakes.filter((intake) => intake.status === 'PENDING' || intake.status === 'PROCESSING').length
    const approved = intakes.filter((intake) => intake.brief?.is_confirmed).length

    return { completed, processing, approved }
  }, [intakes])

  const copyPublicLink = async (record: IntakeRecord) => {
    if (!record.brief?.share_token) return

    await navigator.clipboard.writeText(`${window.location.origin}/public/${record.brief.share_token}`)
    setCopiedId(record.id)
    window.setTimeout(() => setCopiedId(null), 1600)
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl dark:text-zinc-50">
            Brief pipeline
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Track intakes from raw input to client approval. This dashboard hydrates browser-tracked records from the backend.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => void refreshTrackedIntakes()}
            icon={<RefreshCw className={`h-4 w-4 ${dashboardStatus === 'LOADING' ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button onClick={() => onNavigate('/intake/new')} icon={<FilePlus2 className="h-4 w-4" />}>
            New Intake
          </Button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          { label: 'Completed briefs', value: stats.completed, icon: CheckCircle2 },
          { label: 'Processing now', value: stats.processing, icon: Loader2 },
          { label: 'Client approvals', value: stats.approved, icon: ClipboardList },
        ].map((stat) => {
          const Icon = stat.icon

          return (
            <Card key={stat.label}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950 dark:text-zinc-100">{stat.value}</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </Card>
          )
        })}
      </section>

      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-zinc-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-100">Past intakes</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Clean table view with backend status and share links.</p>
          </div>
          {dashboardStatus === 'LOADING' && (
            <span className="inline-flex items-center gap-2 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Syncing
            </span>
          )}
        </div>

        {!intakes.length && dashboardStatus !== 'LOADING' ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <ClipboardList className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-xl font-semibold text-zinc-950 dark:text-zinc-100">No intakes yet</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Start with your first client notes, voice memo, or whiteboard screenshot and Briefly will build the structured document.
            </p>
            <Button
              className="mt-6"
              onClick={() => onNavigate('/intake/new')}
              icon={<FilePlus2 className="h-4 w-4" />}
            >
              Create your first brief
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-sm dark:divide-zinc-800">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-5 py-3">Brief</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
                {intakes.map((record) => (
                  <tr key={record.id} className="transition-all duration-200 ease-in-out hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="max-w-xl px-5 py-4">
                      <button
                        type="button"
                        onClick={() => onNavigate(`/intake/${record.id}`)}
                        className="block max-w-full text-left"
                      >
                        <span className="block truncate font-semibold text-zinc-950 dark:text-zinc-100">{getTitle(record)}</span>
                        <span className="mt-1 block truncate font-mono text-xs text-zinc-500 dark:text-zinc-500">{record.id}</span>
                      </button>
                    </td>
                    <td className="px-5 py-4 font-semibold text-zinc-700 dark:text-zinc-300">{record.type}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">{formatDate(record.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {record.brief?.share_token && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => void copyPublicLink(record)}
                            icon={<Copy className="h-3.5 w-3.5" />}
                          >
                            {copiedId === record.id ? 'Copied' : 'Link'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => onNavigate(`/intake/${record.id}`)}
                          icon={<ArrowRight className="h-3.5 w-3.5" />}
                        >
                          Open
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
