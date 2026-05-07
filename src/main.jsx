import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
