import { useState } from 'react'
import { Bell, ClipboardCheck, ClipboardList, UserPlus, Gauge, BellRing, Check } from 'lucide-react'
import useStore from '../store'
import { computeGoalNudge } from '../lib/goalNudges'
import { enablePush, pushPermission } from '../lib/push'

/* ── Notification center ──────────────────────────────────────────────────────
   One inbox for everything unactioned: new check-ins, new form responses,
   pending client requests, and target-review nudges. Derived live from store
   data — items disappear as they're handled. */
export default function NotificationBell() {
  const {
    clients, coachRequests, setActivePage, setViewingClientId,
    registerPushSubscription,
  } = useStore()
  const [open, setOpen] = useState(false)
  const [pushState, setPushState] = useState(pushPermission())

  const active = clients.filter((c) => c.status !== 'archived')

  const items = []
  for (const c of active) {
    if (c.checkins?.[0] && !c.checkins[0].reviewed) {
      items.push({
        key: `ck-${c.id}`, Icon: ClipboardCheck,
        title: `${c.name} sent a check-in`,
        go: () => { setViewingClientId(c.id, 'checkin'); setActivePage('clients') },
      })
    }
    const newSubs = (c.submissions || []).filter((s) => !s.reviewed)
    if (newSubs.length) {
      items.push({
        key: `fm-${c.id}`, Icon: ClipboardList,
        title: `${c.name} — ${newSubs.length === 1 ? `${newSubs[0].formTitle || 'form'} response` : `${newSubs.length} form responses`}`,
        go: () => { setViewingClientId(c.id, 'forms'); setActivePage('clients') },
      })
    }
    const nudge = computeGoalNudge(c)
    if (nudge) {
      items.push({
        key: `ng-${c.id}`, Icon: Gauge,
        title: `${c.name} — ${nudge.title.toLowerCase()}, review targets`,
        go: () => { setViewingClientId(c.id, 'checkin'); setActivePage('clients') },
      })
    }
  }
  for (const r of coachRequests) {
    items.push({
      key: `rq-${r.id}`, Icon: UserPlus,
      title: `${r.client_name} requested to join`,
      go: () => setActivePage('dashboard'),
    })
  }

  const handleEnablePush = async () => {
    const res = await enablePush(registerPushSubscription)
    setPushState(res.ok ? 'granted' : pushPermission())
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
        className="relative w-10 h-10 flex items-center justify-center rounded-xl border border-border text-muted hover:text-cream hover:border-muted transition-colors"
      >
        <Bell size={16} />
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white"
            style={{ background: 'var(--color-accent)' }}>
            {items.length > 9 ? '9+' : items.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-[340px] max-w-[90vw] bg-card border border-border rounded-2xl shadow-2xl anim-fade-in-up overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="font-display font-bold text-xs tracking-widest text-cream">NOTIFICATIONS</p>
              <span className="font-mono text-[10px] text-muted">{items.length} open</span>
            </div>
            <div className="max-h-[50vh] overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Check size={18} className="text-olive-light mx-auto mb-2" />
                  <p className="font-mono text-xs text-muted">All caught up.</p>
                </div>
              ) : (
                items.map(({ key, Icon, title, go }) => (
                  <button
                    key={key}
                    onClick={() => { setOpen(false); go() }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-border/50 last:border-0 hover:bg-surface transition-colors"
                  >
                    <Icon size={14} className="flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
                    <span className="font-mono text-xs text-cream leading-snug">{title}</span>
                  </button>
                ))
              )}
            </div>
            {pushState !== 'granted' && pushState !== 'unsupported' && (
              <button
                onClick={handleEnablePush}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-t border-border font-display font-bold text-[10px] tracking-widest text-muted hover:text-cream transition-colors"
              >
                <BellRing size={12} />
                ENABLE PUSH NOTIFICATIONS
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
