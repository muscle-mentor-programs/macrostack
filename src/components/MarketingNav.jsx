import { useEffect, useRef, useState } from 'react'
import { Sun, Moon, Menu, X, ChevronDown } from 'lucide-react'
import BrandWordmark from './BrandWordmark'
import useStore from '../store'
import { splatToggleTheme } from '../lib/themeSplat'
import { scrollToMarketingSection } from '../lib/marketingScroll'
import './MarketingNav.css'

const links = [['features', 'Features'], ['app', 'The app'], ['pricing', 'Pricing'], ['coach', 'Coaches']]
const gymLinks = [['gym-benefits', 'Benefits'], ['gym-onboarding', 'How it works'], ['gym-pricing', 'Pricing'], ['gym-faq', 'FAQs']]

export default function MarketingNav({ gyms = false, onGetStarted, onSignUp, onMarketplace }) {
  const ref = useRef(null)
  const menuButton = useRef(null)
  const [open, setOpen] = useState(false)
  const theme = useStore(s => s.theme)
  const toggleTheme = useStore(s => s.toggleTheme)
  useEffect(() => {
    const update = () => document.documentElement.style.setProperty('--marketing-nav-height', `${ref.current.offsetHeight}px`)
    const observer = new ResizeObserver(update)
    observer.observe(ref.current)
    update()
    const dismiss = event => {
      if (event.type === 'keydown' && event.key !== 'Escape') return
      if (event.type === 'pointerdown' && ref.current.contains(event.target)) return
      setOpen(false)
      if (event.type === 'keydown') menuButton.current?.focus()
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', dismiss)
    return () => { observer.disconnect(); document.documentElement.style.removeProperty('--marketing-nav-height'); document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', dismiss) }
  }, [])
  function section(event, id) { if (scrollToMarketingSection(id)) event.preventDefault(); setOpen(false) }
  function action(event, callback) { setOpen(false); if (callback) { event.preventDefault(); callback() } }
  return <header ref={ref} className={`marketing-header${gyms ? ' marketing-header-gyms' : ''}`}>
    <nav className="marketing-nav" aria-label="Main site navigation">
      <a href="/" className="marketing-brand" aria-label="Macrostack home" onClick={event => { setOpen(false); if (!gyms) { event.preventDefault(); scrollToMarketingSection(null) } }}><img src="/macrostack-mark-light-shadow.png" alt="" width="32" height="32" /><BrandWordmark /></a>
      <div className="marketing-sections">{(gyms ? gymLinks : links).map(([id,label]) => <a key={id} href={`#${id}`} onClick={event => section(event,id)}>{label}</a>)}</div>
      <div className="marketing-actions">
        <button ref={menuButton} className="marketing-menu-toggle" aria-expanded={open} aria-controls="marketing-menu" aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} onClick={() => setOpen(value => !value)}><span>Explore</span><ChevronDown className="marketing-desktop-icon" size={14}/>{open ? <X className="marketing-mobile-icon" size={21}/> : <Menu className="marketing-mobile-icon" size={21}/>}</button>
        <a className="marketing-signin" href="/login" onClick={e => action(e,onGetStarted)}>Sign in</a>
        <a className="marketing-start" href={gyms ? '#gym-contact' : '/signup'} onClick={e => gyms ? section(e,'gym-contact') : action(e,onSignUp)}>{gyms ? 'Let’s talk' : 'Get started'}</a>
      </div>
      {open && <div id="marketing-menu" className="marketing-menu">
        <div className="marketing-mobile-sections"><p>{gyms ? 'For gyms' : 'On this page'}</p>{(gyms ? gymLinks : links).map(([id,label]) => <a key={id} href={`#${id}`} onClick={e => section(e,id)}>{label}</a>)}</div>
        <p>Explore Macrostack</p>
        <a href="/">Home</a><a href="/gyms" aria-current={gyms ? 'page' : undefined}>For gyms</a>
        <a href="/marketplace" onClick={e => action(e,onMarketplace)}>Find a coach</a>
        {gyms && <a href="/#app">Explore the app</a>}
        <a className="marketing-mobile-signin" href="/login" onClick={e => action(e,onGetStarted)}>Sign in</a>
        {!gyms && <button className="marketing-theme" onClick={e => splatToggleTheme(e,toggleTheme)}>{theme === 'ocean-dark' ? <Sun size={16}/> : <Moon size={16}/>} {theme === 'ocean-dark' ? 'Light appearance' : 'Dark appearance'}</button>}
      </div>}
    </nav>
  </header>
}
