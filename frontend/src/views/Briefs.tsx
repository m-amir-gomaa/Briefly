import { Files, Plus } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

interface BriefsProps {
  onNavigate: (path: string) => void
}

export default function BriefsView({ onNavigate }: BriefsProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Briefs Directory</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Browse all generated project scopes and briefs.</p>
        </div>
        <Button onClick={() => onNavigate('/intake/new')} icon={<Plus className="h-4 w-4" />}>Create Brief</Button>
      </div>
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
    </div>
  )
}
