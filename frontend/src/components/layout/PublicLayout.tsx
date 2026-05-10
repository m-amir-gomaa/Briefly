import { Zap } from 'lucide-react'
import type { ReactNode } from 'react'

interface PublicLayoutProps {
  children: ReactNode
  footer?: ReactNode
}

export default function PublicLayout({ children, footer }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-4 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-white">
              <Zap className="h-4 w-4" />
            </span>
            <span className="font-semibold text-zinc-950">Demo Agency</span>
          </div>
          <span className="text-xs font-medium text-zinc-500">Powered by Briefly</span>
        </header>

        <main className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
          {children}
        </main>
      </div>

      {footer && (
        <div className="sticky bottom-0 mt-6 border-t border-white/20 bg-white/80 px-4 py-3 shadow-[0_-12px_30px_rgba(24,24,27,0.08)] backdrop-blur-xl sm:px-6">
          <div className="mx-auto max-w-4xl">{footer}</div>
        </div>
      )}
    </div>
  )
}
