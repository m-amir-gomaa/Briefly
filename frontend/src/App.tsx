import React from 'react';
import { DashboardView } from './views/Dashboard';
import { IntakeView } from './views/Intake';
import { PublicBriefView } from './views/PublicBrief';

// Extremely simple router for hackathon scaffolding
function App() {
  const path = window.location.pathname;

  if (path === '/intake/new') {
    return <IntakeView />;
  }
  
  if (path.startsWith('/public/')) {
    return <PublicBriefView />;
  }

  // Default to Dashboard
  return <DashboardView />;
}

export default App;
