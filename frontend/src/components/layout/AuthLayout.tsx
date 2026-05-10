import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import type { ReactNode } from 'react'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
}

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(99,102,241,0.32),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(20,184,166,0.24),transparent_30%)]" />
      <div className="absolute inset-0 bg-zinc-950/35 backdrop-blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md rounded-xl border border-white/20 bg-white/70 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
      >
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-950 text-white">
            <Zap className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-semibold tracking-normal text-zinc-950">Briefly</p>
            <p className="text-xs font-medium text-zinc-500">AI project briefs</p>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-normal text-zinc-950">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{subtitle}</p>
        </div>

        {children}
      </motion.div>
    </div>
  )
}
