import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, Search, Users, Award, Globe, Check, Loader2, Send } from 'lucide-react'
import useStore from '../store'
import { successHaptic } from '../utils/haptics'

/* ── Coach marketplace — browse registered coaches, request a connection ──────
   Full-screen overlay (same pattern as the food selector). The coach sees the
   request on their dashboard and either accepts directly or sends their
   connection code back, which surfaces here and on the profile tab. */

export default function CoachMarketplace({ onClose }) {
  const {
    coachDirectory, fetchCoachDirectory,
    myCoachRequests, fetchMyCoachRequests,
    requestCoach, submitCoachCode,
  } = useStore()

  const [query,   setQuery]   = useState('')
  const [busyId,  setBusyId]  = useState(null)   // coach id with an in-flight action
  const [linked,  setLinked]  = useState(null)   // coach name after a successful link
  const [error,   setError]   = useState('')

  useEffect(() => {
    fetchCoachDirectory()
    fetchMyCoachRequests()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // My request per coach id (latest wins — list is created_at desc)
  const requestByCoach = useMemo(() => {
    const m = {}
    for (const r of [...myCoachRequests].reverse()) m[r.coach_id] = r
    return m
  }, [myCoachRequests])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return coachDirectory
    return coachDirectory.filter((c) =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.specialties || '').toLowerCase().includes(q) ||
      (c.bio || '').toLowerCase().includes(q))
  }, [coachDirectory, query])

  const handleRequest = async (coach) => {
    setBusyId(coach.id); setError('')
    const res = await requestCoach(coach.id)
    setBusyId(null)
    if (!res.ok) setError(res.error || 'Could not send the request.')
    else successHaptic()
  }

  const handleUseCode = async (coach, code) => {
    setBusyId(coach.id); setError('')
    const res = await submitCoachCode(code)
    setBusyId(null)
    if (!res.ok) setError(res.error || 'Could not link with that code.')
    else { successHaptic(); setLinked(res.coachName || coach.name) }
  }

  /* Linked — success state, then back to profile */
  if (linked) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg px-6 anim-fade-in">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 anim-pop"
          style={{ background: 'color-mix(in srgb, var(--color-accent) 14%, transparent)' }}>
          <Check size={28} style={{ color: 'var(--color-accent)' }} />
        </div>
        <h2 className="font-display font-black text-2xl tracking-widest text-cream text-center">LINKED!</h2>
        <p className="font-mono text-xs text-muted mt-2 text-center max-w-xs leading-relaxed">
          You're connected to <span className="text-cream">{linked}</span> — every Pro feature
          is now unlocked while you're linked.
        </p>
        <button
          onClick={onClose}
          className="mt-6 btn-accent text-bg font-display font-bold text-sm tracking-widest px-8 py-3 rounded-xl"
        >
          DONE
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg anim-page-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-mobile-header pb-4 border-b border-border glass-panel accent-line flex-shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-cream hover:bg-surface transition-colors flex-shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-black text-xl tracking-wide text-cream">FIND A COACH</h2>
          <p className="font-mono text-xs text-muted">Registered coaches on MacroStack</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-border flex-shrink-0">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or specialty…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 font-mono text-sm text-cream placeholder:text-dim focus:outline-none focus:border-brown transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Payments are between coach and client */}
        <p className="font-mono text-[10px] text-dim leading-relaxed px-1">
          Coaching rates and payment are arranged directly between you and your coach —
          MacroStack doesn't broker or guarantee coaching fees.
        </p>

        {error && (
          <p className="font-mono text-xs text-red-400 anim-shake px-1">{error}</p>
        )}

        {coachDirectory.length === 0 && (
          <div className="text-center py-16">
            <Loader2 size={18} className="animate-spin mx-auto text-muted" />
          </div>
        )}

        {filtered.map((coach) => {
          const req  = requestByCoach[coach.id]
          const busy = busyId === coach.id
          const specialties = (coach.specialties || '').split(',').map((s) => s.trim()).filter(Boolean)

          return (
            <div key={coach.id} className="glass-card border border-border rounded-2xl p-4 card-dim">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display font-bold text-base tracking-wide text-cream truncate">{coach.name}</p>
                  <p className="font-mono text-[10px] text-muted mt-0.5 flex items-center gap-1.5">
                    <Users size={11} />
                    {Number(coach.client_count) === 1 ? '1 active client' : `${coach.client_count} active clients`}
                  </p>
                </div>
              </div>

              {specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {specialties.slice(0, 4).map((s) => (
                    <span key={s} className="font-mono text-[9px] tracking-[0.14em] uppercase px-2 py-1 rounded-full"
                      style={{ background: 'color-mix(in srgb, var(--color-accent) 14%, transparent)', color: 'var(--color-accent)' }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {coach.bio && (
                <p className="font-mono text-xs text-muted leading-relaxed mt-2.5 line-clamp-3">{coach.bio}</p>
              )}

              {coach.credentials && (
                <p className="font-mono text-[10px] text-dim mt-2 flex items-center gap-1.5">
                  <Award size={11} className="flex-shrink-0" />
                  <span className="truncate">{coach.credentials}</span>
                </p>
              )}

              {/* Action — depends on my request state for this coach */}
              <div className="mt-3.5">
                {req?.status === 'pending' ? (
                  <div className="w-full flex items-center justify-center gap-2 border border-border rounded-xl py-3 font-display font-bold text-xs tracking-widest text-muted">
                    <Check size={13} /> REQUEST SENT — WAITING ON COACH
                  </div>
                ) : req?.status === 'code_sent' && req.coach_code ? (
                  <button
                    onClick={() => handleUseCode(coach, req.coach_code)}
                    disabled={busy}
                    className="w-full flex items-center justify-center gap-2 btn-accent text-bg font-display font-bold text-xs tracking-widest py-3 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    COACH SENT A CODE — TAP TO LINK
                  </button>
                ) : req?.status === 'rejected' ? (
                  <div className="w-full flex items-center justify-center border border-border rounded-xl py-3 font-display font-bold text-xs tracking-widest text-dim">
                    NOT ACCEPTING NEW CLIENTS
                  </div>
                ) : (
                  <button
                    onClick={() => handleRequest(coach)}
                    disabled={busy}
                    className="w-full flex items-center justify-center gap-2 border rounded-xl py-3 font-display font-bold text-xs tracking-widest transition-colors press disabled:opacity-50"
                    style={{
                      borderColor: 'color-mix(in srgb, var(--color-accent) 40%, transparent)',
                      background:  'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    REQUEST CONNECTION
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {coachDirectory.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="font-display text-lg tracking-widest text-muted">NO COACHES FOUND</p>
            <p className="font-mono text-xs text-dim mt-2">Try a different search</p>
          </div>
        )}
      </div>
    </div>
  )
}
