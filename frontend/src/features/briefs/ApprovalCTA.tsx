import { useState } from 'react'
import { CheckCircle2, Loader2, PenLine } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { confirmPublicBrief, type BriefRecord } from '../../services/api'

interface ApprovalCTAProps {
  token: string
  brief: BriefRecord
  onConfirmed: (brief: BriefRecord) => void
}

function formatDate(value?: string | null) {
  if (!value) return ''

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function ApprovalCTA({ token, brief, onConfirmed }: ApprovalCTAProps) {
  const [clientName, setClientName] = useState(brief.client_name || '')
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!clientName.trim()) return

    setConfirming(true)
    setError(null)

    try {
      const response = await confirmPublicBrief(token, clientName.trim())
      onConfirmed({
        ...brief,
        is_confirmed: true,
        confirmed_at: response.confirmed_at,
        client_name: response.client_name,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to approve this brief.')
    } finally {
      setConfirming(false)
    }
  }

  if (brief.is_confirmed) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
          <div>
            <p className="text-sm font-semibold text-zinc-950">Brief approved</p>
            <p className="text-sm text-zinc-600">
              {brief.client_name || 'Client'} signed off
              {brief.confirmed_at ? ` on ${formatDate(brief.confirmed_at)}` : ''}.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div>
        <label htmlFor="client-name-input" className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-zinc-600">
          <PenLine className="h-3.5 w-3.5" />
          Client sign-off
        </label>
        <Input
          id="client-name-input"
          value={clientName}
          onChange={(event) => setClientName(event.target.value)}
          placeholder="Client name"
        />
        {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
      </div>

      <Button
        size="lg"
        onClick={handleConfirm}
        disabled={!clientName.trim() || confirming}
        icon={confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
      >
        Approve & Sign Off
      </Button>
    </div>
  )
}
