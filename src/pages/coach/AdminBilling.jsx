import { useState, useEffect, useMemo } from 'react'
import { Lock, Unlock, RotateCcw, Search, Shield } from 'lucide-react'
import useStore from '../../store'
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

const FILTERS = [
  { id: 'all',     label: 'ALL'         },
  { id: 'coach',   label: 'COACHES'     },
  { id: 'client',  label: 'USERS'       },
  { id: 'locked',  label: 'LOCKED'      },
]

export default function AdminBilling() {
  const { adminAccounts, adminAccountsError, adminAccountsLoaded, loadAdminAccounts, setSubscriptionOverride, currentUser, clients } = useStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => { loadAdminAccounts() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isSuperadmin = currentUser?.role === 'superadmin'

  // Invited users who haven't created an account yet have no profile — and so no
  // billing row. Surface them (read-only) so the full roster shows here; they
  // become real, unlockable accounts the moment they accept the invite.
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
      <div className="min-h-full flex flex-col items-center justify-center text-center px-6 anim-fade-in">
        <Shield size={36} className="text-dim mb-4" />
        <p className="font-display font-bold text-xl text-muted tracking-widest">SUPERADMIN ONLY</p>
        <p className="font-mono text-xs text-dim mt-2">This panel is restricted.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="relative px-6 md:px-8 pt-mobile-header md:pt-7 pb-5 border-b border-border flex-shrink-0 anim-fade-in-down glass-panel accent-line">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-5 h-px flex-shrink-0" style={{ background: accentA(50) }} />
          <p className="font-mono text-[10px] tracking-[0.22em] text-muted">SUPERADMIN</p>
        </div>
        <h2 className="font-display font-black text-4xl tracking-wider text-cream leading-none">
          <ScrambleText text="BILLING" duration={700} />
        </h2>

        {/* Search + filters */}
        <div className="flex items-center gap-3 mt-5">
          <div className="relative flex-1 max-w-xs">
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
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-2 rounded-xl font-display font-bold text-[10px] tracking-widest transition-all border ${
                  filter === f.id ? 'text-bg border-transparent' : 'text-muted border-border hover:text-cream hover:border-muted'
                }`}
                style={filter === f.id ? { background: 'var(--color-accent)', color: '#fff' } : undefined}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Account rows */}
      <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
        {adminAccountsError ? (
          <div className="flex flex-col items-center justify-center h-48 anim-fade-in text-center px-6">
            <p className="font-display font-bold text-lg text-red-400 tracking-widest">COULDN'T LOAD ACCOUNTS</p>
            <p className="font-mono text-xs text-dim mt-2 max-w-sm break-words">{adminAccountsError}</p>
            <button
              onClick={loadAdminAccounts}
              className="mt-5 px-4 py-2 rounded-lg border border-border text-cream font-display font-bold text-xs tracking-widest hover:border-muted transition-colors"
            >
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
            const pending  = a.pending
            const access   = rowAccess(a)
            const override = a.admin_override
            const busy     = busyId === a.id
            return (
              <div
                key={a.id}
                style={{ animationDelay: `${i * 25}ms` }}
                className={`anim-fade-in-up glass-card border rounded-2xl px-5 py-4 flex items-center gap-4 card-dim ${pending ? 'border-brown/25 opacity-80' : 'border-border'}`}
              >
                {/* Access dot */}
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: pending ? 'var(--color-brown)' : access ? 'var(--color-accent)' : 'var(--color-dim)' }}
                  title={pending ? 'Invite pending' : access ? 'Has access' : 'No access'} />

                {/* Identity */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display font-bold text-sm text-cream truncate">{a.name || 'Unnamed'}</p>
                    <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ color: 'var(--color-accent)', background: accentA(10), border: `1px solid ${accentA(25)}` }}>
                      {a.role.toUpperCase()}
                    </span>
                    {pending && (
                      <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5 rounded flex-shrink-0 text-brown-light bg-brown/10 border border-brown/25">
                        PENDING
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-[11px] text-muted truncate">{a.email}</p>
                </div>

                {/* Status */}
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="font-mono text-[11px] text-cream">
                    {pending ? 'Invite pending'
                      : override ? (override === 'unlocked' ? 'Admin: unlocked' : 'Admin: locked')
                      : a.subscription_status}
                  </p>
                  <p className="font-mono text-[9px] text-dim tracking-widest">
                    {pending ? 'NO ACCOUNT YET' : a.subscription_plan ? a.subscription_plan.toUpperCase() : '—'}
                  </p>
                </div>

                {/* Controls — pending users have no account to override yet */}
                {pending ? (
                  <span className="flex-shrink-0 font-mono text-[9px] text-dim tracking-widest hidden sm:block">
                    AWAITING SIGN-UP
                  </span>
                ) : (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleSet(a.id, 'unlocked')}
                    disabled={busy || override === 'unlocked'}
                    title="Force unlock"
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors disabled:opacity-40 ${
                      override === 'unlocked'
                        ? 'border-transparent'
                        : 'border-border text-muted hover:text-cream hover:border-muted'
                    }`}
                    style={override === 'unlocked' ? { background: accentA(18), color: 'var(--color-accent)' } : undefined}
                  >
                    <Unlock size={13} />
                  </button>
                  <button
                    onClick={() => handleSet(a.id, 'locked')}
                    disabled={busy || override === 'locked'}
                    title="Force lock"
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors disabled:opacity-40 ${
                      override === 'locked'
                        ? 'bg-red-400/15 border-red-400/30 text-red-400'
                        : 'border-border text-muted hover:text-red-400 hover:border-red-400/40'
                    }`}
                  >
                    <Lock size={13} />
                  </button>
                  <button
                    onClick={() => handleSet(a.id, null)}
                    disabled={busy || !override}
                    title="Clear override (follow Stripe)"
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted hover:text-cream hover:border-muted transition-colors disabled:opacity-30"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
