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
import PricingView from './views/Pricing'
import AboutView from './views/About'
import ContactView from './views/Contact'
import PrivacyView from './views/Privacy'
import TermsView from './views/Terms'
import CalendarView from './views/Calendar'
import ProjectsView from './views/Projects'
import BriefsView from './views/Briefs'
import ClientsView from './views/Clients'
import TeamView from './views/Team'
import { useAuthStore } from './store/useAuthStore'

function publicTokenFromPath(path: string) {
  if (path.startsWith('/public/brief/')) return path.replace('/public/brief/', '')
  if (path.startsWith('/public/')) return path.replace('/public/', '')
  return ''
}

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isInitializing = useAuthStore((state) => state.isInitializing)
  const checkAuth = useAuthStore((state) => state.checkAuth)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (to: string) => {
    window.history.pushState({}, '', to)
    setPath(to)
  }

  if (isInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading Briefly...</p>
        </div>
      </div>
    )
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

  if (path === '/pricing') {
    return <PricingView onNavigate={navigate} />
  }

  if (path === '/about') {
    return <AboutView onNavigate={navigate} />
  }

  if (path === '/contact') {
    return <ContactView onNavigate={navigate} />
  }

  if (path === '/privacy') {
    return <PrivacyView onNavigate={navigate} />
  }

  if (path === '/terms') {
    return <TermsView onNavigate={navigate} />
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
      case '/calendar':
        return <CalendarView />
      case '/projects':
        return <ProjectsView onNavigate={navigate} />
      case '/briefs':
        return <BriefsView onNavigate={navigate} />
      case '/clients':
        return <ClientsView />
      case '/team':
        return <TeamView />
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
