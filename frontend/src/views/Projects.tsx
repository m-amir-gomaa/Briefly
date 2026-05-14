import { useEffect, useState } from 'react'
import { FolderKanban, Plus, Clock, ExternalLink } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { listBriefs, BriefRecord } from '../services/api'

interface ProjectsProps {
  onNavigate: (path: string) => void
}

export default function ProjectsView({ onNavigate }: ProjectsProps) {
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
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Projects</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Organize and track all active and archived agency projects.</p>
        </div>
        <Button onClick={() => onNavigate('/intake/new')} icon={<Plus className="h-4 w-4" />}>New Project</Button>
      </div>

      {loading ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-500 dark:border-zinc-800 dark:border-t-zinc-400" />
        </Card>
      ) : briefs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/20 mb-4 text-indigo-500">
            <FolderKanban className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">No active projects</h3>
          <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            Projects are automatically created when you finalize an intake brief.
          </p>
          <div className="mt-6">
            <Button variant="secondary" onClick={() => onNavigate('/intake/new')}>Start an Intake</Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {briefs.map((brief) => (
            <Card key={brief.id} className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/20">
                  {brief.is_confirmed ? 'Active' : 'Pending Client'}
                </span>
                <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(brief.created_at || '').toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100 line-clamp-1 mb-1">
                {brief.client_name || 'Untitled Project'}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-6 flex-1">
                {brief.summary}
              </p>
              
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {brief.goals?.length || 0} goals
                </div>
                <Button 
                  variant="secondary" 
                  className="py-1.5 px-3 text-xs" 
                  onClick={() => window.open(`/public/brief/${brief.share_token}`, '_blank')}
                  icon={<ExternalLink className="h-3 w-3" />}
                >
                  View Brief
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
