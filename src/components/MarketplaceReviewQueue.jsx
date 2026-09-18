import { useCallback, useEffect, useRef, useState } from 'react'
import { marketplace, coachingPrice } from '../lib/marketplace'

const labels = { pending: 'Pending review', approved: 'Approved', rejected: 'Changes requested' }
export default function MarketplaceReviewQueue() {
  const [status, setStatus] = useState('pending')
  const [offset, setOffset] = useState(0)
  const [profiles, setProfiles] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [notes, setNotes] = useState({})
  const request = useRef(0)
  const inFlight = useRef(false)
  const load = useCallback(async () => {
    const id = ++request.current
    try {
      const result = await marketplace('admin-list', { status, offset })
      if (id === request.current) { setProfiles(result.profiles); setHasMore(result.hasMore) }
    } catch (e) { if (id === request.current) setError(e.message) }
    finally { if (id === request.current) setLoading(false) }
  }, [status, offset])
  const invalidateRequest = useCallback(() => { request.current++ }, [])
  // Fetch external queue data on mount/filter changes; generation guards discard stale responses.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); return invalidateRequest }, [load, invalidateRequest])
  async function review(profile, decision) {
    if (inFlight.current) return
    inFlight.current = true; setBusy(true); setError(''); setMessage('')
    try {
      await marketplace('admin-review', { coach_id: profile.coach_id, revision: profile.revision, decision, note: notes[profile.coach_id] || '' })
      setMessage(decision === 'approved' ? `${profile.name} approved. The listing becomes visible when Stripe is ready.` : `${profile.name} hidden from the Marketplace. The coach can see your feedback.`)
      setLoading(true); await load()
    } catch (e) { setError(e.message) }
    finally { inFlight.current = false; setBusy(false) }
  }
  return <section className="glass-card border border-border rounded-2xl p-4 md:p-5 !mb-6" aria-labelledby="marketplace-review-heading">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 id="marketplace-review-heading" className="font-display font-bold text-lg tracking-wide text-cream">MARKETPLACE APPROVALS</h2><p className="text-xs text-muted mt-1">Review the profile, photos, and package before it goes live.</p></div>
      <button type="button" className="btn-ghost text-sm" disabled={loading || busy} onClick={() => { setLoading(true); setError(''); load() }}>Refresh reviews</button>
    </div>
    <div className="flex flex-wrap gap-2 my-4" aria-label="Filter Marketplace reviews">
      {Object.entries(labels).map(([value, label]) => <button type="button" key={value} aria-pressed={status === value} disabled={busy || status === value} onClick={() => { setLoading(true); setError(''); setStatus(value); setOffset(0); setMessage('') }} className={`rounded-lg border px-3 py-2 text-xs ${status === value ? 'border-brown text-brown bg-brown/10' : 'border-border text-muted'}`}>{label}</button>)}
    </div>
    {error && <p role="alert" className="text-sm text-red-400 mb-3">{error}</p>}
    {message && <p role="status" className="text-sm text-muted mb-3">{message}</p>}
    {loading ? <p role="status" className="text-sm text-muted py-4">Loading reviews…</p> : error ? null : profiles.length === 0 ? <p className="text-sm text-muted py-4">No profiles in this queue.</p> : <div className="space-y-3">
      {profiles.map(profile => <details key={`${profile.coach_id}-${profile.revision}`} className="rounded-xl border border-border bg-surface/40 overflow-hidden">
        <summary className="cursor-pointer px-4 py-3 text-sm text-cream"><span className="font-semibold">{profile.name}</span><span className="block text-xs text-muted mt-1">{profile.headline} · {coachingPrice(profile)}</span></summary>
        <div className="p-4 pt-0 space-y-4 text-sm">
          {profile.cover_url && <img src={profile.cover_url} alt={`${profile.name} cover`} className="w-full aspect-[3/1] object-cover rounded-lg" />}
          {profile.photo_url && <img src={profile.photo_url} alt={`${profile.name} profile`} className="w-20 h-20 object-cover rounded-full" />}
          <div><h3 className="font-semibold text-cream">About & package</h3><p className="whitespace-pre-wrap break-words text-muted mt-1">{profile.bio}</p></div>
          <dl className="grid gap-3 sm:grid-cols-2"><div><dt className="text-xs text-muted">Specialties</dt><dd className="break-words">{profile.specialties || 'None listed'}</dd></div><div><dt className="text-xs text-muted">Credentials</dt><dd className="break-words">{profile.credentials || 'None listed'}</dd></div></dl>
          <p className="text-xs text-muted">{profile.stripe_ready ? 'Stripe ready' : 'Stripe setup incomplete — hidden until ready'} · Revision {profile.revision}</p>
          {profile.review_note && <p className="p-3 rounded-lg border border-border text-muted whitespace-pre-wrap break-words">Previous feedback: {profile.review_note}</p>}
          {status !== 'rejected' && <><label className="block text-xs text-muted">Feedback to coach (required for changes or revocation)<textarea aria-label={`Feedback for ${profile.name}`} maxLength={2000} rows={3} disabled={busy} value={notes[profile.coach_id] || ''} onChange={e => setNotes(previous => ({ ...previous, [profile.coach_id]: e.target.value }))} className="block w-full mt-2 rounded-lg border border-border bg-bg p-3 text-sm text-cream" /></label>
            <div className="flex flex-wrap gap-2">
              {status === 'pending' && <button type="button" disabled={busy} onClick={() => review(profile, 'approved')} className="btn-accent rounded-lg px-4 py-2 text-sm">Approve profile</button>}
              <button type="button" disabled={busy || !notes[profile.coach_id]?.trim()} onClick={() => review(profile, 'rejected')} className="btn-ghost text-sm">{status === 'approved' ? 'Revoke approval' : 'Request changes'}</button>
            </div></>}
        </div>
      </details>)}
    </div>}
    {(offset > 0 || hasMore) && <div className="flex items-center justify-between mt-4 text-sm"><button type="button" disabled={!offset || busy || loading} onClick={() => { setLoading(true); setError(''); setOffset(value => Math.max(0, value - 20)) }}>Previous reviews</button><span className="text-muted">Page {offset / 20 + 1}</span><button type="button" disabled={!hasMore || busy || loading} onClick={() => { setLoading(true); setError(''); setOffset(value => value + 20) }}>Next reviews</button></div>}
  </section>
}
