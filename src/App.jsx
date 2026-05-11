import { useEffect, useState } from 'react'
import useStore from './store'
import useIsMobile from './hooks/useIsMobile'

// Layouts
import CoachLayout from './layouts/CoachLayout'
import ClientLayout from './layouts/ClientLayout'

// Auth
import Landing from './pages/Landing'
import LoginScreen from './pages/LoginScreen'
import SetPasswordScreen from './pages/SetPasswordScreen'

// Role entry points
import RoleSelector from './pages/RoleSelector'
import ClientSelector from './pages/client/ClientSelector'

// Coach pages — desktop
import CoachDashboard from './pages/coach/CoachDashboard'
import CoachChat      from './pages/coach/CoachChat'
import CoachProfile   from './pages/coach/CoachProfile'
import MyFoods        from './pages/MyFoods'
import Clients        from './pages/coach/Clients'

// Coach pages — mobile (auto-selected when viewport < 768 px)
import MobileCoachDashboard from './pages/coach/mobile/MobileCoachDashboard'
import MobileClients        from './pages/coach/mobile/MobileClients'
import MobileChat           from './pages/coach/mobile/MobileChat'
import MobileMyFoods        from './pages/coach/mobile/MobileMyFoods'

// Client pages (always mobile)
import ClientDashboard    from './pages/client/ClientDashboard'
import ClientLog          from './pages/client/ClientLog'
import ClientWeight       from './pages/client/ClientWeight'
import ClientMessages     from './pages/client/ClientMessages'
import ClientProfile      from './pages/client/ClientProfile'
import ClientCoachProfile from './pages/client/ClientCoachProfile'

const COACH_PAGES_DESKTOP = {
  dashboard: CoachDashboard,
  clients:   Clients,
  chat:      CoachChat,
  foods:     MyFoods,
  profile:   CoachProfile,
}

const COACH_PAGES_MOBILE = {
  dashboard: MobileCoachDashboard,
  clients:   MobileClients,
  chat:      MobileChat,
  foods:     MobileMyFoods,
  profile:   CoachProfile,
}

const CLIENT_PAGES = {
  dashboard: ClientDashboard,
  log:       ClientLog,
  weight:    ClientWeight,
  messages:  ClientMessages,
  profile:   ClientProfile,
  coach:     ClientCoachProfile,
}

// True when running as an installed PWA (homescreen shortcut).
// Checked once at module load — doesn't change during a session.
const IS_PWA =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true

export default function App() {
  const {
    isAuthenticated, authLoading, currentUser,
    activeRole, activePage, activeClientId,
    theme, initAuth,
  } = useStore()
  const isMobile = useIsMobile()

  // Controls whether the login screen is shown over the landing page.
  // Start on login immediately when launched from the homescreen.
  const [showLogin, setShowLogin] = useState(IS_PWA)

  // True when the user landed via an email invite link and still needs to set a password
  const [postInvite, setPostInvite] = useState(
    () => sessionStorage.getItem('macrostack-post-invite') === '1'
  )

  // Apply theme class (ocean-dark / ocean-light)
  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('ocean-dark', 'ocean-light')
    html.classList.add(theme)
  }, [theme])

  // Check Supabase session on mount
  useEffect(() => {
    initAuth()
  }, [])

  // Show nothing while the session check is in flight (avoids login-screen flash)
  if (authLoading) {
    return (
      <div className="flex h-full w-full bg-bg items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brown border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs text-muted tracking-widest">LOADING…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    if (showLogin) return <LoginScreen onBack={IS_PWA ? null : () => setShowLogin(false)} />
    return <Landing onGetStarted={() => setShowLogin(true)} />
  }

  // Invited client just confirmed their email — make them set a password first
  if (postInvite) {
    return <SetPasswordScreen onDone={() => setPostInvite(false)} />
  }

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
