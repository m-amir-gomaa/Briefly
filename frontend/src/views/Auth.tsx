import AuthLayout from '../components/layout/AuthLayout'
import AuthForm from '../features/auth/AuthForm'

interface AuthViewProps {
  mode: 'login' | 'register'
  onNavigate: (path: string) => void
}

export default function AuthView({ mode, onNavigate }: AuthViewProps) {
  const isRegister = mode === 'register'

  return (
    <AuthLayout
      title={isRegister ? 'Sign up' : 'Welcome back'}
      subtitle={
        isRegister
          ? 'Welcome to Briefly'
          : 'Sign in to continue managing your briefs.'
      }
    >
      <AuthForm mode={mode} onNavigate={onNavigate} />
    </AuthLayout>
  )
}
