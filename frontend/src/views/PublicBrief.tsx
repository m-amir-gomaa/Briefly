import { useEffect, useState } from 'react'
import { AlertCircle, Copy, Loader2 } from 'lucide-react'
import Button from '../components/ui/Button'
import PublicLayout from '../components/layout/PublicLayout'
import ApprovalCTA from '../features/briefs/ApprovalCTA'
import BriefDocument from '../features/briefs/BriefDocument'
import { getPublicBrief, type BriefRecord } from '../services/api'

interface PublicBriefProps {
  token: string
}

export default function PublicBriefView({ token }: PublicBriefProps) {
  const [brief, setBrief] = useState<BriefRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadBrief() {
      setLoading(true)
      setError(null)

      try {
        const data = await getPublicBrief(token)
        if (mounted) setBrief(data)
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

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[45vh] items-center justify-center">
          <div className="flex items-center gap-3 text-sm font-semibold text-zinc-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading brief
          </div>
        </div>
      </PublicLayout>
    )
  }

  if (error || !brief) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-md py-16 text-center">
          <AlertCircle className="mx-auto h-9 w-9 text-red-600" />
          <h1 className="mt-4 text-xl font-semibold text-zinc-950">Brief unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {error || 'This public link is invalid or no longer available.'}
          </p>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout
      footer={<ApprovalCTA token={token} brief={brief} onConfirmed={setBrief} />}
    >
      <div className="mb-6 flex justify-end">
        <Button
          variant="secondary"
          size="sm"
          onClick={copyLink}
          icon={<Copy className="h-3.5 w-3.5" />}
        >
          {copied ? 'Copied' : 'Copy link'}
        </Button>
      </div>
      <BriefDocument brief={brief} />
    </PublicLayout>
  )
}
