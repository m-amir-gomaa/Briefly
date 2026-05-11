import { useEffect, useState } from 'react'
import AppLayout from './components/layout/AppLayout'
import AccountView from './views/Account'
import AuthView from './views/Auth'
import DashboardView from './views/Dashboard'
import HomeView from './views/Home'
import ForgotPasswordView from './views/ForgotPassword'
import IntakeView from './views/Intake'
import IntakeDetailView from './views/IntakeDetail'
import PublicBriefView from './views/PublicBrief'
import { useAuthStore } from './store/useAuthStore'

function publicTokenFromPath(path: string) {
  if (path.startsWith('/public/brief/')) return path.replace('/public/brief/', '')
  if (path.startsWith('/public/')) return path.replace('/public/', '')
  return ''
}

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (to: string) => {
    window.history.pushState({}, '', to)
    setPath(to)
  }

  if (path.startsWith('/public/')) {
    return <PublicBriefView token={publicTokenFromPath(path)} />
  }

  if (path === '/') {
    return <HomeView onNavigate={navigate} />
  }

  if (path === '/forgot-password') {
    return <ForgotPasswordView onNavigate={navigate} />
  }

  if (path === '/login' || (!isAuthenticated && path !== '/register')) {
    return <AuthView mode="login" onNavigate={navigate} />
  }

  if (path === '/register') {
    return <AuthView mode="register" onNavigate={navigate} />
  }

  const renderView = () => {
    if (path.startsWith('/intake/') && path !== '/intake/new') {
      return <IntakeDetailView intakeId={path.replace('/intake/', '')} onNavigate={navigate} />
    }

    switch (path) {
      case '/dashboard':
        return <DashboardView onNavigate={navigate} />
      case '/intake/new':
        return <IntakeView onNavigate={navigate} />
      case '/account':
        return <AccountView />
      default:
        return <DashboardView onNavigate={navigate} />
    }
  }

  return (
    <AppLayout currentPath={path} onNavigate={navigate}>
      {renderView()}
    </AppLayout>
  )
}

export default App
