import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ProcessingChecklist from '../components/shared/ProcessingChecklist'
import StatusBadge from '../components/shared/StatusBadge'
import BriefDocument from '../features/briefs/BriefDocument'
import { useIntakeStore } from '../store/useIntakeStore'

interface IntakeDetailProps {
  intakeId: string
  onNavigate: (path: string) => void
}

function formatDate(value?: string) {
  if (!value) return 'Not available'

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function IntakeDetailView({ intakeId, onNavigate }: IntakeDetailProps) {
  const { currentIntake, fetchIntake, subscribeToEvents, status } = useIntakeStore()
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
  const brief = intake?.brief
  const publicUrl = useMemo(() => {
    if (!brief?.share_token) return ''
    return `${window.location.origin}/public/${brief.share_token}`
  }, [brief?.share_token])

  const copyPublicLink = async () => {
    if (!publicUrl) return
    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Loading intake</span>
        </Card>
      </div>
    )
  }

  if (error || !intake) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <AlertCircle className="mx-auto h-9 w-9 text-red-600" />
        <h1 className="mt-4 text-xl font-semibold text-zinc-950 dark:text-zinc-100">Intake unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{error || 'The requested intake was not found.'}</p>
        <Button
          className="mx-auto mt-5"
          onClick={() => onNavigate('/dashboard')}
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          Dashboard
        </Button>
      </Card>
    )
  }

  const isWorking = intake.status === 'PENDING' || intake.status === 'PROCESSING'

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => onNavigate('/dashboard')}
            icon={<ArrowLeft className="h-4 w-4" />}
            className="mb-3 px-0 hover:bg-transparent"
          >
            Dashboard
          </Button>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Brief review</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl dark:text-zinc-50">
            Review generated brief
          </h1>
          <p className="mt-2 break-all font-mono text-xs text-zinc-500">{intake.id}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={intake.status} />
          <Button
            variant="secondary"
            onClick={() => void fetchIntake(intake.id)}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          {isWorking && (
            <ProcessingChecklist
              status={status === 'IDLE' ? 'PROCESSING' : status}
              hasAudio={intake.type === 'VOICE' || intake.type === 'MULTI'}
              hasImage={intake.type === 'IMAGE' || intake.type === 'MULTI'}
            />
          )}

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                Original intake
              </h2>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-700 dark:text-zinc-300">
              {intake.raw_text || 'No text was submitted with this intake.'}
            </p>
          </Card>

          {brief ? (
            <Card className="p-6 sm:p-8">
              <BriefDocument brief={brief} />
            </Card>
          ) : (
            <Card className="text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-zinc-500" />
              <h2 className="mt-4 text-lg font-semibold text-zinc-950 dark:text-zinc-100">Brief pending</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                The generated document will appear here after the worker writes it to the API.
              </p>
            </Card>
          )}
        </section>

        <aside className="space-y-4">
          <Card>
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">Metadata</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500 dark:text-zinc-400">Type</dt>
                <dd className="font-semibold text-zinc-950 dark:text-zinc-100">{intake.type}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500 dark:text-zinc-400">Created</dt>
                <dd className="text-right font-semibold text-zinc-950 dark:text-zinc-100">{formatDate(intake.created_at)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500 dark:text-zinc-400">Updated</dt>
                <dd className="text-right font-semibold text-zinc-950 dark:text-zinc-100">{formatDate(intake.updated_at)}</dd>
              </div>
              {brief && (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-zinc-500 dark:text-zinc-400">Confidence</dt>
                    <dd className="font-semibold text-zinc-950 dark:text-zinc-100">{Math.round(brief.confidence_score * 100)}%</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-zinc-500 dark:text-zinc-400">Confirmed</dt>
                    <dd className="font-semibold text-zinc-950 dark:text-zinc-100">{brief.is_confirmed ? 'Yes' : 'No'}</dd>
                  </div>
                </>
              )}
            </dl>
          </Card>

          {brief?.share_token && (
            <Card>
              <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">Public document</h2>
              <p className="mt-2 break-all font-mono text-xs leading-5 text-zinc-500">{publicUrl}</p>
              <div className="mt-4 grid gap-2">
                <Button
                  variant="secondary"
                  onClick={copyPublicLink}
                  icon={<Copy className="h-4 w-4" />}
                >
                  {copied ? 'Copied' : 'Copy link'}
                </Button>
                <Button
                  onClick={() => onNavigate(`/public/${brief.share_token}`)}
                  icon={<ExternalLink className="h-4 w-4" />}
                >
                  Open public view
                </Button>
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}
