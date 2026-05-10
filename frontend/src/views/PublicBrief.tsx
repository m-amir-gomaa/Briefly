import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  HelpCircle,
  Loader2,
  PenLine,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react'
import {
  confirmPublicBrief,
  getPublicBrief,
  type BriefRecord,
} from '../lib/api'

interface PublicBriefProps {
  token: string
}

function confidenceLabel(score: number) {
  if (score >= 0.82) return 'High confidence'
  if (score >= 0.62) return 'Medium confidence'
  return 'Needs review'
}

function formatDate(value?: string | null) {
  if (!value) return ''

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function PublicBriefView({ token }: PublicBriefProps) {
  const [brief, setBrief] = useState<BriefRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadBrief() {
      setLoading(true)
      setError(null)

      try {
        const data = await getPublicBrief(token)
        if (mounted) {
          setBrief(data)
          setClientName(data.client_name || '')
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Brief not found')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadBrief()

    return () => {
      mounted = false
    }
  }, [token])

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const handleConfirm = async () => {
    if (!brief || !clientName.trim()) return

    setConfirming(true)

    try {
      const response = await confirmPublicBrief(token, clientName.trim())
      setBrief({
        ...brief,
        is_confirmed: true,
        confirmed_at: response.confirmed_at,
        client_name: response.client_name,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to confirm brief')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4 text-ink-950">
        <div className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm font-semibold shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-brand-700" />
          Loading brief
        </div>
      </div>
    )
  }

  if (error || !brief) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4 text-ink-950">
        <div className="w-full max-w-md rounded-lg border border-line bg-surface p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto h-9 w-9 text-red-600" />
          <h1 className="mt-4 text-xl font-semibold">Brief unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            {error || 'This public link is invalid or no longer available.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas px-4 py-6 text-ink-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="rounded-lg border border-line bg-surface p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-950 text-white">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-semibold tracking-normal">Briefly</p>
                <p className="text-sm text-ink-500">Project brief</p>
              </div>
            </div>

            <button
              type="button"
              onClick={copyLink}
              className="flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink-700 transition hover:border-ink-400"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <p className="text-xl leading-8 text-ink-950">{brief.summary}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-brand-100 px-3 py-1.5 text-xs font-semibold text-brand-700">
                {confidenceLabel(brief.confidence_score)} - {Math.round(brief.confidence_score * 100)}%
              </span>
              {brief.tone_profile && (
                <span className="rounded-lg bg-surface-muted px-3 py-1.5 text-xs font-semibold capitalize text-ink-700">
                  {brief.tone_profile.replace(/_/g, ' ')}
                </span>
              )}
              {brief.is_confirmed && (
                <span className="rounded-lg bg-teal-100 px-3 py-1.5 text-xs font-semibold text-teal-600">
                  Approved
                </span>
              )}
            </div>
          </div>
        </header>

        {brief.goals.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-line bg-surface shadow-sm"
          >
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
          </motion.section>
        )}

        {brief.success_criteria.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="rounded-lg border border-line bg-surface shadow-sm"
          >
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
          </motion.section>
        )}

        {brief.ambiguities.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-lg border border-line bg-surface shadow-sm"
          >
            <div className="flex items-center gap-2 border-b border-line p-4">
              <HelpCircle className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-semibold text-ink-950">Open questions</h2>
            </div>
            <div className="divide-y divide-line">
              {brief.ambiguities.map((item, index) => (
                <div key={`${item.field_missing}-${index}`} className="p-4">
                  <h3 className="text-sm font-semibold text-ink-950">{item.field_missing}</h3>
                  <p className="mt-1 text-sm leading-6 text-ink-600">{item.reason}</p>
                  <p className="mt-2 text-sm font-semibold text-amber-600">{item.suggested_question}</p>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        <section className="rounded-lg border border-line bg-surface p-5 shadow-sm">
          {brief.is_confirmed ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-teal-600" />
                <div>
                  <h2 className="text-base font-semibold text-ink-950">Approved</h2>
                  <p className="mt-1 text-sm text-ink-600">
                    {brief.client_name || 'Client'} signed off
                    {brief.confirmed_at ? ` on ${formatDate(brief.confirmed_at)}` : ''}.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <label htmlFor="client-name-input" className="flex items-center gap-2 text-sm font-semibold text-ink-950">
                  <PenLine className="h-4 w-4 text-brand-700" />
                  Client sign-off
                </label>
                <input
                  id="client-name-input"
                  type="text"
                  value={clientName}
                  onChange={(event) => setClientName(event.target.value)}
                  placeholder="Client name"
                  className="mt-3 w-full rounded-lg border border-line bg-canvas px-4 py-3 text-sm text-ink-950 outline-none transition placeholder:text-ink-400 focus:border-brand-600 focus:bg-surface focus:ring-4 focus:ring-brand-100"
                />
              </div>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={!clientName.trim() || confirming}
                className={`flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition ${
                  clientName.trim() && !confirming
                    ? 'bg-ink-950 text-white hover:bg-ink-800'
                    : 'bg-surface-muted text-ink-400'
                }`}
              >
                {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Approve
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
