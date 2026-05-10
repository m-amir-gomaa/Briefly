import { Mail, LockKeyhole, UserPlus } from 'lucide-react'
import type { FormEvent } from 'react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useAuthStore } from '../../store/useAuthStore'

interface AuthFormProps {
  mode: 'login' | 'register'
  onNavigate: (path: string) => void
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isRegister && (
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-zinc-600">Agency name</span>
          <Input name="agency" placeholder="Northstar Studio" />
        </label>
      )}

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-zinc-600">Email</span>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            name="email"
            type="email"
            defaultValue="demo@briefly.ai"
            className="pl-9"
            required
          />
        </div>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-zinc-600">Password</span>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            name="password"
            type="password"
            defaultValue="briefly-demo"
            className="pl-9"
            required
          />
        </div>
      </label>

      <Button type="submit" size="lg" className="w-full" icon={isRegister ? <UserPlus className="h-4 w-4" /> : undefined}>
        {isRegister ? 'Create workspace' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-zinc-600">
        {isRegister ? 'Already have a workspace?' : 'Need a workspace?'}{' '}
        <button
          type="button"
          onClick={() => onNavigate(isRegister ? '/login' : '/register')}
          className="font-semibold text-zinc-950 underline-offset-4 hover:underline"
        >
          {isRegister ? 'Sign in' : 'Create one'}
        </button>
      </p>
    </form>
  )
}
