import { useEffect, useState } from 'react'
import { ArrowLeft, Search, ShieldCheck, UserRound } from 'lucide-react'
import useStore from '../store'
import { marketplace, coachingPrice } from '../lib/marketplace'
import './Marketplace.css'

export default function Marketplace({ onBack, onSignIn }) {
  const authenticated = useStore(s => s.isAuthenticated)
  const [coaches, setCoaches] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [access, setAccess] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const result = await marketplace('list')
        if (!alive) return
        setCoaches(result.coaches)
        const pending = sessionStorage.getItem('ms-marketplace-coach')
        setSelected(result.coaches.find(c => c.coach_id === pending) || null)
        if (authenticated) {
          const session_id = new URLSearchParams(window.location.search).get('session_id')
          const status = await marketplace('status', { session_id })
          if (alive) setAccess(status.access)
          if (session_id && status.access?.active) {
            sessionStorage.removeItem('ms-marketplace-coach')
            await useStore.getState().loadAllData()
          }
        }
      } catch (e) { if (alive) setError(e.message) }
      finally { if (alive) setLoading(false) }
    }
    load()
    return () => { alive = false }
  }, [authenticated])

  async function checkout(coach) {
    sessionStorage.setItem('ms-marketplace-coach', coach.coach_id)
    if (!authenticated) { onSignIn?.(); return }
    setBusy(true); setError('')
    try {
      const result = await marketplace('checkout', { coach_id: coach.coach_id })
      window.location.assign(result.url)
    } catch (e) { setError(e.message); setBusy(false) }
  }
  async function manage() {
    setBusy(true); setError('')
    try { const result = await marketplace('manage'); window.location.assign(result.url) }
    catch (e) { setError(e.message); setBusy(false) }
  }

  const filtered = coaches.filter(c => `${c.name} ${c.specialties} ${c.headline}`.toLowerCase().includes(query.toLowerCase()))
  return <main className="marketplace-page min-h-full bg-bg text-cream px-5 py-8 md:px-8 pb-28">
    <div className="max-w-6xl mx-auto space-y-6">
      {onBack && <button type="button" onClick={onBack} className="btn-ghost flex items-center gap-2"><ArrowLeft size={16} /> Back</button>}
      <header><p className="font-mono text-xs tracking-widest text-muted mb-3">MACROSTACK COACHING</p><h1 className="font-display text-4xl md:text-5xl">FIND YOUR COACH</h1><p className="text-muted mt-3 max-w-2xl">Explore coaching that fits your goals. Choose your coach, review their package, and connect after secure checkout.</p></header>
      {error && <p role="alert" className="border border-red-400/40 rounded-lg p-4 text-red-400">{error}</p>}
      {access && <section className="glass-card p-5 space-y-2"><h2 className="font-display text-2xl">{access.coach_name}</h2><p>{access.active ? 'Coaching active' : 'Coaching inactive. Renew your access to continue.'}</p><p className="text-muted text-sm">Access through {new Date(access.paid_until).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>{access.active && <p className="font-mono text-sm">Coach code: <strong>{access.coach_code}</strong>. Your connection is ready.</p>}</section>}
      {access?.recurring && <button disabled={busy} type="button" className="btn-ghost" onClick={manage}>Manage coaching subscription</button>}
      <label className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"><Search size={18} className="text-muted shrink-0" /><input aria-label="Search coaches" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name or specialty" className="bg-transparent outline-none w-full min-w-0" /></label>
      {loading ? <p role="status">Loading coaches...</p> : error && coaches.length === 0 ? null : filtered.length === 0 ? <div className="glass-card rounded-xl p-8 text-muted">{coaches.length ? 'No coaches match your search.' : 'Coaches are preparing their profiles. Check back soon.'}</div> : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(coach => <article key={coach.coach_id} className="glass-card rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">{coach.photo_url ? <img src={coach.photo_url} alt="" className="w-14 h-14 rounded-full object-cover" /> : <UserRound size={30} className="text-brown" />}<h2 className="font-display text-2xl break-words">{coach.name}</h2></div>
          <p>{coach.headline}</p><p className="text-sm text-muted break-words">{coach.specialties}</p><p className="font-display text-xl mt-auto">{coachingPrice(coach)}</p>
          <button type="button" className="btn-primary w-full" onClick={() => setSelected(coach)}>View coaching profile</button>
        </article>)}
      </div>}
      {selected && <section className="glass-card rounded-xl p-6 md:p-8 space-y-4" aria-label={`${selected.name} coaching details`}>
        <div className="flex justify-between gap-4"><h2 className="font-display text-3xl">{selected.name}</h2><button type="button" className="btn-ghost" onClick={() => setSelected(null)}>Close</button></div>
        <p className="text-xl">{selected.headline}</p><p className="whitespace-pre-wrap break-words text-muted">{selected.bio}</p>
        {selected.credentials && <p className="text-sm break-words">Credentials: {selected.credentials}</p>}
        <p className="font-display text-2xl">{coachingPrice(selected)}</p>
        <p className="text-sm text-muted">{selected.billing_mode === 'monthly' ? 'Renews monthly until canceled. Access remains available through your paid period.' : `One payment provides ${selected.duration_days} days of access. Renew to continue after that period.`} MacroStack Pro is a separate subscription.</p>
        <button type="button" disabled={busy} onClick={() => checkout(selected)} className="btn-primary w-full md:w-auto">{busy ? 'Preparing checkout...' : authenticated ? 'Continue to secure checkout' : 'Sign in to continue'}</button>
        <p className="flex gap-2 text-xs text-muted"><ShieldCheck size={16} /> Payment securely processed by Stripe. Your coach connection activates after payment confirmation.</p>
      </section>}
    </div>
  </main>
}
