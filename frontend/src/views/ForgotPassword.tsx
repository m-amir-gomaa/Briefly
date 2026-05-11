import { useState } from 'react'
import { motion } from 'framer-motion'
import AuthLayout from '../components/layout/AuthLayout'

interface ForgotPasswordViewProps {
  onNavigate: (path: string) => void
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}

const inputClass =
  'w-full rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm text-zinc-950 outline-none transition-all duration-200 placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200/60 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-700/40'

const btnPrimary =
  'w-full rounded-full bg-zinc-950 py-3.5 text-center text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200'

const btnSecondary =
  'w-full rounded-full border border-zinc-300 bg-white py-3.5 text-center text-sm font-semibold text-zinc-950 shadow-sm transition-all duration-200 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700'

export default function ForgotPasswordView({ onNavigate }: ForgotPasswordViewProps) {
  const [step, setStep] = useState<'email' | 'code' | 'done'>('email')
  const [email, setEmail] = useState('')

  const subtitle =
    step === 'email'
      ? 'Enter your email'
      : step === 'code'
        ? `Enter the confirmation code that\nhas been sent to ${email || 'your email'}`
        : 'Your password has been reset'

  return (
    <AuthLayout
      title="Forgot password"
      subtitle={step === 'done' ? '' : subtitle}
    >
      {step === 'email' && (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <motion.div variants={fadeUp}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-3 pt-4">
            <button
              type="button"
              onClick={() => setStep('code')}
              className={btnPrimary}
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className={btnSecondary}
            >
              Return
            </button>
          </motion.div>

          <motion.p variants={fadeUp} className="pt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
            First time?{' '}
            <button
              type="button"
              onClick={() => onNavigate('/register')}
              className="font-semibold text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
            >
              Sign Up now
            </button>
          </motion.p>
        </motion.div>
      )}

      {step === 'code' && (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <motion.div variants={fadeUp}>
            <input
              type="text"
              placeholder="Confirmation code"
              className={inputClass}
              autoFocus
            />
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-3 pt-4">
            <button
              type="button"
              onClick={() => setStep('done')}
              className={btnPrimary}
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setStep('email')}
              className={btnSecondary}
            >
              Return
            </button>
          </motion.div>

          <motion.p variants={fadeUp} className="pt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
            First time?{' '}
            <button
              type="button"
              onClick={() => onNavigate('/register')}
              className="font-semibold text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
            >
              Sign Up now
            </button>
          </motion.p>
        </motion.div>
      )}

      {step === 'done' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-4 text-center"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <svg className="h-7 w-7 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            A password reset link has been sent to your email. Check your inbox.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className={btnPrimary}
            >
              Back to Sign in
            </button>
          </div>
        </motion.div>
      )}
    </AuthLayout>
  )
}
