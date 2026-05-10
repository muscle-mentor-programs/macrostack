import { useState, useEffect } from 'react'
import { format, subDays } from 'date-fns'
import {
  Mail, Edit2, Users, TrendingUp, Target, X, Send,
  CheckSquare, Square, MessageCircle, BookOpen,
  Copy, Check as CheckIcon, Bell,
} from 'lucide-react'
import useStore from '../../store'
import AnimatedNumber from '../../components/AnimatedNumber'
import ScrambleText from '../../components/ScrambleText'

// ─── Quick-edit goals modal ───────────────────────────────────────────────────
function QuickEditModal({ client, onClose }) {
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
    <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-50 anim-fade-in">
      <div className="bg-card border border-border rounded-2xl w-[420px] p-6 shadow-2xl anim-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-black text-xl tracking-widest text-cream">EDIT TARGETS</h3>
            <p className="font-mono text-xs text-muted mt-0.5">{client.name}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-cream transition-colors p-1">
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { key: 'calories', label: 'CALORIES', color: 'text-cream' },
            { key: 'protein',  label: 'PROTEIN',  color: 'text-olive-light' },
            { key: 'carbs',    label: 'CARBS',    color: 'text-brown-light' },
            { key: 'fat',      label: 'FAT',      color: 'text-slategray-light' },
          ].map(({ key, label, color }) => (
            <div key={key}>
              <label className={`font-display text-xs tracking-widest block mb-1.5 ${color}`}>{label}</label>
              <input
                type="number"
                value={goals[key]}
                onChange={(e) => setGoals((p) => ({ ...p, [key]: e.target.value }))}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 font-mono text-sm text-cream focus:outline-none focus:border-brown transition-colors"
              />
            </div>
          ))}
        </div>
        <button
          onClick={save}
          className="w-full bg-brown hover:bg-brown-light text-bg font-display font-bold text-sm tracking-widest py-3 rounded-lg transition-colors glow-hover"
        >
          SAVE TARGETS
        </button>
      </div>
    </div>
  )
}

// ─── Email compose modal ──────────────────────────────────────────────────────
function EmailModal({ clients, preselectedId, onClose }) {
  const { currentUser } = useStore()
  const [selected, setSelected] = useState(
    preselectedId ? [preselectedId] : []
  )
  const [subject, setSubject]   = useState('')
  const [body, setBody]         = useState('')
  const [status, setStatus]     = useState(null) // null | 'sending' | 'sent' | 'error'
  const [errMsg, setErrMsg]     = useState('')

  const toggle = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )

  const handleSend = async () => {
    const recipients = clients.filter((c) => selected.includes(c.id) && c.email)
    if (!recipients.length) return

    setStatus('sending')
    setErrMsg('')

    const clientNames = {}
    recipients.forEach((c) => { clientNames[c.email] = c.name })

    try {
      const res = await fetch('/api/email/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          to:          recipients.map((c) => c.email),
          subject,
          body,
          coachName:   currentUser?.name || 'Your Coach',
          clientNames,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      setStatus('sent')
      setTimeout(onClose, 1800)
    } catch (e) {
      setErrMsg(e.message)
      setStatus('error')
    }
  }

  const hasEmails = clients.some((c) => selected.includes(c.id) && c.email)

  return (
    <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-50 anim-fade-in">
      <div className="bg-card border border-border rounded-2xl w-[560px] max-h-[85vh] overflow-y-auto shadow-2xl anim-fade-in-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="font-display font-black text-xl tracking-widest text-cream">COMPOSE EMAIL</h3>
          <button onClick={onClose} className="text-muted hover:text-cream p-1 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Recipients */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="font-display text-xs text-muted tracking-widest">TO</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelected(clients.map((c) => c.id))}
                  className="font-display text-xs text-brown hover:text-brown-light tracking-widest transition-colors"
                >
                  SELECT ALL
                </button>
                <button
                  onClick={() => setSelected([])}
                  className="font-display text-xs text-muted hover:text-cream tracking-widest transition-colors"
                >
                  CLEAR
                </button>
              </div>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {clients.map((c) => {
                const on = selected.includes(c.id)
                return (
                  <button
                    key={c.id}
                    onClick={() => toggle(c.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left ${
                      on ? 'bg-brown/10 border-brown/40' : 'bg-surface border-border hover:border-border'
                    }`}
                  >
                    {on ? (
                      <CheckSquare size={15} className="text-brown flex-shrink-0" />
                    ) : (
                      <Square size={15} className="text-dim flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm text-cream truncate">{c.name}</p>
                      {c.email
                        ? <p className="font-mono text-xs text-muted truncate">{c.email}</p>
                        : <p className="font-mono text-xs text-dim">no email on file</p>
                      }
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="font-display text-xs text-muted tracking-widest block mb-1.5">SUBJECT</label>
            <input
              type="text"
              placeholder="Weekly check-in…"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 font-mono text-sm text-cream placeholder-dim focus:outline-none focus:border-brown transition-colors"
            />
          </div>

          {/* Body */}
          <div>
            <label className="font-display text-xs text-muted tracking-widest block mb-1.5">MESSAGE</label>
            <textarea
              placeholder="Type your message…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 font-mono text-sm text-cream placeholder-dim focus:outline-none focus:border-brown transition-colors resize-none"
            />
          </div>
        </div>

        {errMsg && (
          <p className="px-6 pb-2 font-mono text-xs text-red-400">{errMsg}</p>
        )}
        <div className="flex gap-3 px-6 pb-6 pt-1">
          <button
            onClick={handleSend}
            disabled={selected.length === 0 || !hasEmails || !subject.trim() || !body.trim() || status === 'sending'}
            className={`flex-1 flex items-center justify-center gap-2 disabled:opacity-40 text-bg font-display font-bold text-sm tracking-widest py-3 rounded-lg transition-colors glow-hover ${
              status === 'sent' ? 'bg-olive' : 'bg-brown hover:bg-brown-light'
            }`}
          >
            <Send size={14} />
            {status === 'sending' ? 'SENDING…' : status === 'sent' ? 'SENT ✓' : 'SEND EMAIL'}
          </button>
          <button
            onClick={onClose}
            className="bg-surface border border-border text-muted hover:text-cream font-display font-bold text-sm tracking-widest px-5 py-3 rounded-lg transition-colors"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Individual client card ───────────────────────────────────────────────────
function ClientCard({ client, delay, onEdit, onEmail, onChat, onMealPlans }) {
  const { getClientTotalsForDate, messages } = useStore()
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
  const unread     = (messages[client.id] || []).filter(
    (m) => m.from === 'client' && !m.readByCoach
  ).length

  const complianceColor =
    compliance >= 70 ? 'text-olive-light' :
    compliance >= 40 ? 'text-brown-light' :
    'text-red-400'

  return (
    <div
      className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 anim-fade-in-up hover:border-brown/30 transition-colors"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-brown/20 border border-brown/30 flex items-center justify-center flex-shrink-0">
            <span className="font-display font-black text-base text-brown-light">
              {client.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-base text-cream truncate">{client.name}</p>
            <p className="font-mono text-xs text-muted truncate">{client.email || 'No email'}</p>
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onMealPlans(client.id)}
            title="Meal Plans"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-dim hover:text-brown-light hover:bg-brown/10 transition-colors"
          >
            <BookOpen size={13} />
          </button>
          <button
            onClick={() => onChat(client.id)}
            title="Chat"
            className="relative w-7 h-7 flex items-center justify-center rounded-lg text-dim hover:text-brown-light hover:bg-brown/10 transition-colors"
          >
            <MessageCircle size={13} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-brown flex items-center justify-center font-mono text-[8px] text-bg font-bold">
                {unread}
              </span>
            )}
          </button>
          <button
            onClick={() => onEmail(client.id)}
            title="Email"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-dim hover:text-brown-light hover:bg-brown/10 transition-colors"
          >
            <Mail size={13} />
          </button>
          <button
            onClick={() => onEdit(client)}
            title="Edit targets"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-dim hover:text-cream hover:bg-surface transition-colors"
          >
            <Edit2 size={13} />
          </button>
        </div>
      </div>

      {/* Calorie bar */}
      <div>
        <div className="flex items-baseline justify-between mb-1">
          <span className="font-display text-xs text-muted tracking-widest">TODAY</span>
          <span className="font-mono text-xs text-muted">{calPct}%</span>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="font-display font-black text-2xl text-cream data-flicker">
            <AnimatedNumber value={totals.calories} duration={800} />
          </span>
          <span className="font-mono text-xs text-muted">/ {client.goals.calories} kcal</span>
        </div>
        <div className="w-full bg-dim rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full bar-fill ${calPct >= 100 ? 'bg-red-400' : 'bg-brown'}`}
            style={{ width: `${calPct}%` }}
          />
        </div>
      </div>

      {/* Macro mini-cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'PRO',  val: totals.protein, goal: client.goals.protein, color: 'text-olive-light',     bar: 'bg-olive'    },
          { label: 'CARB', val: totals.carbs,   goal: client.goals.carbs,   color: 'text-brown-light',     bar: 'bg-brown'    },
          { label: 'FAT',  val: totals.fat,     goal: client.goals.fat,     color: 'text-slategray-light', bar: 'bg-slategray' },
        ].map(({ label, val, goal, color, bar }) => {
          const pct = Math.min(Math.round((val / (goal || 1)) * 100), 100)
          return (
            <div key={label} className="bg-surface border border-border rounded-xl p-2.5">
              <p className={`font-display font-black text-base ${color}`}>{Math.round(val)}g</p>
              <p className="font-mono text-[10px] text-muted">{label} / {goal}g</p>
              <div className="mt-1.5 w-full bg-dim rounded-full h-0.5">
                <div className={`h-0.5 rounded-full bar-fill ${pct >= 100 ? 'bg-red-400' : bar}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* 7-day compliance */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-display text-xs text-muted tracking-widest">7-DAY LOG</span>
          <span className={`font-display font-bold text-xs ${complianceColor}`}>{compliance}%</span>
        </div>
        <div className="flex gap-1">
          {days7.map((logged, i) => (
            <div
              key={i}
              className={`flex-1 h-5 rounded ${logged ? 'bg-olive/40 border border-olive/30' : 'bg-dim'} flex items-center justify-center`}
            >
              {logged && <div className="w-1 h-1 rounded-full bg-olive-light" />}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <p className="font-mono text-xs text-muted">
          {latestW
            ? <>⚖ <span className="text-cream">{latestW.value} {latestW.unit}</span></>
            : <span className="text-dim">No weight logged</span>
          }
        </p>
        {activePlan ? (
          <button
            onClick={() => onMealPlans(client.id)}
            className="font-mono text-[10px] text-brown-light bg-brown/10 border border-brown/20 hover:bg-brown/20 px-2 py-0.5 rounded truncate max-w-[150px] transition-colors"
          >
            📋 {activePlan.planName}
          </button>
        ) : (
          <button
            onClick={() => onMealPlans(client.id)}
            className="font-mono text-[10px] text-dim hover:text-brown-light transition-colors"
          >
            + add plan
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function CoachDashboard() {
  const {
    clients, setActivePage, setViewingClientId,
    currentUser, coachRequests, fetchCoachRequests, respondToRequest,
    setPendingChatClientId,
  } = useStore()
  const [editClient,      setEditClient]      = useState(null)
  const [emailModal,      setEmailModal]      = useState(false)
  const [emailPreselect,  setEmailPreselect]  = useState(null)
  const [copied,          setCopied]          = useState(false)

  useEffect(() => { fetchCoachRequests() }, [])

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

  const handleCopyCode = () => {
    if (!currentUser?.coachCode) return
    navigator.clipboard.writeText(currentUser.coachCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleChat = (clientId) => {
    setPendingChatClientId(clientId)
    setActivePage('chat')
  }

  const handleMealPlans = (clientId) => {
    setViewingClientId(clientId, 'mealplans')
    setActivePage('clients')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-border flex-shrink-0 anim-fade-in-down">
        <div>
          <h2 className="font-display font-black text-4xl tracking-wider text-cream">
            <ScrambleText text="DASHBOARD" duration={900} />
          </h2>
          <p className="font-mono text-sm text-muted mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <button
          onClick={() => { setEmailPreselect(null); setEmailModal(true) }}
          className="flex items-center gap-2 bg-surface border border-border hover:border-brown/50 text-muted hover:text-cream font-display font-bold text-xs tracking-widest px-4 py-2.5 rounded-lg transition-all"
        >
          <Mail size={14} />
          COMPOSE EMAIL
        </button>
      </div>

      {/* Coach Code widget */}
      {currentUser?.coachCode && (
        <div className="px-8 pt-4 pb-0 flex-shrink-0">
          <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted tracking-widest">COACH CODE</span>
              <span className="font-display font-black text-lg text-brown tracking-widest">
                {currentUser.coachCode}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 font-mono text-xs text-muted hover:text-cream transition-colors px-2 py-1 rounded-lg hover:bg-surface"
              title="Copy coach code"
            >
              {copied ? (
                <>
                  <CheckIcon size={13} className="text-olive-light" />
                  <span className="text-olive-light">COPIED</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  COPY
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Pending client requests */}
      {coachRequests.length > 0 && (
        <div className="px-8 pt-4 pb-0 flex-shrink-0">
          <div className="bg-card border border-brown/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-brown" />
              <span className="font-display font-bold text-xs tracking-widest text-brown">
                PENDING REQUESTS ({coachRequests.length})
              </span>
            </div>
            <div className="space-y-2">
              {coachRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between gap-3 bg-surface border border-border rounded-lg px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm text-cream truncate">{req.client_name}</p>
                    <p className="font-mono text-xs text-muted truncate">{req.client_email}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => respondToRequest(req.id, true)}
                      className="font-display font-bold text-xs tracking-widest px-3 py-1.5 rounded-lg bg-olive/20 hover:bg-olive/40 text-olive-light border border-olive/30 transition-colors"
                    >
                      ACCEPT
                    </button>
                    <button
                      onClick={() => respondToRequest(req.id, false)}
                      className="font-display font-bold text-xs tracking-widest px-3 py-1.5 rounded-lg bg-surface hover:bg-red-400/10 text-dim hover:text-red-400 border border-border hover:border-red-400/30 transition-colors"
                    >
                      DECLINE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 px-8 py-5 border-b border-border flex-shrink-0">
        {[
          { label: 'ACTIVE CLIENTS',    val: clients.length, color: 'text-cream',       Icon: Users      },
          { label: 'AVG 7-DAY LOG',     val: `${avgCompliance}%`,
            color: avgCompliance >= 70 ? 'text-olive-light' : avgCompliance >= 40 ? 'text-brown-light' : 'text-red-400',
            Icon: TrendingUp },
          { label: 'ACTIVE MEAL PLANS', val: activePlans,    color: 'text-brown-light', Icon: Target     },
        ].map(({ label, val, color, Icon }, i) => (
          <div
            key={label}
            className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4 anim-fade-in-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <Icon size={20} className={`${color} opacity-50 flex-shrink-0`} />
            <div>
              <p className={`font-display font-black text-3xl ${color} data-flicker`}>{val}</p>
              <p className="font-mono text-xs text-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Client cards */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center anim-fade-in">
            <Users size={40} className="text-dim mb-4" />
            <p className="font-display font-bold text-2xl text-muted tracking-widest">NO CLIENTS YET</p>
            <p className="font-mono text-sm text-dim mt-2">Add clients from the Clients page</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
            {clients.map((client, i) => (
              <ClientCard
                key={client.id}
                client={client}
                delay={i * 65 + 80}
                onEdit={setEditClient}
                onEmail={(id) => { setEmailPreselect(id); setEmailModal(true) }}
                onChat={handleChat}
                onMealPlans={handleMealPlans}
              />
            ))}
          </div>
        )}
      </div>

      {editClient && (
        <QuickEditModal client={editClient} onClose={() => setEditClient(null)} />
      )}
      {emailModal && (
        <EmailModal
          clients={clients}
          preselectedId={emailPreselect}
          onClose={() => { setEmailModal(false); setEmailPreselect(null) }}
        />
      )}
    </div>
  )
}
