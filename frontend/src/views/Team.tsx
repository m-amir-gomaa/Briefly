import { UsersRound, UserPlus } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function TeamView() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Team Directory</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage your agency members and permissions.</p>
        </div>
        <Button icon={<UserPlus className="h-4 w-4" />}>Invite Member</Button>
      </div>
      <Card className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20 mb-4 text-amber-500">
          <UsersRound className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">Only you so far</h3>
        <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          Invite team members to collaborate on briefs and intake requests.
        </p>
      </Card>
    </div>
  )
}
