import LoadingSplash from "./components/LoadingSplash"
import { useEffect, useState, useRef, lazy, Suspense } from 'react'
import useStore from './store'
import useIsMobile from './hooks/useIsMobile'
import { isNativeApp } from './lib/platform'

// Layouts (small, keep eager so the shell paints instantly)
import CoachLayout from './layouts/CoachLayout'
import ClientLayout from './layouts/ClientLayout'
import MotionPage from './components/MotionPage'

// ── Code-split pages, each loads on demand, keeping the initial bundle
//    small (Landing, the 1900-item food DB, and recharts are the heavy ones)
const Landing           = lazy(() => import('./pages/Landing'))
const LoginScreen       = lazy(() => import('./pages/LoginScreen'))
const SignupCheckout    = lazy(() => import('./pages/SignupCheckout'))
const SetPasswordScreen = lazy(() => import('./pages/SetPasswordScreen'))

// Role entry points
const RoleSelector   = lazy(() => import('./pages/RoleSelector'))
const ClientSelector = lazy(() => import('./pages/client/ClientSelector'))

// Coach pages, desktop
const CoachDashboard = lazy(() => import('./pages/coach/CoachDashboard'))
const CoachChat      = lazy(() => import('./pages/coach/CoachChat'))
const CoachProfile   = lazy(() => import('./pages/coach/CoachProfile'))
const MyFoods        = lazy(() => import('./pages/MyFoods'))
const Clients        = lazy(() => import('./pages/coach/Clients'))
const CoachForms     = lazy(() => import('./pages/coach/CoachForms'))

// Coach pages, mobile (auto-selected when viewport < 768 px)
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

const CoachLibrary = lazy(() => import('./pages/coach/CoachResources'))
const CoachMore = lazy(() => import('./pages/coach/CoachMore'))

// Shared
const UpgradePage = lazy(() => import('./pages/UpgradePage'))
const AdminBilling = lazy(() => import('./pages/coach/AdminBilling'))
const AdminCoaches = lazy(() => import('./pages/coach/AdminCoaches'))
const LeadFinder = lazy(() => import('./pages/coach/LeadFinder'))
const FeedbackForum = lazy(() => import('./pages/FeedbackForum'))
const Marketplace = lazy(() => import('./pages/Marketplace'))
const RetailApp = lazy(() => import('./retail/RetailApp'))
const MarketplaceSetup = lazy(() => import('./pages/coach/MarketplaceSetup'))

function PageLoader() {
  return <div className="app-page-gutter px-5 pt-mobile-header" role="status" aria-label="Loading page"><div className="skeleton h-8 w-44 mb-6" /><div className="skeleton h-28 w-full !rounded-2xl" /></div>
}

const COACH_PAGES_DESKTOP = {
  library: CoachLibrary,
  more: CoachMore,
  dashboard: CoachDashboard,
  insights:  CoachDashboard,
  clients:   Clients,
  chat:      CoachChat,
  foods:     MyFoods,
  forms:     CoachForms,
  profile:   CoachProfile,
  upgrade:   UpgradePage,
  coaches:   AdminCoaches,
  billing:   AdminBilling,
  leads:     LeadFinder,
  feedback:  FeedbackForum,
  marketplace: MarketplaceSetup,
}

const COACH_PAGES_MOBILE = {
  library: CoachLibrary,
  more: CoachMore,
  dashboard: MobileCoachDashboard,
  insights:  MobileCoachDashboard,
  clients:   MobileClients,
  chat:      MobileChat,
  foods:     MobileMyFoods,
  forms:     CoachForms,
  profile:   CoachProfile,
  upgrade:   UpgradePage,
  coaches:   AdminCoaches,
  billing:   AdminBilling,
  leads:     LeadFinder,
  feedback:  FeedbackForum,
  marketplace: MarketplaceSetup,
}

const CLIENT_PAGES = {
  dashboard: ClientDashboard,
  log:       ClientLog,
  weight:    ClientWeight,
  messages:  ClientMessages,
  profile:   ClientProfile,
  coach:     ClientCoachProfile,
  feedback:  FeedbackForum,
  upgrade:   UpgradePage,
  marketplace: Marketplace,
}

// Every page id that gets a real URL path (/chat, /foods, /billing, …).
// Union of coach + client page maps, the active role renders its own page.
const ROUTABLE = new Set([
  'retail',
  ...Object.keys(COACH_PAGES_DESKTOP),
  ...Object.keys(CLIENT_PAGES),
])

// True when running as an installed PWA (homescreen shortcut) or inside the
// native iOS shell, both should boot straight to sign-in, never the
// marketing landing. Checked once at module load, doesn't change during a session.
const IS_PWA =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true ||
  isNativeApp

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

  // Public browser pages always use the brand dark theme. Preserve the saved
  // preference for the authenticated app and installed PWA.
  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('ocean-dark', 'ocean-light')
    html.classList.add(!isAuthenticated && !IS_PWA ? 'ocean-dark' : theme)
  }, [theme, isAuthenticated])

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

  // ── URL routing ─────────────────────────────────────────────────────────
  // The app is state-driven (activePage in the store), but every page gets a
  // real path so it can be visited, refreshed, and bookmarked directly:
  //   /login /signup pre-auth · /dashboard /chat /foods /billing … in-app
  const initialPathRef = useRef(window.location.pathname)

  // 1. Adopt the address-bar path: pre-auth for /login + /signup, and once
  //    auth resolves, land on the page the user originally asked for.
  useEffect(() => {
    const seg = (initialPathRef.current || '/').replace(/^\/+|\/+$/g, '')
    if (!isAuthenticated) {
      if (seg === 'retail' || seg === 'retail/member') { sessionStorage.setItem('ms-retail-return', '1'); setAuthView('login') }
      if (seg === 'login')  setAuthView('login')
      if (seg === 'signup') setAuthView('signup')
      if (seg === 'marketplace') setAuthView('marketplace')
      return
    }
    if (seg === 'retail/member') setActivePage('retail')
    else if (ROUTABLE.has(seg)) setActivePage(seg)
    if (sessionStorage.getItem('ms-retail-return')) {setActivePage('retail');sessionStorage.removeItem('ms-retail-return')}
    if (sessionStorage.getItem('ms-marketplace-coach')) setActivePage('marketplace')
    initialPathRef.current = '/'   // consumed, don't re-apply on later auth flips
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Keep the address bar in sync with in-app navigation
  useEffect(() => {
    if (authLoading) return
    const path = isAuthenticated
      ? (activePage === 'retail' ? '/retail/member' : `/${activePage || 'dashboard'}`)
      : authView === 'login' ? '/login'
      : authView === 'signup' ? '/signup'
      : authView === 'marketplace' ? '/marketplace'
      : '/'
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path + window.location.search)
    }
  }, [isAuthenticated, authLoading, authView, activePage])

  // 3. Browser back/forward buttons drive the app
  useEffect(() => {
    const onPop = () => {
      const seg = window.location.pathname.replace(/^\/+|\/+$/g, '')
      if (!isAuthenticated) {
        setAuthView(seg === 'marketplace' ? 'marketplace' : seg === 'login' ? 'login' : seg === 'signup' ? 'signup' : (IS_PWA ? 'login' : null))
      } else if (seg === 'retail/member') {
        setActivePage('retail')
      } else if (ROUTABLE.has(seg)) {
        setActivePage(seg)
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isAuthenticated) return
    const refresh = () => { if (document.visibilityState === 'visible') { useStore.getState().refreshRetailSponsorship(); useStore.getState().refreshClientNutrition(); } }
    refresh()
    const timer = setInterval(refresh, 60000)
    document.addEventListener('visibilitychange', refresh)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', refresh) }
  }, [isAuthenticated])

  // Chat self-heal: when the tab comes back to the foreground, re-pull the
  // messages table in case the realtime websocket dropped while backgrounded
  // (mobile Safari/Chrome suspend sockets aggressively). Realtime handles the
  // instant delivery; this catches anything missed while asleep.
  useEffect(() => {
    if (!isAuthenticated) return
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        const s = useStore.getState()
        s.refreshMessages?.()
        s.subscribeToMessages?.()   // re-arm the channel if it was torn down
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
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
      else localStorage.removeItem('ms-pending-plan') // free tier, nothing to buy
    } catch { /* ignore malformed value */ }
  }, [isAuthenticated])

  // A fresh signup is on its way to Stripe checkout, hold this screen so the
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

  if (authLoading) return <LoadingSplash fullScreen label="Opening MacroStack…" />

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        {authView === 'marketplace'
          ? <Marketplace onBack={() => setAuthView(null)} onSignIn={() => { localStorage.removeItem('ms-pending-plan'); setAuthView('signup') }} />
          : authView === 'login'
          ? <LoginScreen onBack={IS_PWA ? null : () => setAuthView(null)} />
          : authView === 'signup'
          ? <SignupCheckout onBack={() => setAuthView(null)} onSignIn={() => setAuthView('login')} />
          : <Landing onMarketplace={() => setAuthView('marketplace')} onGetStarted={() => setAuthView('login')} onSignUp={() => setAuthView('signup')} />}
      </Suspense>
    )
  }

  // Invited client just confirmed their email, make them set a password first
  if (postInvite) {
    return (
      <Suspense fallback={<PageLoader />}>
        <SetPasswordScreen onDone={() => setPostInvite(false)} />
      </Suspense>
    )
  }

  if (activePage === 'retail') return <Suspense fallback={<LoadingSplash fullScreen label="Opening retailer workspace…" />}><RetailApp /></Suspense>

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
        <Suspense fallback={<div className="app-page-gutter px-5 pt-mobile-header" role="status" aria-label="Loading page"><div className="skeleton h-8 w-44 mb-6" /><div className="skeleton h-28 w-full !rounded-2xl" /></div>}>
          {/* keyed so the motion engine re-choreographs on every page switch */}
          <MotionPage key={activePage}>
            <ClientPage />
          </MotionPage>
        </Suspense>
      </ClientLayout>
    )
  }

  // Coach mode, serve mobile or desktop pages based on real-time viewport width
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
