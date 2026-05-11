import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
}

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="auth-gradient-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      {/* Logo — centered above card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative z-10 mb-8"
      >
        <img
          src="/logo-title-black.png"
          alt="Briefly"
          className="h-7 dark:invert"
          draggable={false}
        />
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200/60 bg-white/80 px-8 py-10 shadow-xl shadow-zinc-300/20 backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-900/80 dark:shadow-black/30"
      >
        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold italic tracking-normal text-zinc-950 dark:text-zinc-50">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>
        </div>

        {children}
      </motion.div>
    </div>
  )
}
