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
      title={isRegister ? 'Create your Briefly workspace' : 'Welcome back'}
      subtitle={
        isRegister
          ? 'Set up the workspace where raw client inputs become structured briefs.'
          : 'Sign in to continue managing client intakes and approvals.'
      }
    >
      <AuthForm mode={mode} onNavigate={onNavigate} />
    </AuthLayout>
  )
}
