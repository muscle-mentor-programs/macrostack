import { useEffect, useState, lazy, Suspense } from 'react'
import useStore from './store'
import useIsMobile from './hooks/useIsMobile'

// Layouts (small — keep eager so the shell paints instantly)
import CoachLayout from './layouts/CoachLayout'
import ClientLayout from './layouts/ClientLayout'

// ── Code-split pages — each loads on demand, keeping the initial bundle
//    small (Landing, the 1900-item food DB, and recharts are the heavy ones)
const Landing           = lazy(() => import('./pages/Landing'))
const LoginScreen       = lazy(() => import('./pages/LoginScreen'))
const SetPasswordScreen = lazy(() => import('./pages/SetPasswordScreen'))

// Role entry points
const RoleSelector   = lazy(() => import('./pages/RoleSelector'))
const ClientSelector = lazy(() => import('./pages/client/ClientSelector'))

// Coach pages — desktop
const CoachDashboard = lazy(() => import('./pages/coach/CoachDashboard'))
const CoachChat      = lazy(() => import('./pages/coach/CoachChat'))
const CoachProfile   = lazy(() => import('./pages/coach/CoachProfile'))
const MyFoods        = lazy(() => import('./pages/MyFoods'))
const Clients        = lazy(() => import('./pages/coach/Clients'))

// Coach pages — mobile (auto-selected when viewport < 768 px)
const MobileCoachDashboard = lazy(() => import('./pages/coach/mobile/MobileCoachDashboard'))
const MobileClients        = lazy(() => import('./pages/coach/mobile/MobileClients'))
const MobileChat           = lazy(() => import('./pages/coach/mobile/MobileChat'))
const MobileMyFoods        = lazy(() => import('./pages/coach/mobile/MobileMyFoods'))

// Client pages (always mobile)
const ClientDashboard    = lazy(() => import('./pages/client/ClientDashboard'))
const ClientLog          = lazy(() => import('./pages/client/ClientLog'))
const ClientWeight       = lazy(() => import('./pages/client/ClientWeight'))
const ClientMessages     = lazy(() => import('./pages/client/ClientMessages'))
const ClientProfile      = lazy(() => import('./pages/client/ClientProfile'))
const ClientCoachProfile = lazy(() => import('./pages/client/ClientCoachProfile'))

// Shared suspense fallback — matches the auth spinner so transitions feel seamless
function PageLoader() {
  return (
    <div className="flex h-full w-full bg-bg items-center justify-center">
      <div className="w-8 h-8 border-2 border-brown border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

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
    return (
      <Suspense fallback={<PageLoader />}>
        {showLogin
          ? <LoginScreen onBack={IS_PWA ? null : () => setShowLogin(false)} />
          : <Landing onGetStarted={() => setShowLogin(true)} />}
      </Suspense>
    )
  }

  // Invited client just confirmed their email — make them set a password first
  if (postInvite) {
    return (
      <Suspense fallback={<PageLoader />}>
        <SetPasswordScreen onDone={() => setPostInvite(false)} />
      </Suspense>
    )
  }

  if (!activeRole) {
    return (
      <Suspense fallback={<PageLoader />}>
        {currentUser?.role === 'client' ? <ClientSelector /> : <RoleSelector />}
      </Suspense>
    )
  }

  if (activeRole === 'client') {
    if (!activeClientId) {
      return (
        <Suspense fallback={<PageLoader />}>
          <ClientSelector />
        </Suspense>
      )
    }
    const ClientPage = CLIENT_PAGES[activePage] || ClientDashboard
    return (
      <ClientLayout>
        <Suspense fallback={<PageLoader />}>
          <ClientPage />
        </Suspense>
      </ClientLayout>
    )
  }

  // Coach mode — serve mobile or desktop pages based on real-time viewport width
  const coachPages = isMobile ? COACH_PAGES_MOBILE : COACH_PAGES_DESKTOP
  const fallback   = isMobile ? MobileCoachDashboard : CoachDashboard
  const CoachPage  = coachPages[activePage] || fallback

  return (
    <CoachLayout>
      <Suspense fallback={<PageLoader />}>
        <CoachPage />
      </Suspense>
    </CoachLayout>
  )
}
