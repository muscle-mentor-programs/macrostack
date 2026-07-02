import { useEffect, useState, lazy, Suspense } from 'react'
import useStore from './store'
import useIsMobile from './hooks/useIsMobile'

// Layouts (small — keep eager so the shell paints instantly)
import CoachLayout from './layouts/CoachLayout'
import ClientLayout from './layouts/ClientLayout'
import MotionPage from './components/MotionPage'

// ── Code-split pages — each loads on demand, keeping the initial bundle
//    small (Landing, the 1900-item food DB, and recharts are the heavy ones)
const Landing           = lazy(() => import('./pages/Landing'))
const LoginScreen       = lazy(() => import('./pages/LoginScreen'))
const SignupCheckout    = lazy(() => import('./pages/SignupCheckout'))
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
const CoachForms     = lazy(() => import('./pages/coach/CoachForms'))

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

// Shared
const UpgradePage = lazy(() => import('./pages/UpgradePage'))
const AdminBilling = lazy(() => import('./pages/coach/AdminBilling'))
const AdminCoaches = lazy(() => import('./pages/coach/AdminCoaches'))

// Shared suspense fallback — branded skeleton so page swaps feel intentional,
// not like a loading failure. Mirrors the typical page anatomy.
function PageLoader() {
  return (
    <div className="h-full w-full bg-bg px-5 pt-mobile-header anim-fade-in">
      <div className="skeleton h-8 w-44 mb-2" />
      <div className="skeleton h-3 w-28 mb-8" />
      <div className="skeleton h-36 w-full mb-4 !rounded-2xl" />
      <div className="flex gap-3 mb-4">
        <div className="skeleton h-24 flex-1 !rounded-2xl" />
        <div className="skeleton h-24 flex-1 !rounded-2xl" />
        <div className="skeleton h-24 flex-1 !rounded-2xl" />
      </div>
      <div className="skeleton h-28 w-full !rounded-2xl" />
    </div>
  )
}

const COACH_PAGES_DESKTOP = {
  dashboard: CoachDashboard,
  clients:   Clients,
  chat:      CoachChat,
  foods:     MyFoods,
  forms:     CoachForms,
  profile:   CoachProfile,
  upgrade:   UpgradePage,
  coaches:   AdminCoaches,
  billing:   AdminBilling,
}

const COACH_PAGES_MOBILE = {
  dashboard: MobileCoachDashboard,
  clients:   MobileClients,
  chat:      MobileChat,
  foods:     MobileMyFoods,
  forms:     CoachForms,
  profile:   CoachProfile,
  upgrade:   UpgradePage,
  coaches:   AdminCoaches,
  billing:   AdminBilling,
}

const CLIENT_PAGES = {
  dashboard: ClientDashboard,
  log:       ClientLog,
  weight:    ClientWeight,
  messages:  ClientMessages,
  profile:   ClientProfile,
  coach:     ClientCoachProfile,
  upgrade:   UpgradePage,
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
    theme, initAuth, setActivePage, checkoutRedirect,
  } = useStore()
  const isMobile = useIsMobile()

  // Which pre-auth view is showing: null = landing, 'login' = sign-in,
  // 'signup' = create-account (+ payment when a plan was picked).
  // Start on login immediately when launched from the homescreen.
  const [authView, setAuthView] = useState(IS_PWA ? 'login' : null)

  // True when the user landed via an email invite link and still needs to set a password
  const [postInvite, setPostInvite] = useState(
    () => sessionStorage.getItem('macrostack-post-invite') === '1'
  )

  // Apply theme class (ocean-dark / ocean-light).
  // The marketing landing page is art-directed for the dark palette — its
  // "light" sections invert the theme's cream/ink vars, which flip to
  // dark-on-dark mush under ocean-light. Render the pre-auth landing in
  // ocean-dark always; login/signup and the app honor the user's theme.
  const onLanding = !isAuthenticated && authView === null
  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('ocean-dark', 'ocean-light')
    html.classList.add(onLanding ? 'ocean-dark' : theme)
  }, [theme, onLanding])

  // Check Supabase session on mount
  useEffect(() => {
    initAuth()
  }, [])

  // The landing page scrolls the window (Lenis); the app shell doesn't. If a
  // scroll offset survives the swap (e.g. user clicked a coach tier deep down
  // the page, then signed in), the whole app renders shifted up and cut off.
  // Reset window scroll on every top-level view change.
  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [isAuthenticated, authView, checkoutRedirect])

  // Returning from Stripe Checkout → land on the upgrade page so its
  // success handler refreshes access and shows the confirmation. activePage
  // isn't persisted, so without this the redirect would drop onto the dashboard.
  useEffect(() => {
    if (!isAuthenticated) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') === 'success') setActivePage('upgrade')
  }, [isAuthenticated])

  // A plan was picked on the landing page before auth → open the Upgrade page
  // right after sign-in/sign-up with it preselected (UpgradePage reads the
  // same key for the selection, then clears it).
  useEffect(() => {
    if (!isAuthenticated) return
    try {
      const raw = localStorage.getItem('ms-pending-plan')
      if (!raw) return
      const { plan } = JSON.parse(raw)
      if (plan) setActivePage('upgrade')
      else localStorage.removeItem('ms-pending-plan') // free tier — nothing to buy
    } catch { /* ignore malformed value */ }
  }, [isAuthenticated])

  // A fresh signup is on its way to Stripe checkout — hold this screen so the
  // app (role/dashboard views) never renders before the payment page opens.
  if (checkoutRedirect) {
    return (
      <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center gap-4 anim-fade-in">
        <div className="w-10 h-10 border-2 border-brown border-t-transparent rounded-full animate-spin" />
        <p className="font-display font-bold text-sm tracking-widest text-cream">ACCOUNT CREATED</p>
        <p className="font-mono text-xs text-muted">Redirecting to secure checkout…</p>
      </div>
    )
  }

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
        {authView === 'login'
          ? <LoginScreen onBack={IS_PWA ? null : () => setAuthView(null)} />
          : authView === 'signup'
          ? <SignupCheckout onBack={() => setAuthView(null)} onSignIn={() => setAuthView('login')} />
          : <Landing onGetStarted={() => setAuthView('login')} onSignUp={() => setAuthView('signup')} />}
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
          {/* keyed so the motion engine re-choreographs on every page switch */}
          <MotionPage key={activePage}>
            <ClientPage />
          </MotionPage>
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
        <MotionPage key={`${activePage}-${isMobile}`}>
          <CoachPage />
        </MotionPage>
      </Suspense>
    </CoachLayout>
  )
}
