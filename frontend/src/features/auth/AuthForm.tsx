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
  const register = useAuthStore((state) => state.register)
  const isRegister = mode === 'register'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '')
    const password = String(formData.get('password') || '')
    
    try {
      if (isRegister) {
        const agencyName = String(formData.get('agencyName') || '')
        await register(email, password, agencyName)
      } else {
        await login(email, password)
      }
      onNavigate('/dashboard')
    } catch (error: any) {
      alert(error.message || 'Authentication failed')
    }
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
        <motion.div variants={fadeUp}>
          <input
            name="agencyName"
            placeholder="Agency or Company Name"
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
            required
          />
        </motion.div>
      )}

      {isRegister && (
        <motion.div variants={fadeUp} className="flex items-center gap-2 px-2 py-1">
          <input
            type="checkbox"
            id="terms"
            name="terms"
            className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-800 dark:checked:bg-zinc-100"
            required
          />
          <label htmlFor="terms" className="text-xs text-zinc-500 dark:text-zinc-400">
            I agree to the <button type="button" onClick={() => onNavigate('/terms')} className="text-blue-600 hover:underline dark:text-blue-400">Terms & Conditions</button>
          </label>
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
          className="w-full rounded-full bg-zinc-950 py-3.5 text-center text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-zinc-800 active:scale-95 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {isRegister ? 'Sign up' : 'Sign in'}
        </button>
      </motion.div>

      <motion.div variants={fadeUp} className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#f8f4f0] px-2 text-zinc-500 dark:bg-[#0a080e] dark:text-zinc-400">
            Or continue with
          </span>
        </div>
      </motion.div>
      
      <motion.div variants={fadeUp}>
        <button
          type="button"
          onClick={() => {
            window.location.href = '/api/v1/auth/google'
          }}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-zinc-300 bg-white py-3.5 text-sm font-semibold text-zinc-700 shadow-sm transition-all duration-200 hover:bg-zinc-50 hover:text-zinc-950 active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
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
