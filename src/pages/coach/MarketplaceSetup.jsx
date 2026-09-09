import { useEffect, useState } from 'react'
import useStore from '../../store'
import { supabase } from '../../lib/supabase'
import { marketplace, coachingPrice } from '../../lib/marketplace'
import '../Marketplace.css'

const inputClass = 'w-full bg-surface border border-border rounded-lg px-4 py-3 text-cream focus:outline-none focus:ring-2 focus:ring-brown/40'
export default function MarketplaceSetup() {
  const user = useStore(s => s.currentUser)
  const [form, setForm] = useState({ name: user?.name || '', headline: '', bio: user?.bio || '', specialties: user?.specialties || '', credentials: user?.credentials || '', photo_url: '', price_cents: 10000, billing_mode: 'monthly', duration_days: 30, published: false })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    let alive = true
    marketplace('my-profile').then(({ profile }) => { if (alive && profile) setForm(profile) }).catch(e => { if (alive) setError(e.message) }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])
  const change = (key, value) => setForm(previous => ({ ...previous, [key]: value }))
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try { await marketplace('save', { profile: form }); setMessage(form.published ? 'Your coaching profile is published.' : 'Draft saved. Your profile is not publicly listed.') }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function connect() {
    setBusy(true); setError('')
    try {
      const { data, error: failure } = await supabase.functions.invoke('connect-onboard', { body: { marketplace: true } })
      if (failure || data?.error) throw new Error(data?.error || failure.message)
      if (data.url) window.location.assign(data.url)
      else setMessage('Stripe is connected. Save your profile to verify publishing eligibility.')
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return <main className="marketplace-page app-page-gutter px-5 pt-mobile-header md:pt-8 pb-28 text-cream">
    <header className="mb-6"><p className="font-mono text-xs tracking-widest text-muted mb-2">COACH PORTAL</p><h1 className="font-display text-4xl">MARKETPLACE</h1><p className="text-muted mt-2">Build your public coaching profile. You stay private until you choose to publish.</p></header>
    {loading ? <p role="status">Loading your profile...</p> : <form onSubmit={save} className="grid lg:grid-cols-[2fr_1fr] gap-6">
      <section className="glass-card p-6 space-y-5">
        {[['name', 'Public name', 100], ['headline', 'Coaching headline', 160], ['specialties', 'Specialties', 500], ['credentials', 'Credentials', 1000], ['photo_url', 'Profile photo HTTPS URL (optional)', 1000]].map(([key, label, max]) => <label key={key} className="block text-sm space-y-2"><span>{label}</span><input className={inputClass} value={form[key]} maxLength={max} required={key === 'name' || key === 'headline'} onChange={e => change(key, e.target.value)} /></label>)}
        <label className="block text-sm space-y-2"><span>About your coaching and what clients receive</span><textarea className={inputClass} rows={7} minLength={20} maxLength={5000} required value={form.bio} onChange={e => change('bio', e.target.value)} /></label>
      </section>
      <section className="glass-card p-6 space-y-5 self-start">
        <h2 className="font-display text-2xl">YOUR PACKAGE</h2>
        <label className="block text-sm space-y-2"><span>Billing</span><select className={inputClass} value={form.billing_mode} onChange={e => change('billing_mode', e.target.value)}><option value="monthly">Monthly subscription</option><option value="one_time">One-time package</option></select></label>
        <label className="block text-sm space-y-2"><span>Price (USD)</span><input type="number" required min="1" max="10000" step="0.01" className={inputClass} value={form.price_cents / 100} onChange={e => change('price_cents', Math.round(Number(e.target.value) * 100))} /></label>
        {form.billing_mode === 'one_time' && <label className="block text-sm space-y-2"><span>Access duration (days)</span><input type="number" required min="1" max="730" step="1" className={inputClass} value={form.duration_days || ''} onChange={e => change('duration_days', Number(e.target.value))} /></label>}
        <p className="font-display text-xl">{coachingPrice(form)}</p><p className="text-sm text-muted">When paid access ends, the client connection and history remain. Payment reactivates coaching.</p>
        <button type="button" disabled={busy} onClick={connect} className="btn-ghost w-full">Connect / verify Stripe</button>
        <label className="flex gap-3 text-sm"><input type="checkbox" checked={form.published} onChange={e => change('published', e.target.checked)} /><span>Publish my profile in the marketplace</span></label>
        <p className="text-xs text-muted">Publishing requires Stripe payment and payout readiness. Package changes apply to new purchases, not existing paid access.</p>
        <button disabled={busy} className="btn-primary w-full">{busy ? 'Saving...' : 'Save marketplace profile'}</button>
        {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}{message && <p role="status" className="text-sm">{message}</p>}
      </section>
    </form>}
  </main>
}
