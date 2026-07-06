import { useState, useEffect, useMemo } from 'react'
import {
  Search, Shield, ChevronDown, Mail, Phone, CreditCard, CalendarClock,
  Users, Unlock, Lock, RotateCcw,
} from 'lucide-react'
import useStore from '../../store'
import useIsSuperadmin from '../../hooks/useIsSuperadmin'
import ScrambleText from '../../components/ScrambleText'
import { computeSubscriptionAccess } from '../../store'

const accentA = (pct) => `color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`

function acctAccess(a) {
  if (!a) return false
  return computeSubscriptionAccess({ role: a.role, admin_override: a.admin_override, subscription_status: a.subscription_status })
}
function fmtDate(ts) {
  if (!ts) return null
  try { const d = new Date(ts); return isNaN(d.getTime()) ? null : d.toLocaleDateString() } catch { return null }
}
function statusLabel(a) {
  if (!a) return 'No account yet'
  if (a.admin_override === 'unlocked') return 'Unlocked by admin'
  if (a.admin_override === 'locked')   return 'Locked by admin'
  return a.subscription_status || 'inactive'
}

function AccessControls({ a, busy, onSet, compact = false }) {
  const override = a.admin_override
  const size = compact ? 'text-[9px] px-2.5 py-1.5' : 'text-[10px] px-3 py-2'
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button onClick={() => onSet(a.id, 'unlocked')} disabled={busy || override === 'unlocked'}
        className={`flex items-center gap-1.5 rounded-lg border font-display font-bold tracking-widest transition-colors disabled:opacity-40 ${size}`}
        style={override === 'unlocked'
          ? { background: accentA(16), color: 'var(--color-accent)', borderColor: accentA(35) }
          : { borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
        <Unlock size={12} /> GRANT
      </button>
      <button onClick={() => onSet(a.id, 'locked')} disabled={busy || override === 'locked'}
        className={`flex items-center gap-1.5 rounded-lg border font-display font-bold tracking-widest transition-colors disabled:opacity-40 ${size} ${
          override === 'locked' ? 'bg-red-400/15 border-red-400/30 text-red-400' : 'border-border text-muted hover:text-red-400 hover:border-red-400/40'
        }`}>
        <Lock size={12} /> LOCK
      </button>
      <button onClick={() => onSet(a.id, null)} disabled={busy || !override}
        className={`flex items-center gap-1.5 rounded-lg border border-border text-muted hover:text-cream hover:border-muted font-display font-bold tracking-widest transition-colors disabled:opacity-30 ${size}`}>
        <RotateCcw size={11} /> CLEAR
      </button>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={13} className="text-dim flex-shrink-0" />
      <span className="font-mono text-[10px] tracking-widest text-dim w-24 flex-shrink-0">{label}</span>
      <span className="font-mono text-xs text-cream truncate">{value || '—'}</span>
    </div>
  )
}

export default function AdminCoaches() {
  const {
    adminAccounts, adminAccountsError, adminAccountsLoaded,
    loadAdminAccounts, setSubscriptionOverride, clients,
  } = useStore()
  const isSuperadmin = useIsSuperadmin()
  const [search, setSearch]         = useState('')
  const [busyId, setBusyId]         = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => { loadAdminAccounts() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const accountById = useMemo(() => {
    const m = {}; adminAccounts.forEach((a) => { m[a.id] = a }); return m
  }, [adminAccounts])

  const clientsByCoach = useMemo(() => {
    const m = {}
    ;(clients || []).forEach((c) => { const k = c.coachId || 'none'; (m[k] ||= []).push(c) })
    return m
  }, [clients])

  const coaches = useMemo(() => {
    const q = search.trim().toLowerCase()
    return adminAccounts
      .filter((a) => a.role === 'coach' || a.role === 'superadmin')
      .filter((a) => !q || `${a.name} ${a.email || ''}`.toLowerCase().includes(q))
  }, [adminAccounts, search])

  const handleSet = async (id, value) => {
    setBusyId(id)
    await setSubscriptionOverride(id, value)
    await loadAdminAccounts()
    setBusyId(null)
  }

  if (!isSuperadmin) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center text-center px-6 anim-fade-in">
        <Shield size={36} className="text-dim mb-4" />
        <p className="font-display font-bold text-xl text-muted tracking-widest">SUPERADMIN ONLY</p>
        <p className="font-mono text-xs text-dim mt-2">This panel is restricted.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header — locked */}
      <div className="relative px-5 md:px-8 pt-mobile-header md:pt-7 pb-5 border-b border-border flex-shrink-0 anim-fade-in-down glass-panel accent-line">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-5 h-px flex-shrink-0" style={{ background: accentA(50) }} />
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted">SUPERADMIN</p>
            </div>
            <h2 className="font-display font-black text-4xl tracking-wide text-cream leading-none">
              <ScrambleText text="COACHES" duration={700} />
            </h2>
          </div>
          {/* Pulse stats */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="font-display font-black text-2xl leading-none" style={{ color: 'var(--color-accent)' }}>
                {coaches.filter(acctAccess).length}
                <span className="text-muted text-lg">/{coaches.length}</span>
              </p>
              <p className="font-mono text-[9px] tracking-[0.2em] text-muted mt-1">ACTIVE ACCESS</p>
            </div>
            <div className="text-right">
              <p className="font-display font-black text-2xl leading-none text-cream">
                {(clients || []).filter((c) => c.status !== 'archived').length}
              </p>
              <p className="font-mono text-[9px] tracking-[0.2em] text-muted mt-1">TOTAL USERS</p>
            </div>
          </div>
        </div>
        <div className="relative mt-5 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input type="text" placeholder="Search coaches…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-8 pr-3 py-2 font-mono text-xs text-cream placeholder:text-dim focus:outline-none focus:border-brown transition-colors" />
        </div>
      </div>

      {/* Coach cards */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 md:p-6 max-w-4xl mx-auto w-full space-y-2.5">
        {adminAccountsError ? (
          <div className="flex flex-col items-center justify-center h-48 anim-fade-in text-center px-6">
            <p className="font-display font-bold text-lg text-red-400 tracking-widest">COULDN'T LOAD COACHES</p>
            <p className="font-mono text-xs text-dim mt-2 max-w-sm break-words">{adminAccountsError}</p>
            <button onClick={loadAdminAccounts} className="mt-5 px-4 py-2 rounded-lg border border-border text-cream font-display font-bold text-xs tracking-widest hover:border-muted transition-colors">RETRY</button>
          </div>
        ) : !adminAccountsLoaded ? (
          <div className="flex flex-col items-center justify-center h-48 anim-fade-in">
            <div className="w-8 h-8 border-2 border-brown border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-xs text-dim mt-4 tracking-widest">LOADING COACHES…</p>
          </div>
        ) : coaches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 anim-fade-in">
            <p className="font-display font-bold text-lg text-muted tracking-widest">NO COACHES</p>
            <p className="font-mono text-xs text-dim mt-2">Coach accounts will appear here</p>
          </div>
        ) : (
          coaches.map((coach, i) => {
            const expanded = expandedId === coach.id
            const roster   = clientsByCoach[coach.id] || []
            const busy     = busyId === coach.id
            const access   = acctAccess(coach)
            return (
              <div key={coach.id} style={{ animationDelay: `${Math.min(i, 16) * 25}ms` }}
                className="anim-fade-in-up glass-card border border-border rounded-2xl card-dim overflow-hidden">
                {/* Header — minimize/maximize */}
                <button onClick={() => setExpandedId(expanded ? null : coach.id)} className="w-full px-5 py-4 flex items-center gap-4 text-left">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${accentA(28)}, ${accentA(10)})`, border: `1px solid ${accentA(32)}` }}>
                    <span className="font-display font-black text-sm" style={{ color: 'var(--color-accent)' }}>
                      {(coach.name || 'C').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-display font-bold text-sm text-cream truncate">{coach.name || 'Unnamed'}</p>
                      <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ color: 'var(--color-accent)', background: accentA(10), border: `1px solid ${accentA(25)}` }}>
                        {coach.role.toUpperCase()}
                      </span>
                      <span className="font-mono text-[8px] tracking-widest text-dim flex-shrink-0">
                        · {roster.length} {roster.length === 1 ? 'user' : 'users'}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-muted truncate">{coach.email}</p>
                  </div>
                  <ChevronDown size={16} className="text-dim flex-shrink-0 transition-transform" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />
                </button>

                {expanded && (
                  <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-5 anim-fade-in">
                    {/* Coach contact + billing */}
                    <div className="space-y-2">
                      <p className="font-mono text-[9px] tracking-[0.3em]" style={{ color: accentA(70) }}>COACH INFO</p>
                      <InfoRow icon={Mail} label="EMAIL" value={coach.email} />
                      <InfoRow icon={CreditCard} label="STATUS" value={statusLabel(coach)} />
                      {coach.subscription_plan && <InfoRow icon={CreditCard} label="PLAN" value={coach.subscription_plan.toUpperCase()} />}
                      {fmtDate(coach.current_period_end) && <InfoRow icon={CalendarClock} label="RENEWS" value={fmtDate(coach.current_period_end)} />}
                      <InfoRow icon={Shield} label="ACCESS" value={access ? 'Active' : 'No access'} />
                    </div>
                    <div className="space-y-2">
                      <p className="font-mono text-[9px] tracking-[0.3em]" style={{ color: accentA(70) }}>MANAGE ACCESS</p>
                      <AccessControls a={coach} busy={busy} onSet={handleSet} />
                    </div>

                    {/* Clientele */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Users size={12} style={{ color: 'var(--color-accent)' }} />
                        <p className="font-mono text-[9px] tracking-[0.3em]" style={{ color: accentA(70) }}>CLIENTELE ({roster.length})</p>
                      </div>
                      {roster.length === 0 ? (
                        <p className="font-mono text-xs text-dim">No users linked to this coach.</p>
                      ) : (
                        <div className="space-y-2">
                          {roster.map((c) => {
                            const acct = c.profileId ? accountById[c.profileId] : null
                            const cAccess = acctAccess(acct)
                            const cBusy = acct && busyId === acct.id
                            return (
                              <div key={c.id} className="rounded-xl border border-border bg-surface/40 px-4 py-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-display font-bold text-xs text-cream truncate">{c.name || 'Unnamed'}</p>
                                  {!acct ? (
                                    <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5 rounded text-brown-light bg-brown/10 border border-brown/25">PENDING</span>
                                  ) : (
                                    <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5 rounded"
                                      style={{ color: cAccess ? 'var(--color-accent)' : 'var(--color-dim)', background: cAccess ? accentA(10) : 'transparent', border: `1px solid ${cAccess ? accentA(25) : 'var(--color-border)'}` }}>
                                      {cAccess ? 'ACTIVE' : 'NO ACCESS'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="font-mono text-[10px] text-muted truncate">{c.email || 'No email'}</span>
                                  {c.phone && <span className="font-mono text-[10px] text-dim truncate flex items-center gap-1"><Phone size={9} />{c.phone}</span>}
                                </div>
                                {acct && <div className="mt-2.5"><AccessControls a={acct} busy={cBusy} onSet={handleSet} compact /></div>}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
        </div>
      </div>
    </div>
  )
}
