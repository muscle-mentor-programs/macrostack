import { useState, useEffect } from 'react'
import { format, subDays } from 'date-fns'
import {
  Mail, Edit2, MessageCircle, BookOpen,
  Users, TrendingUp, Target, X, Send, CheckSquare, Square, ChevronRight,
  Copy, Check as CheckIcon, Bell,
} from 'lucide-react'
import useStore from '../../../store'
import ClientAvatar from '../../../components/ClientAvatar'
import AnimatedNumber from '../../../components/AnimatedNumber'
import ScrambleText from '../../../components/ScrambleText'

// ── Quick-edit goals bottom sheet ─────────────────────────────────────────────
function QuickEditSheet({ client, onClose }) {
  const { updateClientGoals } = useStore()
  const [goals, setGoals] = useState({ ...client.goals })

  const save = () => {
    updateClientGoals(client.id, {
      calories: Number(goals.calories),
      protein:  Number(goals.protein),
      carbs:    Number(goals.carbs),
      fat:      Number(goals.fat),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end anim-fade-in" onClick={onClose}>
      <div
        className="bg-card border-t border-border rounded-t-2xl p-6 space-y-5 shadow-2xl anim-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-black text-lg tracking-widest text-cream">EDIT TARGETS</h3>
            <p className="font-mono text-xs text-muted">{client.name}</p>
          </div>
          <button onClick={onClose} className="text-muted p-1"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'calories', label: 'CALORIES', color: 'text-cream'          },
            { key: 'protein',  label: 'PROTEIN',  color: 'text-olive-light'    },
            { key: 'carbs',    label: 'CARBS',    color: 'text-brown-light'    },
            { key: 'fat',      label: 'FAT',      color: 'text-slategray-light' },
          ].map(({ key, label, color }) => (
            <div key={key}>
              <label className={`font-display text-xs tracking-widest block mb-1.5 ${color}`}>{label}</label>
              <input
                type="number"
                value={goals[key]}
                onChange={(e) => setGoals((p) => ({ ...p, [key]: e.target.value }))}
                className="w-full bg-surface border border-border rounded-xl px-3 py-3 font-mono text-sm text-cream focus:outline-none focus:border-brown"
              />
            </div>
          ))}
        </div>
        <button
          onClick={save}
          className="w-full bg-brown hover:bg-brown-light text-bg font-display font-bold text-sm tracking-widest py-4 rounded-xl transition-colors"
        >
          SAVE TARGETS
        </button>
      </div>
    </div>
  )
}

// ── Email compose bottom sheet ────────────────────────────────────────────────
function EmailSheet({ clients, preselectedId, onClose }) {
  const [selected, setSelected] = useState(preselectedId ? [preselectedId] : [])
  const [subject,  setSubject]  = useState('')
  const [body,     setBody]     = useState('')

  const toggle = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const handleSend = () => {
    const addrs = clients
      .filter((c) => selected.includes(c.id) && c.email)
      .map((c) => c.email)
      .join(',')
    window.open(`mailto:${addrs}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
    onClose()
  }

  const hasEmails = clients.some((c) => selected.includes(c.id) && c.email)

  return (
    <div className="fixed inset-0 z-50 flex flex-col anim-fade-in bg-bg/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex-1 flex flex-col bg-card mt-16 rounded-t-2xl overflow-hidden anim-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-display font-black text-lg tracking-widest text-cream">COMPOSE EMAIL</h3>
          <button onClick={onClose} className="text-muted p-1"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Recipients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-display text-xs text-muted tracking-widest">TO</p>
              <div className="flex gap-3">
                <button onClick={() => setSelected(clients.map((c) => c.id))} className="font-display text-xs text-brown tracking-widest">ALL</button>
                <button onClick={() => setSelected([])} className="font-display text-xs text-muted tracking-widest">CLEAR</button>
              </div>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {clients.map((c) => {
                const on = selected.includes(c.id)
                return (
                  <button
                    key={c.id}
                    onClick={() => toggle(c.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-colors ${
                      on ? 'bg-brown/10 border-brown/40' : 'bg-surface border-border'
                    }`}
                  >
                    {on ? <CheckSquare size={16} className="text-brown flex-shrink-0" /> : <Square size={16} className="text-dim flex-shrink-0" />}
                    <div>
                      <p className="font-mono text-sm text-cream">{c.name}</p>
                      <p className="font-mono text-xs text-muted">{c.email || 'no email'}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="font-display text-xs text-muted tracking-widest block mb-1.5">SUBJECT</label>
            <input
              type="text" placeholder="Weekly check-in…" value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 font-mono text-sm text-cream placeholder-dim focus:outline-none focus:border-brown"
            />
          </div>

          <div>
            <label className="font-display text-xs text-muted tracking-widest block mb-1.5">MESSAGE</label>
            <textarea
              placeholder="Type your message…" value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 font-mono text-sm text-cream placeholder-dim focus:outline-none focus:border-brown resize-none"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border">
          <button
            onClick={handleSend}
            disabled={selected.length === 0 || !hasEmails}
            className="w-full flex items-center justify-center gap-2 bg-brown hover:bg-brown-light disabled:opacity-40 text-bg font-display font-bold text-sm tracking-widest py-4 rounded-xl transition-colors"
          >
            <Send size={15} />
            OPEN IN MAIL APP
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Compact client card ───────────────────────────────────────────────────────
function MobileClientCard({ client, delay, onEdit, onEmail, onChat, onMealPlans }) {
  const { getClientTotalsForDate, messages, setActivePage } = useStore()
  const today  = format(new Date(), 'yyyy-MM-dd')
  const totals = getClientTotalsForDate(client.id, today)

  const days7 = Array.from({ length: 7 }, (_, i) => {
    const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
    return (client.log?.[d] || []).length > 0
  })
  const compliance = Math.round((days7.filter(Boolean).length / 7) * 100)
  const calPct     = Math.min(Math.round((totals.calories / (client.goals.calories || 1)) * 100), 100)
  const activePlan = (client.mealPlans || []).find((p) => p.id === client.activeMealPlanId)
  const latestW    = (client.weightLog || []).slice(-1)[0]
  const unread     = (messages[client.id] || []).filter((m) => m.from === 'client' && !m.readByCoach).length

  const complianceColor =
    compliance >= 70 ? 'text-olive-light' :
    compliance >= 40 ? 'text-brown-light' :
    'text-red-400'

  return (
    <div
      className="bg-card border border-border rounded-2xl p-4 anim-fade-in-up card-dim"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <ClientAvatar name={client.name} avatarUrl={client.avatarUrl} className="w-10 h-10" textClassName="text-base" />
          <div className="min-w-0">
            <p className="font-display font-bold text-base text-cream truncate">{client.name}</p>
            <p className="font-mono text-xs text-muted truncate">{client.email || 'No email'}</p>
          </div>
        </div>
        {/* Action icons */}
        <div className="flex gap-0.5 flex-shrink-0">
          <button onClick={() => onMealPlans(client.id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-dim hover:text-brown-light hover:bg-brown/10 transition-colors">
            <BookOpen size={14} />
          </button>
          <button onClick={() => onChat(client.id)}
            className="relative w-8 h-8 flex items-center justify-center rounded-lg text-dim hover:text-brown-light hover:bg-brown/10 transition-colors">
            <MessageCircle size={14} />
            {unread > 0 && (
              <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-brown flex items-center justify-center font-mono text-[7px] text-bg font-bold">
                {unread}
              </span>
            )}
          </button>
          <button onClick={() => onEmail(client.id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-dim hover:text-brown-light hover:bg-brown/10 transition-colors">
            <Mail size={14} />
          </button>
          <button onClick={() => onEdit(client)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-dim hover:text-cream hover:bg-surface transition-colors">
            <Edit2 size={14} />
          </button>
        </div>
      </div>

      {/* Calorie bar */}
      <div className="mb-3">
        <div className="flex items-baseline justify-between mb-1">
          <span className="font-display font-black text-2xl text-cream">
            <AnimatedNumber value={totals.calories} duration={800} />
          </span>
          <span className="font-mono text-xs text-muted">/ {client.goals.calories} kcal · {calPct}%</span>
        </div>
        <div className="w-full bg-dim rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full bar-fill ${calPct >= 100 ? 'bg-red-400' : 'bg-brown'}`}
            style={{ width: `${calPct}%` }}
          />
        </div>
      </div>

      {/* Macro row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'PRO',  val: totals.protein, goal: client.goals.protein, color: 'text-olive-light',     bar: 'bg-olive'     },
          { label: 'CARB', val: totals.carbs,   goal: client.goals.carbs,   color: 'text-brown-light',     bar: 'bg-brown'     },
          { label: 'FAT',  val: totals.fat,     goal: client.goals.fat,     color: 'text-slategray-light', bar: 'bg-slategray' },
        ].map(({ label, val, goal, color, bar }) => {
          const pct = Math.min(Math.round((val / (goal || 1)) * 100), 100)
          return (
            <div key={label} className="bg-surface border border-border rounded-xl p-2.5 card-dim">
              <p className={`font-display font-black text-sm ${color}`}>{Math.round(val)}g</p>
              <p className="font-mono text-[9px] text-muted">{label} / {goal}g</p>
              <div className="mt-1 w-full bg-dim rounded-full h-0.5">
                <div className={`h-0.5 rounded-full bar-fill ${pct >= 100 ? 'bg-red-400' : bar}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* 7-day compliance */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-display text-xs text-muted tracking-widest">7-DAY LOG</span>
          <span className={`font-display font-bold text-xs ${complianceColor}`}>{compliance}%</span>
        </div>
        <div className="flex gap-1">
          {days7.map((logged, i) => (
            <div
              key={i}
              className={`flex-1 h-4 rounded ${logged ? 'bg-olive/40 border border-olive/30' : 'bg-dim'} flex items-center justify-center`}
            >
              {logged && <div className="w-1 h-1 rounded-full bg-olive-light" />}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <p className="font-mono text-xs text-muted">
          {latestW
            ? <><span className="text-cream">{latestW.value} {latestW.unit}</span></>
            : <span className="text-dim">No weight logged</span>
          }
        </p>
        {activePlan ? (
          <button
            onClick={() => onMealPlans(client.id)}
            className="font-mono text-[10px] text-brown-light bg-brown/10 border border-brown/20 px-2 py-0.5 rounded truncate max-w-[140px] transition-colors"
          >
            📋 {activePlan.planName}
          </button>
        ) : (
          <button onClick={() => onMealPlans(client.id)} className="font-mono text-[10px] text-dim hover:text-brown-light transition-colors">
            + add plan
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MobileCoachDashboard() {
  const {
    clients, setActivePage, setViewingClientId,
    currentUser, coachRequests, fetchCoachRequests, respondToRequest,
    setPendingChatClientId,
  } = useStore()

  const [editClient,     setEditClient]     = useState(null)
  const [showEmail,      setShowEmail]      = useState(false)
  const [emailPreselect, setEmailPreselect] = useState(null)
  const [copied,         setCopied]         = useState(false)

  useEffect(() => { fetchCoachRequests() }, [])

  const handleCopyCode = () => {
    if (!currentUser?.coachCode) return
    navigator.clipboard.writeText(currentUser.coachCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const avgCompliance = clients.length
    ? Math.round(
        clients.reduce((acc, c) => {
          const logged = Array.from({ length: 7 }, (_, i) => {
            const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
            return (c.log?.[d] || []).length > 0
          }).filter(Boolean).length
          return acc + (logged / 7) * 100
        }, 0) / clients.length
      )
    : 0

  const activePlans = clients.filter((c) => c.activeMealPlanId).length

  const handleChat = (clientId) => {
    setPendingChatClientId(clientId)
    setActivePage('chat')
  }

  const handleMealPlans = (clientId) => {
    setViewingClientId(clientId, 'mealplans')
    setActivePage('clients')
  }

  const complianceColor =
    avgCompliance >= 70 ? 'text-olive-light' :
    avgCompliance >= 40 ? 'text-brown-light' :
    'text-red-400'

  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      {/* Header — starts at y=0, background covers status bar */}
      <div className="glass-panel accent-line relative anim-fade-in-down px-4 pt-mobile-header pb-4 border-b border-border flex-shrink-0">
        <h2 className="font-display font-black text-3xl tracking-wider text-cream">
          <ScrambleText text="DASHBOARD" duration={800} />
        </h2>
        <p className="font-mono text-xs text-muted mt-0.5">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>
      <div className="px-4 pt-4 pb-4 space-y-5">

      {/* Summary stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'USERS',      val: clients.length,      color: 'text-cream',        Icon: Users      },
          { label: '7-DAY LOG',  val: `${avgCompliance}%`, color: complianceColor,     Icon: TrendingUp },
          { label: 'PLANS',      val: activePlans,          color: 'text-brown-light',  Icon: Target     },
        ].map(({ label, val, color, Icon }, i) => (
          <div
            key={label}
            className="glass-card border border-border/60 rounded-2xl px-3 py-4 flex flex-col items-center gap-1.5 anim-fade-in-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <Icon size={16} className={`${color} opacity-60`} />
            <p className={`font-display font-black text-2xl ${color} data-flicker`}>{val}</p>
            <p className="font-mono text-[9px] text-muted text-center">{label}</p>
          </div>
        ))}
      </div>

      {/* Coach Code */}
      {currentUser?.coachCode && (
        <div className="glass-card border border-border/60 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted tracking-widest">COACH CODE</span>
            <span className="font-display font-black text-lg text-brown tracking-widest">
              {currentUser.coachCode}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 font-mono text-xs text-muted hover:text-cream transition-colors px-2 py-1 rounded-lg hover:bg-surface"
          >
            {copied ? (
              <><CheckIcon size={13} className="text-olive-light" /><span className="text-olive-light">COPIED</span></>
            ) : (
              <><Copy size={13} />COPY</>
            )}
          </button>
        </div>
      )}

      {/* Pending requests */}
      {coachRequests.length > 0 && (
        <div className="glass-card border border-brown/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-brown" />
            <span className="font-display font-bold text-xs tracking-widest text-brown">
              PENDING REQUESTS ({coachRequests.length})
            </span>
          </div>
          <div className="space-y-2">
            {coachRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between gap-2 bg-surface border border-border rounded-xl px-3 py-3 card-dim">
                <div className="min-w-0">
                  <p className="font-mono text-sm text-cream truncate">{req.client_name}</p>
                  <p className="font-mono text-xs text-muted truncate">{req.client_email}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => respondToRequest(req.id, true)}
                    className="font-display font-bold text-xs tracking-widest px-3 py-2 rounded-lg bg-olive/20 hover:bg-olive/40 text-olive-light border border-olive/30 transition-colors"
                  >
                    ACCEPT
                  </button>
                  <button
                    onClick={() => respondToRequest(req.id, false)}
                    className="font-display font-bold text-xs tracking-widest px-3 py-2 rounded-lg text-dim hover:text-red-400 border border-border hover:border-red-400/30 transition-colors"
                  >
                    DECLINE
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email compose button */}
      <button
        onClick={() => { setEmailPreselect(null); setShowEmail(true) }}
        className="w-full flex items-center justify-center gap-2 bg-surface border border-border text-muted font-display font-bold text-xs tracking-widest py-3 rounded-xl transition-colors hover:border-brown/40 hover:text-cream"
      >
        <Mail size={14} />
        COMPOSE EMAIL TO USERS
      </button>

      {/* Client cards */}
      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center anim-fade-in">
          <Users size={36} className="text-dim mb-3" />
          <p className="font-display font-bold text-xl text-muted tracking-widest">NO USERS YET</p>
          <p className="font-mono text-sm text-dim mt-1">Add users from the Users tab</p>
          <button
            onClick={() => setActivePage('clients')}
            className="mt-5 flex items-center gap-2 bg-brown/20 border border-brown/30 text-brown-light font-display font-bold text-sm tracking-widest px-5 py-3 rounded-xl hover:bg-brown/30 transition-colors"
          >
            <ChevronRight size={14} />
            GO TO USERS
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {clients.map((client, i) => (
            <MobileClientCard
              key={client.id}
              client={client}
              delay={i * 60 + 80}
              onEdit={setEditClient}
              onEmail={(id) => { setEmailPreselect(id); setShowEmail(true) }}
              onChat={handleChat}
              onMealPlans={handleMealPlans}
            />
          ))}
        </div>
      )}

      </div>{/* end content wrapper */}

      {/* Modals (fixed overlays) */}
      {editClient && <QuickEditSheet client={editClient} onClose={() => setEditClient(null)} />}
      {showEmail && (
        <EmailSheet
          clients={clients}
          preselectedId={emailPreselect}
          onClose={() => { setShowEmail(false); setEmailPreselect(null) }}
        />
      )}
    </div>
  )
}
