import { useEffect, useState, useMemo } from 'react'
import { Users, Building2, Briefcase } from 'lucide-react'
import Card from '../components/ui/Card'
import { listBriefs, BriefRecord } from '../services/api'

export default function ClientsView() {
  const [briefs, setBriefs] = useState<BriefRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listBriefs()
      .then(setBriefs)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const clients = useMemo(() => {
    const map = new Map<string, { name: string; count: number; lastBrief: Date }>()
    briefs.forEach((b) => {
      const name = b.client_name || 'Unknown Client'
      const existing = map.get(name)
      const d = b.created_at ? new Date(b.created_at) : new Date(0)
      if (existing) {
        existing.count++
        if (d > existing.lastBrief) existing.lastBrief = d
      } else {
        map.set(name, { name, count: 1, lastBrief: d })
      }
    })
    return Array.from(map.values()).sort((a, b) => b.lastBrief.getTime() - a.lastBrief.getTime())
  }, [briefs])
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Clients</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">View all clients extracted from your briefs.</p>
        </div>
      </div>
      
      {loading ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-500 dark:border-zinc-800 dark:border-t-zinc-400" />
        </Card>
      ) : clients.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-900/20 mb-4 text-purple-500">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">No clients found</h3>
          <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            Generate your first brief to automatically capture client information.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.name} className="flex flex-col gap-4 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                  <Building2 className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">{client.name}</h3>
                <div className="mt-2 flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" />
                    {client.count} {client.count === 1 ? 'brief' : 'briefs'}
                  </span>
                  <span>Last active: {client.lastBrief.toLocaleDateString()}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
