import { useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import BrandWordmark from './BrandWordmark'
import { scrollToMarketingSection } from '../lib/marketingScroll'
import './MarketingNav.css'

const gymLinks = [['gym-benefits', 'Benefits'], ['gym-onboarding', 'How it works'], ['gym-pricing', 'Pricing'], ['gym-faq', 'FAQs'], ['gym-contact', 'Contact']]
const links = [['features', 'Features'], ['app', 'The app'], ['pricing', 'Pricing'], ['coach', 'Coaches']]

export default function MarketingNav({ gyms = false, onGetStarted, onSignUp, onMarketplace }) {
  const ref = useRef(null)
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
      <div className="marketing-sections">{(gyms ? gymLinks : links).map(([id,label]) => <a key={id} href={`#${id}`} onClick={event => { if (scrollToMarketingSection(id)) event.preventDefault() }}>{label}</a>)}
        {!gyms && <a href="/marketplace" onClick={e => action(e,onMarketplace)}>Marketplace</a>}
        {!gyms && <a href="/gyms">Gyms</a>}
        {!gyms && <a href="/retailers">Retailers</a>}
      </div>
      <div className="marketing-actions">
        <a href="/login" onClick={e => action(e,onGetStarted)}>Sign in</a>
        <a className="marketing-start" href={gyms ? '#gym-contact' : '/signup'} onClick={e => { if (gyms) { if (scrollToMarketingSection('gym-contact')) e.preventDefault() } else action(e,onSignUp) }}>{gyms ? 'Let’s talk' : 'Get started'}</a>
      </div>
    </nav>
  </header>
}
