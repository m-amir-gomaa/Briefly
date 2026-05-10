import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { BackendIntakeStatus } from '../../services/api'

interface StatusBadgeProps {
  status: BackendIntakeStatus
}

const config: Record<
  BackendIntakeStatus,
  { label: string; icon: LucideIcon; className: string; spin?: boolean }
> = {
  PENDING: {
    label: 'Processing',
    icon: Clock3,
    className: 'bg-amber-50 text-amber-800 ring-amber-200',
  },
  PROCESSING: {
    label: 'Processing',
    icon: Loader2,
    className: 'bg-amber-50 text-amber-800 ring-amber-200',
    spin: true,
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  },
  FAILED: {
    label: 'Failed',
    icon: AlertCircle,
    className: 'bg-red-50 text-red-700 ring-red-200',
  },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const item = config[status]
  const Icon = item.icon

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ring-1',
        item.className,
      ].join(' ')}
    >
      <Icon className={`h-3.5 w-3.5 ${item.spin ? 'animate-spin' : ''}`} />
      {item.label}
    </span>
  )
}
