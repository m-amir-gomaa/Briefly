import { useEffect, useState } from 'react'
import { Files, Plus, ExternalLink, Clock } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { listBriefs, BriefRecord } from '../services/api'

interface BriefsProps {
  onNavigate: (path: string) => void
}

export default function BriefsView({ onNavigate }: BriefsProps) {
  const [briefs, setBriefs] = useState<BriefRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listBriefs()
      .then(setBriefs)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Briefs Directory</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Browse all generated project scopes and briefs.</p>
        </div>
        <Button onClick={() => onNavigate('/intake/new')} icon={<Plus className="h-4 w-4" />}>Create Brief</Button>
      </div>

      {loading ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-500 dark:border-zinc-800 dark:border-t-zinc-400" />
        </Card>
      ) : briefs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 mb-4 text-emerald-500">
            <Files className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">No briefs found</h3>
          <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            You haven't generated any briefs yet. Check your dashboard for pending intakes.
          </p>
          <div className="mt-6">
            <Button variant="secondary" onClick={() => onNavigate('/dashboard')}>Go to Dashboard</Button>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {briefs.map((brief) => (
            <Card key={brief.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 hover:border-zinc-300 transition-colors dark:hover:border-zinc-700">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 shrink-0">
                  <Files className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-100">
                    {brief.client_name || 'Untitled Brief'}
                  </h3>
                  <div className="mt-1 flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1 text-xs">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(brief.created_at || '').toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {brief.is_confirmed ? 'Confirmed' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:ml-auto">
                <Button 
                  variant="secondary" 
                  className="w-full sm:w-auto"
                  onClick={() => window.open(`/public/brief/${brief.share_token}`, '_blank')}
                  icon={<ExternalLink className="h-4 w-4" />}
                >
                  View
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
