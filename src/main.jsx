import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import LogoSplash from './components/LogoSplash.jsx'

/* ── Boot splash — the logo animation plays IN FULL over the entire app on
   every new browser session (landing, deep links, PWA launches), then fades
   out to reveal whatever rendered underneath while it played. No skip. */
function BootSplash() {
  const [phase, setPhase] = useState(() =>
    sessionStorage.getItem('ms-intro-seen') ? 'done' : 'playing'
  )
  const finish = () => {
    setPhase((p) => {
      if (p !== 'playing') return p   // idempotent — ended + safety timer
      sessionStorage.setItem('ms-intro-seen', '1')
      setTimeout(() => setPhase('done'), 280)
      return 'fading'
    })
  }
  if (phase === 'done') return null
  return <LogoSplash onDone={finish} fading={phase === 'fading'} />
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
    <App />
    <BootSplash />
  </StrictMode>,
)
