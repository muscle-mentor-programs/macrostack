import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import './software.css'
import './light-depth.css'
import './coach-colors.css'
import './coach-dashboard.css'
import './software-motion.css'
import './coach-cards.css'
import './coach-responsive.css'
// eslint-disable-next-line react-refresh/only-export-components
const App = lazy(() => import('./App.jsx'))
// eslint-disable-next-line react-refresh/only-export-components
const StripeConnectCallback = lazy(() => import('./pages/StripeConnectCallback.jsx'))

// The root entry mounts the lazy public route rather than exporting components.
// eslint-disable-next-line react-refresh/only-export-components
const RetailDemo = lazy(() => import('./retail/RetailDemo.jsx'))
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

const publicPath = window.location.pathname.replace(/\/+$/, '')
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<div role="status" aria-label="Loading MacroStack" style={{ minHeight: '100dvh', background: '#080b12' }} />}>
      {publicPath === '/retail/demo' ? <RetailDemo />
        : publicPath === '/gyms' ? <Gyms />
        : publicPath === '/stripe-connect/callback' ? <StripeConnectCallback />
        : <App />}
    </Suspense>
  </StrictMode>,
)
