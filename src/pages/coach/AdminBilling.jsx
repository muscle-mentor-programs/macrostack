import { useState, useEffect, useMemo } from 'react'
import {
  Lock, Unlock, RotateCcw, Search, Shield, ChevronDown,
  Mail, Phone, CalendarClock, CreditCard, Users, Trash2,
} from 'lucide-react'
import useStore from '../../store'
import useIsSuperadmin from '../../hooks/useIsSuperadmin'
import ScrambleText from '../../components/ScrambleText'
import { computeSubscriptionAccess } from '../../store'

const accentA = (pct) => `color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`

// Effective access for an admin-list row (mirrors store's computeSubscriptionAccess)
function rowAccess(a) {
  return computeSubscriptionAccess({
    role: a.role,
    admin_override: a.admin_override,
    subscription_status: a.subscription_status,
  })
}

function fmtDate(ts) {
  if (!ts) return null
  try { const d = new Date(ts); return isNaN(d.getTime()) ? null : d.toLocaleDateString() }
  catch { return null }
}

function statusLabel(a) {
  if (a.pending) return 'Invite pending'
  if (a.admin_override === 'unlocked') return 'Unlocked by admin'
  if (a.admin_override === 'locked')   return 'Locked by admin'
  return a.subscription_status || 'inactive'
}

const FILTERS = [
  { id: 'all',     label: 'ALL'     },
  { id: 'coach',   label: 'COACHES' },
  { id: 'client',  label: 'USERS'   },
  { id: 'locked',  label: 'LOCKED'  },
]

// ── Access controls (grant / lock / clear) ──────────────────────────────────
function AccessControls({ a, busy, onSet, compact = false }) {
  const override = a.admin_override
  const size = compact ? 'text-[9px] px-2.5 py-1.5' : 'text-[10px] px-3 py-2'
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        onClick={() => onSet(a.id, 'unlocked')}
        disabled={busy || override === 'unlocked'}
        className={`flex items-center gap-1.5 rounded-lg border font-display font-bold tracking-widest transition-colors disabled:opacity-40 ${size}`}
        style={override === 'unlocked'
          ? { background: accentA(16), color: 'var(--color-accent)', borderColor: accentA(35) }
          : { borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
      >
        <Unlock size={12} /> GRANT
      </button>
      <button
        onClick={() => onSet(a.id, 'locked')}
        disabled={busy || override === 'locked'}
        className={`flex items-center gap-1.5 rounded-lg border font-display font-bold tracking-widest transition-colors disabled:opacity-40 ${size} ${
          override === 'locked'
            ? 'bg-red-400/15 border-red-400/30 text-red-400'
            : 'border-border text-muted hover:text-red-400 hover:border-red-400/40'
        }`}
      >
        <Lock size={12} /> LOCK
      </button>
      <button
        onClick={() => onSet(a.id, null)}
        disabled={busy || !override}
        className={`flex items-center gap-1.5 rounded-lg border border-border text-muted hover:text-cream hover:border-muted font-display font-bold tracking-widest transition-colors disabled:opacity-30 ${size}`}
      >
        <RotateCcw size={11} /> CLEAR
      </button>
    </div>
  )
}

// ── One info line ────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={13} className="text-dim flex-shrink-0" />
      <span className="font-mono text-[10px] tracking-widest text-dim w-24 flex-shrink-0">{label}</span>
      <span className="font-mono text-xs text-cream truncate">{value || '—'}</span>
    </div>
  )
}

/* Delete a user's LOGIN (data survives; they must recreate the account).
   Two-step confirm so it can't be fat-fingered. */
function DeleteLoginControl({ account }) {
  const { adminDeleteUser, currentUser } = useStore()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy]             = useState(false)
  const [error, setError]           = useState('')

  if (account.id === currentUser?.id) return null // never your own login

  const handleDelete = async () => {
    setBusy(true); setError('')
    const res = await adminDeleteUser(account.id)
    setBusy(false)
    if (!res.ok) setError(res.error)
    // success → the account disappears from the list via the store
  }

  return (
    <div className="pt-3 mt-1 border-t border-border/50 space-y-2">
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="flex items-center gap-2 font-display font-bold text-[10px] tracking-widest text-dim hover:text-red-400 transition-colors"
        >
          <Trash2 size={11} />
          DELETE LOGIN
        </button>
      ) : (
        <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-3 space-y-2.5">
          <p className="font-mono text-[10px] text-red-400 leading-relaxed">
            Removes {account.name || 'this user'}'s login — they'll need to create a new account.
            All their data (logs, check-ins, photos) is kept and re-links automatically if they
            sign up again with the same email.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={busy}
              className="flex-1 bg-red-400/15 border border-red-400/40 text-red-400 font-display font-bold text-[10px] tracking-widest py-2 rounded-lg hover:bg-red-400/25 transition-colors disabled:opacity-50"
            >
              {busy ? 'DELETING…' : 'YES, DELETE LOGIN'}
            </button>
            <button
              onClick={() => { setConfirming(false); setError('') }}
              className="flex-1 border border-border text-muted hover:text-cream font-display font-bold text-[10px] tracking-widest py-2 rounded-lg transition-colors"
            >
              CANCEL
            </button>
          </div>
          {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}
        </div>
      )}
    </div>
  )
}

export default function AdminBilling() {
  const {
    adminAccounts, adminAccountsError, adminAccountsLoaded,
    loadAdminAccounts, setSubscriptionOverride, clients,
  } = useStore()
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState('all')
  const [busyId, setBusyId]         = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const isSuperadmin = useIsSuperadmin()

  useEffect(() => { loadAdminAccounts() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Client records by matching key, for contact info + coach clientele
  const clientByEmail = useMemo(() => {
    const m = {}
    ;(clients || []).forEach((c) => { if (c.email) m[c.email.toLowerCase()] = c })
    return m
  }, [clients])

  const accountById = useMemo(() => {
    const m = {}
    adminAccounts.forEach((a) => { m[a.id] = a })
    return m
  }, [adminAccounts])

  const clientsByCoach = useMemo(() => {
    const m = {}
    ;(clients || []).forEach((c) => { const k = c.coachId || 'none'; (m[k] ||= []).push(c) })
    return m
  }, [clients])

  // Invited users without an account yet — no profile, so no real billing row.
  const pendingRows = useMemo(() => {
    const accountEmails = new Set(adminAccounts.map((a) => (a.email || '').toLowerCase()))
    return (clients || [])
      .filter((c) => !c.profileId && c.email && !accountEmails.has(c.email.toLowerCase()))
      .map((c) => ({
        id: c.id, name: c.name, email: c.email, role: 'client',
        pending: true, admin_override: null, subscription_status: 'pending',
      }))
  }, [clients, adminAccounts])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...adminAccounts, ...pendingRows].filter((a) => {
      if (q && !`${a.name} ${a.email || ''}`.toLowerCase().includes(q)) return false
      if (filter === 'coach')  return a.role === 'coach' || a.role === 'superadmin'
      if (filter === 'client') return a.role === 'client'
      if (filter === 'locked') return !a.pending && !rowAccess(a)
      return true
    })
  }, [adminAccounts, pendingRows, search, filter])

  const handleSet = async (id, value) => {
    setBusyId(id)
    await setSubscriptionOverride(id, value)
    await loadAdminAccounts()
    setBusyId(null)
  }

  if (!isSuperadmin) {
    return (
      <div className="app-page-gutter min-h-full flex flex-col items-center justify-center text-center px-6 anim-fade-in">
        <Shield size={36} className="text-dim mb-4" />
        <p className="font-display font-bold text-xl text-muted tracking-widest">SUPERADMIN ONLY</p>
        <p className="font-mono text-xs text-dim mt-2">This panel is restricted.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header — locked */}
      <div className="app-page-gutter relative px-6 md:px-8 pt-mobile-header md:pt-7 pb-5 border-b border-border flex-shrink-0 anim-fade-in-down glass-panel accent-line">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-5 h-px flex-shrink-0" style={{ background: accentA(50) }} />
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted">SUPERADMIN</p>
        </div>
        <h2 className="font-display font-black text-4xl tracking-wide text-cream leading-none">
          <ScrambleText text="BILLING" duration={700} />
        </h2>

        {/* Search + filters */}
        <div className="flex items-center gap-3 mt-5 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search accounts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl pl-8 pr-3 py-2 font-mono text-xs text-cream placeholder:text-dim focus:outline-none focus:border-brown transition-colors"
            />
          </div>
          <div className="flex gap-1.5">
            {FILTERS.map((fl) => (
              <button
                key={fl.id}
                onClick={() => setFilter(fl.id)}
                className={`px-3 py-2 rounded-xl font-display font-bold text-[10px] tracking-widest transition-all border ${
                  filter === fl.id ? 'text-bg border-transparent' : 'text-muted border-border hover:text-cream hover:border-muted'
                }`}
                style={filter === fl.id ? { background: 'var(--color-accent)', color: '#fff' } : undefined}
              >
                {fl.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Account cards */}
      <div className="flex-1 overflow-y-auto">
        <div className="app-page-gutter p-5 md:p-6 max-w-4xl mx-auto w-full space-y-2.5">
        {adminAccountsError ? (
          <div className="flex flex-col items-center justify-center h-48 anim-fade-in text-center px-6">
            <p className="font-display font-bold text-lg text-red-400 tracking-widest">COULDN'T LOAD ACCOUNTS</p>
            <p className="font-mono text-xs text-dim mt-2 max-w-sm break-words">{adminAccountsError}</p>
            <button onClick={loadAdminAccounts}
              className="mt-5 px-4 py-2 rounded-lg border border-border text-cream font-display font-bold text-xs tracking-widest hover:border-muted transition-colors">
              RETRY
            </button>
          </div>
        ) : !adminAccountsLoaded ? (
          <div className="flex flex-col items-center justify-center h-48 anim-fade-in">
            <div className="w-8 h-8 border-2 border-brown border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-xs text-dim mt-4 tracking-widest">LOADING ACCOUNTS…</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 anim-fade-in">
            <p className="font-display font-bold text-lg text-muted tracking-widest">NO ACCOUNTS</p>
            <p className="font-mono text-xs text-dim mt-2">
              {adminAccounts.length === 0 ? 'No accounts returned' : 'Try a different search or filter'}
            </p>
          </div>
        ) : (
          visible.map((a, i) => {
            const pending   = a.pending
            const access    = rowAccess(a)
            const busy      = busyId === a.id
            const expanded  = expandedId === a.id
            const isCoach   = a.role === 'coach' || a.role === 'superadmin'
            const clientRec = a.email ? clientByEmail[a.email.toLowerCase()] : null
            const roster    = isCoach ? (clientsByCoach[a.id] || []) : []

            return (
              <div
                key={a.id}
                style={{ animationDelay: `${Math.min(i, 16) * 25}ms` }}
                className={`anim-fade-in-up glass-card border rounded-2xl card-dim overflow-hidden ${pending ? 'border-brown/25' : 'border-border'}`}
              >
                {/* Header row — click to minimize/maximize */}
                <button
                  onClick={() => setExpandedId(expanded ? null : a.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left"
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: pending ? 'var(--color-brown)' : access ? 'var(--color-accent)' : 'var(--color-dim)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-display font-bold text-sm text-cream truncate">{a.name || 'Unnamed'}</p>
                      {/* Account-type tag: ADMIN (red) / COACH (blue) /
                          CLIENT = user linked to a coach (green) /
                          USER = solo tracker, no coach (gray) */}
                      {(() => {
                        const tag =
                          a.role === 'superadmin' ? { t: 'ADMIN',  c: '#f87171',            bg: 'rgba(248,113,113,.12)', bd: 'rgba(248,113,113,.35)' } :
                          a.role === 'coach'      ? { t: 'COACH',  c: 'var(--color-accent)', bg: accentA(10),             bd: accentA(30) } :
                          clientRec?.coachId      ? { t: 'CLIENT', c: '#7DBF8E',            bg: 'rgba(125,191,142,.12)', bd: 'rgba(125,191,142,.35)' } :
                                                    { t: 'USER',   c: 'var(--color-muted)',  bg: 'rgba(127,127,127,.10)', bd: 'var(--color-border)' }
                        return (
                          <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ color: tag.c, background: tag.bg, border: `1px solid ${tag.bd}` }}>
                            {tag.t}
                          </span>
                        )
                      })()}
                      {pending && (
                        <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5 rounded flex-shrink-0 text-brown-light bg-brown/10 border border-brown/25">
                          PENDING
                        </span>
                      )}
                      {isCoach && roster.length > 0 && (
                        <span className="font-mono text-[8px] tracking-widest text-dim flex-shrink-0">
                          · {roster.length} {roster.length === 1 ? 'user' : 'users'}
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[11px] text-muted truncate">{a.email}</p>
                  </div>
                  <span className="font-mono text-[10px] text-dim tracking-widest hidden sm:block flex-shrink-0">
                    {statusLabel(a)}
                  </span>
                  <ChevronDown
                    size={16}
                    className="text-dim flex-shrink-0 transition-transform"
                    style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
                  />
                </button>

                {/* Expanded detail */}
                {expanded && (
                  <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-5 anim-fade-in">
                    {/* Contact */}
                    <div className="space-y-2">
                      <p className="font-mono text-[9px] tracking-[0.3em]" style={{ color: accentA(70) }}>CONTACT</p>
                      <InfoRow icon={Mail}  label="EMAIL" value={a.email} />
                      {clientRec?.phone && <InfoRow icon={Phone} label="PHONE" value={clientRec.phone} />}
                    </div>

                    {/* Billing */}
                    <div className="space-y-2">
                      <p className="font-mono text-[9px] tracking-[0.3em]" style={{ color: accentA(70) }}>BILLING</p>
                      <InfoRow icon={CreditCard}   label="STATUS" value={statusLabel(a)} />
                      {!pending && <InfoRow icon={CreditCard} label="PLAN" value={a.subscription_plan ? a.subscription_plan.toUpperCase() : 'None'} />}
                      {!pending && fmtDate(a.current_period_end) && (
                        <InfoRow icon={CalendarClock} label="RENEWS" value={fmtDate(a.current_period_end)} />
                      )}
                      <InfoRow icon={Shield} label="ACCESS" value={pending ? 'No account yet' : access ? 'Active' : 'No access'} />
                    </div>

                    {/* Controls */}
                    {pending ? (
                      <p className="font-mono text-[10px] text-dim tracking-widest">AWAITING SIGN-UP — nothing to manage until they create an account.</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="font-mono text-[9px] tracking-[0.3em]" style={{ color: accentA(70) }}>MANAGE ACCESS</p>
                        <AccessControls a={a} busy={busy} onSet={handleSet} />
                        <DeleteLoginControl account={a} />
                      </div>
                    )}

                    {/* Coach's clientele */}
                    {isCoach && (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <Users size={12} style={{ color: 'var(--color-accent)' }} />
                          <p className="font-mono text-[9px] tracking-[0.3em]" style={{ color: accentA(70) }}>
                            CLIENTELE ({roster.length})
                          </p>
                        </div>
                        {roster.length === 0 ? (
                          <p className="font-mono text-xs text-dim">No users linked to this coach.</p>
                        ) : (
                          <div className="space-y-2">
                            {roster.map((c) => {
                              const acct = c.profileId ? accountById[c.profileId] : null
                              const cAccess = acct ? rowAccess(acct) : false
                              const cBusy = acct && busyId === acct.id
                              return (
                                <div key={c.id} className="rounded-xl border border-border bg-surface/40 px-4 py-3">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-display font-bold text-xs text-cream truncate">{c.name || 'Unnamed'}</p>
                                    {!acct && (
                                      <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5 rounded text-brown-light bg-brown/10 border border-brown/25">PENDING</span>
                                    )}
                                    {acct && (
                                      <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5 rounded"
                                        style={{ color: cAccess ? 'var(--color-accent)' : 'var(--color-dim)', background: cAccess ? accentA(10) : 'transparent', border: `1px solid ${cAccess ? accentA(25) : 'var(--color-border)'}` }}>
                                        {cAccess ? 'ACTIVE' : 'NO ACCESS'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="font-mono text-[10px] text-muted truncate">{c.email || 'No email'}</span>
                                    {c.phone && <span className="font-mono text-[10px] text-dim truncate">{c.phone}</span>}
                                  </div>
                                  {acct && (
                                    <div className="mt-2.5">
                                      <AccessControls a={acct} busy={cBusy} onSet={handleSet} compact />
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
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
