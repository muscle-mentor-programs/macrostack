import { useEffect, useRef } from 'react'
import { Sun, Moon, ArrowLeft } from 'lucide-react'
import BrandWordmark from './BrandWordmark'
import useStore from '../store'
import { splatToggleTheme } from '../lib/themeSplat'
import { scrollToMarketingSection } from '../lib/marketingScroll'
import './MarketingNav.css'

const links = [['features', 'Features'], ['app', 'The app'], ['pricing', 'Pricing'], ['coach', 'Coaches']]

export default function MarketingNav({ gyms = false, onGetStarted, onSignUp, onMarketplace }) {
  const ref = useRef(null)
  const theme = useStore(s => s.theme)
  const toggleTheme = useStore(s => s.toggleTheme)
  useEffect(() => {
    const update = () => document.documentElement.style.setProperty('--marketing-nav-height', `${ref.current.offsetHeight}px`)
    const observer = new ResizeObserver(update)
    observer.observe(ref.current)
    update()
    return () => { observer.disconnect(); document.documentElement.style.removeProperty('--marketing-nav-height') }
  }, [])
  function action(event, callback) { if (callback) { event.preventDefault(); callback() } }
  return <header ref={ref} className={`marketing-header${gyms ? ' marketing-header-gyms' : ''}`}>
    <nav className="marketing-nav" aria-label="Main site navigation">
      {gyms ? <a href="/" className="marketing-back"><ArrowLeft size={17}/> Back to home</a> : <a href="/" className="marketing-brand" aria-label="Macrostack home" onClick={event => { event.preventDefault(); scrollToMarketingSection(null) }}><img src="/macrostack-mark-light-shadow.png" alt="" width="32" height="32" /><BrandWordmark /></a>}
      <div className="marketing-sections">{links.map(([id,label]) => <a key={id} href={gyms ? `/#${id}` : `#${id}`} onClick={gyms ? undefined : event => { if (scrollToMarketingSection(id)) event.preventDefault() }}>{label}</a>)}
        <a href="/marketplace" onClick={e => action(e,onMarketplace)}>Marketplace</a>
        <a href="/gyms" aria-current={gyms ? 'page' : undefined}>Gyms</a>
      </div>
      <div className="marketing-actions">
        {!gyms && <button className="marketing-theme" onClick={e => splatToggleTheme(e,toggleTheme)} aria-label={theme === 'ocean-dark' ? 'Switch to light mode' : 'Switch to dark mode'}>{theme === 'ocean-dark' ? <Sun size={16}/> : <Moon size={16}/>}</button>}
        <a href="/login" onClick={e => action(e,onGetStarted)}>Sign in</a>
        <a className="marketing-start" href="/signup" onClick={e => action(e,onSignUp)}>Get started</a>
      </div>
    </nav>
  </header>
}
