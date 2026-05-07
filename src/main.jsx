import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Set --app-height to the exact visible viewport height.
// window.innerHeight is the only reliable value on iOS/Android — 100vh and
// 100dvh both have well-known quirks with browser toolbars and safe areas.
function setAppHeight() {
  document.documentElement.style.setProperty('--app-height', window.innerHeight + 'px')
}
setAppHeight()
window.addEventListener('resize', setAppHeight)
window.addEventListener('orientationchange', setAppHeight)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
