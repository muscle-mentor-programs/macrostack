import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './software.css'
import './light-depth.css'
import './coach-colors.css'
import './coach-dashboard.css'
import './software-motion.css'
import './coach-cards.css'
import './coach-responsive.css'
import App from './App.jsx'
import StripeConnectCallback from './pages/StripeConnectCallback.jsx'
import * as Sentry from '@sentry/react'

// The root entry mounts the lazy public route rather than exporting components.
// eslint-disable-next-line react-refresh/only-export-components
const Gyms = lazy(() => import('./pages/Gyms.jsx'))

// Error monitoring, no-op until VITE_SENTRY_DSN is set in Vercel env
if (import.meta.env.VITE_SENTRY_DSN) {
 Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, sendDefaultPii: false, tracesSampleRate: 0 })
}

// window.screen.height is the physical screen height in CSS pixels.
// Unlike window.innerHeight, it includes the iOS home-indicator zone (~34pt)
// that viewport-fit:cover exposes but the layout viewport excludes.
// Using this ensures the layout container fills the FULL physical screen,
// so the flex-child nav bar reaches the actual screen bottom.
function setAppHeight() {
  document.documentElement.style.setProperty('--app-height', window.screen.height + 'px')
}
setAppHeight()
window.addEventListener('orientationchange', setAppHeight)

// Supabase processes and removes the #access_token hash immediately on load,
// so we capture the invite flag in sessionStorage before that happens.
if (window.location.hash.includes('type=invite')) {
  sessionStorage.setItem('macrostack-post-invite', '1')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {window.location.pathname.replace(/\/+$/, '') === '/gyms'
      ? <Suspense fallback={<div style={{ minHeight: '100vh', background: '#080b12' }} />}><Gyms /></Suspense>
      : window.location.pathname === '/stripe-connect/callback' ? <StripeConnectCallback /> : <App />}
  </StrictMode>,
)
