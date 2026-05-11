import { motion } from 'framer-motion'
import type { FormEvent } from 'react'
import { useAuthStore } from '../../store/useAuthStore'

interface AuthFormProps {
  mode: 'login' | 'register'
  onNavigate: (path: string) => void
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const } },
}

export default function AuthForm({ mode, onNavigate }: AuthFormProps) {
  const login = useAuthStore((state) => state.login)
  const isRegister = mode === 'register'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    await login(String(formData.get('email') || ''), String(formData.get('password') || ''))
    onNavigate('/dashboard')
  }

  const inputClass =
    'w-full rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm text-zinc-950 outline-none transition-all duration-200 placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200/60 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-700/40'

  return (
    <motion.form
      onSubmit={handleSubmit}
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {isRegister && (
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
          <input
            name="firstName"
            placeholder="First Name"
            className={inputClass}
            required
          />
          <input
            name="lastName"
            placeholder="Last Name"
            className={inputClass}
            required
          />
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <input
          name="email"
          type="email"
          placeholder="Email"
          defaultValue={isRegister ? '' : 'demo@briefly.ai'}
          className={inputClass}
          required
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <input
          name="password"
          type="password"
          placeholder="Password"
          defaultValue={isRegister ? '' : 'briefly-demo'}
          className={inputClass}
          required
        />
      </motion.div>

      {isRegister && (
        <motion.div variants={fadeUp}>
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            className={inputClass}
          />
        </motion.div>
      )}

      {/* Forgot password — login only */}
      {!isRegister && (
        <motion.div variants={fadeUp} className="text-right">
          <button
            type="button"
            onClick={() => onNavigate('/forgot-password')}
            className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Forgot password?
          </button>
        </motion.div>
      )}

      <motion.div variants={fadeUp} className="pt-2">
        <button
          type="submit"
          className="w-full rounded-full bg-zinc-950 py-3.5 text-center text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {isRegister ? 'Sign up' : 'Sign in'}
        </button>
      </motion.div>

      <motion.p variants={fadeUp} className="pt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
        {isRegister ? 'Already have an account?' : 'First time?'}{' '}
        <button
          type="button"
          onClick={() => onNavigate(isRegister ? '/login' : '/register')}
          className="font-semibold text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
        >
          {isRegister ? 'Sign in' : 'Sign Up now'}
        </button>
      </motion.p>
    </motion.form>
  )
}
