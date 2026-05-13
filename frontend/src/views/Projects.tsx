import { FolderKanban, Plus } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

interface ProjectsProps {
  onNavigate: (path: string) => void
}

export default function ProjectsView({ onNavigate }: ProjectsProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Projects</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Organize and track all active and archived agency projects.</p>
        </div>
        <Button onClick={() => onNavigate('/intake/new')} icon={<Plus className="h-4 w-4" />}>New Project</Button>
      </div>
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
    </div>
  )
}
