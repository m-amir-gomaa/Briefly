import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import DashboardView from './views/Dashboard'
import IntakeView from './views/Intake'
import PublicBriefView from './views/PublicBrief'

function App() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (to: string) => {
    window.history.pushState({}, '', to)
    setPath(to)
  }

  // Public brief pages have no layout shell
  if (path.startsWith('/public/')) {
    const token = path.replace('/public/brief/', '')
    return <PublicBriefView token={token} />
  }

  const renderView = () => {
    switch (path) {
      case '/intake/new':
        return <IntakeView onNavigate={navigate} />
      default:
        return <DashboardView onNavigate={navigate} />
    }
  }

  return (
    <Layout currentPath={path} onNavigate={navigate}>
      {renderView()}
    </Layout>
  )
}

export default App
