import { useEffect, useRef } from 'react'
import { Sun, Moon } from 'lucide-react'
import BrandWordmark from './BrandWordmark'
import useStore from '../store'
import { splatToggleTheme } from '../lib/themeSplat'
import { scrollToMarketingSection } from '../lib/marketingScroll'
import './MarketingNav.css'

const links = [['features', 'FEATURES'], ['app', 'THE APP'], ['pricing', 'PRICING'], ['coach', 'COACHES']]
const gymLinks = [['gym-benefits', 'Benefits'], ['gym-onboarding', 'How it works'], ['gym-pricing', 'Gym pricing'], ['gym-faq', 'FAQs'], ['gym-contact', 'Let’s talk']]

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
  function section(event, id) { if (scrollToMarketingSection(id)) event.preventDefault() }
  return <header ref={ref} className={`marketing-header${gyms ? ' marketing-header-gyms' : ''}`}>
    <nav className="marketing-nav" aria-label="Main site navigation">
      <a href="/" className="marketing-brand" aria-label="Macrostack home" onClick={event => { if (!gyms) { event.preventDefault(); scrollToMarketingSection(null) } }}><img src="/macrostack-mark-light-shadow.png" alt="" width="36" height="36" /><BrandWordmark /></a>
      <div className="marketing-sections">{links.map(([id, label]) => <a key={id} href={gyms ? `/#${id}` : `#${id}`} onClick={gyms ? undefined : event => section(event, id)}>{label}</a>)}</div>
      <div className="marketing-actions">
        <a href="/gyms" aria-current={gyms ? 'page' : undefined}>FOR GYMS</a>
        <a href="/marketplace" onClick={onMarketplace ? e => { e.preventDefault(); onMarketplace() } : undefined}>MARKETPLACE</a>
        {!gyms && <button className="marketing-theme" onClick={e => splatToggleTheme(e, toggleTheme)} aria-label={theme === 'ocean-dark' ? 'Switch to light mode' : 'Switch to dark mode'}>{theme === 'ocean-dark' ? <Sun size={14}/> : <Moon size={14}/>}</button>}
        <a href="/login" onClick={onGetStarted ? e => { e.preventDefault(); onGetStarted() } : undefined}>SIGN IN</a>
        <a className="marketing-start" href="/signup" onClick={onSignUp ? e => { e.preventDefault(); onSignUp() } : undefined}>GET STARTED</a>
      </div>
    </nav>
    {gyms && <nav className="marketing-gym-sections" aria-label="Gym sections">{gymLinks.map(([id,label]) => <a key={id} href={`#${id}`} onClick={event => section(event,id)}>{label}</a>)}</nav>}
  </header>
}
