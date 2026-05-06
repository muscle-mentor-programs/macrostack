import { useEffect } from 'react'
import useStore from './store'
import useIsMobile from './hooks/useIsMobile'

// Layouts
import CoachLayout from './layouts/CoachLayout'
import ClientLayout from './layouts/ClientLayout'

// Auth
import LoginScreen from './pages/LoginScreen'

// Role entry points
import RoleSelector from './pages/RoleSelector'
import ClientSelector from './pages/client/ClientSelector'

// Coach pages — desktop
import CoachDashboard from './pages/coach/CoachDashboard'
import CoachChat      from './pages/coach/CoachChat'
import MyFoods        from './pages/MyFoods'
import Clients        from './pages/coach/Clients'

// Coach pages — mobile (auto-selected when viewport < 768 px)
import MobileCoachDashboard from './pages/coach/mobile/MobileCoachDashboard'
import MobileClients        from './pages/coach/mobile/MobileClients'
import MobileChat           from './pages/coach/mobile/MobileChat'
import MobileMyFoods        from './pages/coach/mobile/MobileMyFoods'

// Client pages (always mobile)
import ClientDashboard from './pages/client/ClientDashboard'
import ClientLog       from './pages/client/ClientLog'
import ClientWeight    from './pages/client/ClientWeight'
import ClientMessages  from './pages/client/ClientMessages'
import ClientProfile   from './pages/client/ClientProfile'

const COACH_PAGES_DESKTOP = {
  dashboard: CoachDashboard,
  clients:   Clients,
  chat:      CoachChat,
  foods:     MyFoods,
}

const COACH_PAGES_MOBILE = {
  dashboard: MobileCoachDashboard,
  clients:   MobileClients,
  chat:      MobileChat,
  foods:     MobileMyFoods,
}

const CLIENT_PAGES = {
  dashboard: ClientDashboard,
  log:       ClientLog,
  weight:    ClientWeight,
  messages:  ClientMessages,
  profile:   ClientProfile,
}

export default function App() {
  const { isAuthenticated, currentUser, activeRole, activePage, activeClientId, theme } = useStore()
  const isMobile = useIsMobile()   // auto-detects viewport width

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  if (!isAuthenticated) return <LoginScreen />

  if (!activeRole) {
    if (currentUser?.role === 'client') return <ClientSelector />
    return <RoleSelector />
  }

  if (activeRole === 'client') {
    if (!activeClientId) return <ClientSelector />
    const ClientPage = CLIENT_PAGES[activePage] || ClientDashboard
    return (
      <ClientLayout>
        <ClientPage />
      </ClientLayout>
    )
  }

  // Coach mode — serve mobile or desktop pages based on real-time viewport width
  const coachPages = isMobile ? COACH_PAGES_MOBILE : COACH_PAGES_DESKTOP
  const fallback   = isMobile ? MobileCoachDashboard : CoachDashboard
  const CoachPage  = coachPages[activePage] || fallback

  return (
    <CoachLayout>
      <CoachPage />
    </CoachLayout>
  )
}
