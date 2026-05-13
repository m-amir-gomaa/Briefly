import { Users, Plus } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function ClientsView() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Clients</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage client contacts and agency partnerships.</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />}>Add Client</Button>
      </div>
      <Card className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-900/20 mb-4 text-purple-500">
          <Users className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">No clients listed</h3>
        <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          Add your first client to start organizing briefs and projects by company.
        </p>
      </Card>
    </div>
  )
}
