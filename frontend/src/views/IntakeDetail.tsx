import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clipboard,
  Copy,
  ExternalLink,
  FileText,
  HelpCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Target,
} from 'lucide-react'
import { useIntakeStore } from '../store/useIntakeStore'
import type { BackendIntakeStatus } from '../lib/api'
import type { LucideIcon } from 'lucide-react'

interface IntakeDetailProps {
  intakeId: string
  onNavigate: (path: string) => void
}

const statusConfig: Record<
  BackendIntakeStatus,
  { icon: LucideIcon; label: string; className: string }
> = {
  PENDING: { icon: Loader2, label: 'Queued', className: 'bg-amber-100 text-amber-600' },
  PROCESSING: { icon: Loader2, label: 'Processing', className: 'bg-brand-100 text-brand-700' },
  COMPLETED: { icon: CheckCircle2, label: 'Complete', className: 'bg-teal-100 text-teal-600' },
  FAILED: { icon: AlertCircle, label: 'Failed', className: 'bg-red-100 text-red-600' },
}

function formatDate(value?: string) {
  if (!value) return 'Not available'

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function IntakeDetailView({ intakeId, onNavigate }: IntakeDetailProps) {
  const {
    currentIntake,
    fetchIntake,
    subscribeToEvents,
    eventMessage,
  } = useIntakeStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)

      const intake = await fetchIntake(intakeId)

      if (!mounted) return

      if (!intake) {
        setError('This intake could not be loaded.')
      } else if (intake.status === 'PENDING' || intake.status === 'PROCESSING') {
        subscribeToEvents(intake.id)
      }

      setLoading(false)
    }

    void load()

    return () => {
      mounted = false
    }
  }, [fetchIntake, intakeId, subscribeToEvents])

  const intake = currentIntake?.id === intakeId ? currentIntake : null
  const status = intake ? statusConfig[intake.status] : null
  const StatusIcon = status?.icon
  const publicUrl = useMemo(() => {
    if (!intake?.brief?.share_token) return ''
    return `${window.location.origin}/public/brief/${intake.brief.share_token}`
  }, [intake?.brief?.share_token])

  const copyPublicLink = async () => {
    if (!publicUrl) return
    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm font-semibold text-ink-700 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading intake
        </div>
      </div>
    )
  }

  if (error || !intake) {
    return (
      <div className="mx-auto max-w-xl rounded-lg border border-line bg-surface p-6 text-center shadow-sm">
        <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
        <h1 className="mt-4 text-xl font-semibold text-ink-950">Intake unavailable</h1>
        <p className="mt-2 text-sm text-ink-600">{error || 'The requested intake was not found.'}</p>
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="mx-auto mt-5 flex items-center gap-2 rounded-lg bg-ink-950 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </button>
      </div>
    )
  }

  const brief = intake.brief
  const isWorking = intake.status === 'PENDING' || intake.status === 'PROCESSING'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-600 transition hover:text-ink-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-700">
            Intake workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink-950 sm:text-4xl">
            Review generated brief
          </h1>
          <p className="mt-2 font-mono text-xs text-ink-500">{intake.id}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {status && StatusIcon && (
            <span className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${status.className}`}>
              <StatusIcon className={`h-4 w-4 ${isWorking ? 'animate-spin' : ''}`} />
              {status.label}
            </span>
          )}
          <button
            type="button"
            onClick={() => void fetchIntake(intake.id)}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink-700 transition hover:border-ink-400"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {isWorking && (
        <div className="rounded-lg border border-brand-100 bg-brand-100 p-4 text-sm font-medium text-brand-700">
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{eventMessage || 'Waiting for worker completion.'}</span>
          </div>
          <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-surface progress-stripe" />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          <div className="rounded-lg border border-line bg-surface shadow-sm">
            <div className="flex items-center gap-2 border-b border-line p-4">
              <FileText className="h-4 w-4 text-brand-700" />
              <h2 className="text-sm font-semibold text-ink-950">Original intake</h2>
            </div>
            <div className="p-4">
              <p className="whitespace-pre-wrap text-sm leading-6 text-ink-700">
                {intake.raw_text || 'No text was submitted with this intake.'}
              </p>
            </div>
          </div>

          {brief ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-line bg-surface shadow-sm"
              >
                <div className="border-b border-line p-4">
                  <h2 className="text-sm font-semibold text-ink-950">Summary</h2>
                </div>
                <div className="p-4">
                  <p className="text-base leading-7 text-ink-800">{brief.summary}</p>
                </div>
              </motion.div>

              {brief.goals.length > 0 && (
                <div className="rounded-lg border border-line bg-surface shadow-sm">
                  <div className="flex items-center gap-2 border-b border-line p-4">
                    <Target className="h-4 w-4 text-brand-700" />
                    <h2 className="text-sm font-semibold text-ink-950">Goals</h2>
                  </div>
                  <div className="divide-y divide-line">
                    {brief.goals.map((goal, index) => (
                      <div key={`${goal.title}-${index}`} className="p-4">
                        <h3 className="text-sm font-semibold text-ink-950">{goal.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-ink-600">{goal.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {brief.success_criteria.length > 0 && (
                <div className="rounded-lg border border-line bg-surface shadow-sm">
                  <div className="flex items-center gap-2 border-b border-line p-4">
                    <ShieldCheck className="h-4 w-4 text-teal-600" />
                    <h2 className="text-sm font-semibold text-ink-950">Success criteria</h2>
                  </div>
                  <div className="divide-y divide-line">
                    {brief.success_criteria.map((item, index) => (
                      <div key={`${item}-${index}`} className="flex gap-3 p-4 text-sm leading-6 text-ink-700">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-teal-600" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {brief.ambiguities.length > 0 && (
                <div className="rounded-lg border border-line bg-surface shadow-sm">
                  <div className="flex items-center gap-2 border-b border-line p-4">
                    <HelpCircle className="h-4 w-4 text-amber-600" />
                    <h2 className="text-sm font-semibold text-ink-950">Ambiguities</h2>
                  </div>
                  <div className="divide-y divide-line">
                    {brief.ambiguities.map((item, index) => (
                      <div key={`${item.field_missing}-${index}`} className="p-4">
                        <h3 className="text-sm font-semibold text-ink-950">{item.field_missing}</h3>
                        <p className="mt-1 text-sm leading-6 text-ink-600">{item.reason}</p>
                        <p className="mt-2 text-sm font-medium text-amber-600">{item.suggested_question}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-line bg-surface p-6 text-center shadow-sm">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-700" />
              <h2 className="mt-4 text-lg font-semibold text-ink-950">Brief pending</h2>
              <p className="mt-2 text-sm text-ink-600">
                The generated document will appear here after the worker writes it to the API.
              </p>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-line bg-surface p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-ink-950">Metadata</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-500">Type</dt>
                <dd className="font-semibold text-ink-950">{intake.type}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-500">Created</dt>
                <dd className="text-right font-semibold text-ink-950">{formatDate(intake.created_at)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-500">Updated</dt>
                <dd className="text-right font-semibold text-ink-950">{formatDate(intake.updated_at)}</dd>
              </div>
              {brief && (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-ink-500">Confidence</dt>
                    <dd className="font-semibold text-ink-950">{Math.round(brief.confidence_score * 100)}%</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-ink-500">Tone</dt>
                    <dd className="text-right font-semibold capitalize text-ink-950">
                      {brief.tone_profile.replace(/_/g, ' ')}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </div>

          {brief?.share_token && (
            <div className="rounded-lg border border-line bg-surface p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-ink-950">Public brief</h2>
              <p className="mt-2 break-all font-mono text-xs leading-5 text-ink-500">{publicUrl}</p>
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={copyPublicLink}
                  className="flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:border-ink-400"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied' : 'Copy link'}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate(`/public/brief/${brief.share_token}`)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-ink-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-800"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open public view
                </button>
              </div>
              {brief.is_confirmed && (
                <div className="mt-4 rounded-lg bg-teal-100 px-3 py-2 text-sm font-semibold text-teal-600">
                  Approved{brief.client_name ? ` by ${brief.client_name}` : ''}
                </div>
              )}
            </div>
          )}

          {brief?.followup_questions.length ? (
            <div className="rounded-lg border border-line bg-surface p-4 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-950">
                <Clipboard className="h-4 w-4 text-ink-700" />
                Follow-up questions
              </h2>
              <div className="mt-4 space-y-3">
                {brief.followup_questions.map((question, index) => (
                  <div key={`${question}-${index}`} className="flex gap-3 text-sm leading-6 text-ink-700">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-xs font-semibold text-ink-700">
                      {index + 1}
                    </span>
                    <span>{question}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
