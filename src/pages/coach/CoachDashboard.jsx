import apiFetch from '../../lib/apiFetch'
import { useState, useEffect } from 'react'
import { format, subDays } from 'date-fns'
import {
  Mail, Edit2, Users, TrendingUp, Target, X, Send,
  CheckSquare, Square, MessageCircle, BookOpen,
  Copy, Check as CheckIcon, Bell, Gauge, ClipboardCheck, ClipboardList,
} from 'lucide-react'
import useStore from '../../store'
import ClientAvatar from '../../components/ClientAvatar'
import AnimatedNumber from '../../components/AnimatedNumber'
import ScrambleText from '../../components/ScrambleText'
import NotificationBell from '../../components/NotificationBell'
import KayCoachChat from '../../components/KayCoachChat'
import { computeRosterNudges, computeGoalNudge } from '../../lib/goalNudges'
import { resyncPush } from '../../lib/push'
import { Sparkles, UserPlus2, AlertTriangle } from 'lucide-react'

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
                className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 font-mono text-sm text-cream focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/30 transition-colors"
              />
            </div>
          ))}
        </div>
        <button
          onClick={save}
          className="w-full btn-accent text-bg font-display font-bold text-sm tracking-widest py-3 rounded-lg transition-colors glow-hover"
        >
          SAVE TARGETS
        </button>
      </div>
    </div>
  )
}

// ─── Compose modal — email OR in-app broadcast, with saved templates ─────────
function EmailModal({ clients, preselectedId, onClose }) {
  const { currentUser, broadcastMessage, messageTemplates, fetchMessageTemplates, saveMessageTemplate, deleteMessageTemplate } = useStore()
  const [mode, setMode]         = useState('inapp') // 'inapp' | 'email'
  const [selected, setSelected] = useState(
    preselectedId ? [preselectedId] : []
  )
  const [subject, setSubject]   = useState('')
  const [body, setBody]         = useState('')
  const [status, setStatus]     = useState(null) // null | 'sending' | 'sent' | 'error'
  const [errMsg, setErrMsg]     = useState('')
  const [tplSaved, setTplSaved] = useState(false)

  useEffect(() => { if (messageTemplates === null) fetchMessageTemplates() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )

  const handleSend = async () => {
    setStatus('sending')
    setErrMsg('')

    try {
      if (mode === 'inapp') {
        const ids = clients.filter((c) => selected.includes(c.id)).map((c) => c.id)
        if (!ids.length) throw new Error('Pick at least one user.')
        await broadcastMessage(ids, body.trim())
      } else {
        const recipients = clients.filter((c) => selected.includes(c.id) && c.email)
        if (!recipients.length) throw new Error('No selected users have an email on file.')
        const clientNames = {}
        recipients.forEach((c) => { clientNames[c.email] = c.name })
        const res = await apiFetch('/api/email/send', {
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
      }
      setStatus('sent')
      setTimeout(onClose, 1600)
    } catch (e) {
      setErrMsg(e.message)
      setStatus('error')
    }
  }

  const handleSaveTemplate = async () => {
    if (!body.trim()) return
    await saveMessageTemplate(subject.trim() || body.trim().slice(0, 40), body.trim())
    setTplSaved(true)
    setTimeout(() => setTplSaved(false), 2000)
  }

  const hasEmails = clients.some((c) => selected.includes(c.id) && c.email)
  const canSend = mode === 'inapp'
    ? selected.length > 0 && body.trim()
    : selected.length > 0 && hasEmails && subject.trim() && body.trim()

  return (
    <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-50 anim-fade-in">
      <div className="bg-card border border-border rounded-2xl w-[560px] max-h-[85vh] overflow-y-auto shadow-2xl anim-fade-in-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="font-display font-black text-xl tracking-widest text-cream">MESSAGE USERS</h3>
          <button onClick={onClose} className="text-muted hover:text-cream p-1 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Delivery mode */}
          <div className="flex bg-surface border border-border rounded-xl p-1">
            {[{ id: 'inapp', label: 'IN-APP CHAT' }, { id: 'email', label: 'EMAIL' }].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className="flex-1 py-2 font-display font-bold text-[11px] tracking-widest rounded-lg transition-all"
                style={mode === m.id
                  ? { background: 'linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 72%, white))', color: '#fff' }
                  : { color: 'var(--color-muted)' }}
              >
                {m.label}
              </button>
            ))}
          </div>
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

          {/* Subject — email only */}
          {mode === 'email' && (
            <div>
              <label className="font-display text-xs text-muted tracking-widest block mb-1.5">SUBJECT</label>
              <input
                type="text"
                placeholder="Weekly check-in…"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 font-mono text-sm text-cream placeholder-dim focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/30 transition-colors"
              />
            </div>
          )}

          {/* Saved templates */}
          {(messageTemplates || []).length > 0 && (
            <div>
              <label className="font-display text-xs text-muted tracking-widest block mb-1.5">TEMPLATES</label>
              <div className="flex flex-wrap gap-1.5">
                {messageTemplates.map((t) => (
                  <span key={t.id} className="group/tpl flex items-center gap-1 font-mono text-[10px] px-2.5 py-1 rounded-full border border-border bg-surface">
                    <button onClick={() => setBody(t.body)} className="text-muted hover:text-cream transition-colors" title={t.body.slice(0, 120)}>
                      {t.title}
                    </button>
                    <button onClick={() => deleteMessageTemplate(t.id)} className="text-dim opacity-40 group-hover/tpl:opacity-100 hover:text-red-400">
                      <X size={9} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-display text-xs text-muted tracking-widest">MESSAGE</label>
              <button
                onClick={handleSaveTemplate}
                disabled={!body.trim()}
                className="font-mono text-[10px] text-dim hover:text-muted transition-colors disabled:opacity-40"
              >
                {tplSaved ? 'SAVED ✓' : '+ SAVE AS TEMPLATE'}
              </button>
            </div>
            <textarea
              placeholder={mode === 'inapp' ? 'Lands in each user’s chat, from you…' : 'Type your message…'}
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
            disabled={!canSend || status === 'sending'}
            className={`flex-1 flex items-center justify-center gap-2 disabled:opacity-40 text-bg font-display font-bold text-sm tracking-widest py-3 rounded-lg transition-colors glow-hover ${
              status === 'sent' ? 'bg-olive' : 'btn-accent'
            }`}
          >
            <Send size={14} />
            {status === 'sending' ? 'SENDING…' : status === 'sent' ? 'SENT ✓' : mode === 'inapp' ? `SEND TO ${selected.length || 0} USER${selected.length === 1 ? '' : 'S'}` : 'SEND EMAIL'}
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
function ClientCard({ client, delay, onEdit, onEmail, onChat, onMealPlans, onReview, onFormsReview }) {
  const { getClientTotalsForDate, messages } = useStore()
  const today  = format(new Date(), 'yyyy-MM-dd')
  const totals = getClientTotalsForDate(client.id, today)
  const nudge  = computeGoalNudge(client)
  const newCheckin = !!client.checkins?.[0] && !client.checkins[0].reviewed
  const newForms   = (client.submissions || []).filter((s) => !s.reviewed).length

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
      className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 anim-fade-in-up hover:border-brown/30 transition-colors card-hover card-dim"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <ClientAvatar name={client.name} avatarUrl={client.avatarUrl} className="w-10 h-10" textClassName="text-base" />
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

      {/* New (unreviewed) weekly check-in */}
      {newCheckin && (
        <button
          onClick={() => onReview(client.id)}
          className="flex items-center gap-2 w-full text-left rounded-xl px-3 py-2 transition-colors border"
          style={{ background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)' }}
        >
          <ClipboardCheck size={13} style={{ color: 'var(--color-accent)' }} className="flex-shrink-0" />
          <span className="font-mono text-[10px] truncate" style={{ color: 'var(--color-accent)' }}>
            New check-in — tap to review
          </span>
        </button>
      )}

      {/* New (unreviewed) form responses */}
      {newForms > 0 && (
        <button
          onClick={() => onFormsReview(client.id)}
          className="flex items-center gap-2 w-full text-left rounded-xl px-3 py-2 transition-colors border"
          style={{ background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)' }}
        >
          <ClipboardList size={13} style={{ color: 'var(--color-accent)' }} className="flex-shrink-0" />
          <span className="font-mono text-[10px] truncate" style={{ color: 'var(--color-accent)' }}>
            {newForms === 1 ? 'New form response' : `${newForms} new form responses`} — tap to view
          </span>
        </button>
      )}

      {/* Auto-adjust nudge — targets may need review */}
      {nudge && (
        <button
          onClick={() => onReview(client.id)}
          className="flex items-center gap-2 w-full text-left bg-amber-400/10 border border-amber-400/25 hover:border-amber-400/50 rounded-xl px-3 py-2 transition-colors"
          title={nudge.detail}
        >
          <Gauge size={13} className="text-amber-300 flex-shrink-0" />
          <span className="font-mono text-[10px] text-amber-300 truncate">{nudge.title} — review targets</span>
        </button>
      )}

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
        <div className="w-full overflow-hidden rounded-full h-[6px]" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className={`h-[6px] rounded-full bar-fill ${calPct >= 100 ? 'bg-red-400' : 'bg-brown'}`}
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
            <div key={label} className="border border-border/50 rounded-xl p-2.5 card-inset">
              <p className={`font-display font-black text-base ${color}`}>{Math.round(val)}g</p>
              <p className="font-mono text-[10px] text-muted">{label} / {goal}g</p>
              <div className="mt-1.5 w-full overflow-hidden rounded-full h-[5px]" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className={`h-[5px] rounded-full bar-fill ${pct >= 100 ? 'bg-red-400' : bar}`} style={{ width: `${pct}%` }} />
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
    sendCodeToRequest, setPendingChatClientId,
  } = useStore()
  const [editClient,      setEditClient]      = useState(null)
  const [emailModal,      setEmailModal]      = useState(false)
  const [emailPreselect,  setEmailPreselect]  = useState(null)
  const [copied,          setCopied]          = useState(false)
  const [reqError,        setReqError]        = useState('')
  const [showKay,         setShowKay]         = useState(false)
  const [checklistHidden, setChecklistHidden] = useState(
    () => localStorage.getItem('ms-onboarding-dismissed') === '1'
  )

  const handleAccept = async (reqId) => {
    setReqError('')
    const res = await respondToRequest(reqId, true)
    if (res?.capReached) setReqError(res.error)
  }

  useEffect(() => {
    fetchCoachRequests()
    // Keep this browser's push subscription fresh (no-op unless granted)
    resyncPush(useStore.getState().registerPushSubscription)
    // Onboarding checklist needs forms + questions state
    useStore.getState().fetchCoachForms?.()
    useStore.getState().fetchCheckinQuestions?.()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Archived clients stay out of the day-to-day dashboard entirely
  const active = clients.filter((c) => c.status !== 'archived')

  const avgCompliance = active.length
    ? Math.round(
        active.reduce((acc, c) => {
          const logged = Array.from({ length: 7 }, (_, i) => {
            const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
            return (c.log?.[d] || []).length > 0
          }).filter(Boolean).length
          return acc + (logged / 7) * 100
        }, 0) / active.length
      )
    : 0

  const activePlans = active.filter((c) => c.activeMealPlanId).length

  // Business signals
  const newLast30 = active.filter((c) =>
    c.createdAt && (Date.now() - new Date(c.createdAt).getTime()) < 30 * 86_400_000
  ).length
  const atRisk = active.filter((c) => {
    if (c.status === 'pending') return false
    for (let i = 0; i < 5; i++) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
      if ((c.log?.[d] || []).length > 0) return false
    }
    return true
  }).length

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

  // Deep-link into the client's CHECK-IN tab, where Kay suggests new targets
  const handleReview = (clientId) => {
    setViewingClientId(clientId, 'checkin')
    setActivePage('clients')
  }

  // Deep-link into the client's FORMS tab (intro questionnaire / custom forms)
  const handleFormsReview = (clientId) => {
    setViewingClientId(clientId, 'forms')
    setActivePage('clients')
  }

  const nudges = computeRosterNudges(active)

  // Onboarding checklist — derived live; disappears once everything's done
  const { coachForms, checkinQuestions } = useStore()
  const checklist = [
    { done: !!currentUser?.bio, label: 'Fill in your coach profile', go: () => setActivePage('profile') },
    { done: !!(coachForms || []).find((f) => f.kind === 'intro'), label: 'Set up your intro questionnaire', go: () => setActivePage('forms') },
    { done: (checkinQuestions || []).length > 0, label: 'Review your weekly check-in questions', go: () => setActivePage('forms') },
    { done: clients.length > 0, label: 'Add or invite your first client', go: () => setActivePage('clients') },
  ]
  const checklistOpen = !checklistHidden && checklist.some((c) => !c.done)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="relative flex items-center justify-between px-8 py-6 border-b border-border flex-shrink-0 anim-fade-in-down glass-panel accent-line">
        <div>
          <h2 className="font-display font-black text-4xl tracking-wide text-cream">
            <ScrambleText text="DASHBOARD" duration={900} />
          </h2>
          <div className="flex items-center gap-3 mt-1.5">
            <p className="font-mono text-sm text-muted">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
            {currentUser?.coachCode && (
              <button
                onClick={handleCopyCode}
                title="Copy your coach code"
                className="flex items-center gap-2 border border-border hover:border-muted rounded-lg px-2.5 py-1 transition-colors"
              >
                <span className="font-mono text-[9px] tracking-[0.2em] text-muted">CODE</span>
                <span className="font-display font-black text-sm tracking-widest" style={{ color: 'var(--color-accent)' }}>
                  {currentUser.coachCode}
                </span>
                {copied
                  ? <CheckIcon size={11} className="text-olive-light" />
                  : <Copy size={11} className="text-dim" />}
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowKay(true)}
            className="flex items-center gap-2 font-display font-bold text-xs tracking-widest px-4 py-2.5 rounded-xl transition-all btn-lift"
            style={{
              background: 'color-mix(in srgb, var(--color-accent) 14%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-accent) 40%, transparent)',
              color: 'var(--color-accent)',
            }}
          >
            <Sparkles size={14} />
            ASK KAY
          </button>
          <button
            onClick={() => { setEmailPreselect(null); setEmailModal(true) }}
            className="flex items-center gap-2 bg-surface border border-border hover:border-brown/50 text-muted hover:text-cream font-display font-bold text-xs tracking-widest px-4 py-2.5 rounded-xl transition-all"
          >
            <Mail size={14} />
            MESSAGE USERS
          </button>
          <NotificationBell />
        </div>
      </div>

      {/* Onboarding checklist — new-coach guide, dismissible */}
      {checklistOpen && (
        <div className="px-8 pt-4 pb-0 flex-shrink-0">
          <div className="glass-card border rounded-2xl p-4 card-dim"
            style={{ borderColor: 'color-mix(in srgb, var(--color-accent) 35%, transparent)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-display font-bold text-xs tracking-widest" style={{ color: 'var(--color-accent)' }}>
                GET SET UP ({checklist.filter((c) => c.done).length}/{checklist.length})
              </p>
              <button
                onClick={() => { localStorage.setItem('ms-onboarding-dismissed', '1'); setChecklistHidden(true) }}
                className="font-mono text-[10px] text-dim hover:text-muted transition-colors"
              >
                DISMISS
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {checklist.map((c) => (
                <button
                  key={c.label}
                  onClick={c.go}
                  disabled={c.done}
                  className="flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl border transition-colors disabled:cursor-default"
                  style={c.done
                    ? { borderColor: 'transparent', background: 'rgba(107,122,82,0.10)' }
                    : { borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                >
                  <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 border"
                    style={c.done
                      ? { background: 'var(--color-olive, #6B7A52)', borderColor: 'transparent' }
                      : { borderColor: 'var(--color-border)' }}>
                    {c.done && <CheckIcon size={10} className="text-white" />}
                  </span>
                  <span className={`font-mono text-xs ${c.done ? 'text-muted line-through' : 'text-cream'}`}>{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pending client requests */}
      {coachRequests.length > 0 && (
        <div className="px-8 pt-4 pb-0 flex-shrink-0">
          <div className="bg-card border border-brown/30 rounded-xl p-4 space-y-3 card-dim">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-brown" />
              <span className="font-display font-bold text-xs tracking-widest text-brown">
                PENDING REQUESTS ({coachRequests.length})
              </span>
            </div>
            <p className="font-mono text-[10px] text-dim leading-relaxed">
              ACCEPT links them to your roster instantly; SEND CODE replies with your connection
              code so they can link themselves. Coaching payment is arranged directly between you
              and your clients — MacroStack doesn't collect coaching fees on your behalf.
            </p>
            {reqError && (
              <button
                onClick={() => setActivePage('upgrade')}
                className="w-full text-left font-mono text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 hover:border-red-400/40 transition-colors"
              >
                {reqError} →
              </button>
            )}
            <div className="space-y-2">
              {coachRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between gap-3 bg-surface border border-border rounded-lg px-3 py-2.5 card-dim"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm text-cream truncate">{req.client_name}</p>
                    <p className="font-mono text-xs text-muted truncate">{req.client_email}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAccept(req.id)}
                      className="font-display font-bold text-xs tracking-widest px-3 py-1.5 rounded-lg bg-olive/20 hover:bg-olive/40 text-olive-light border border-olive/30 transition-colors"
                    >
                      ACCEPT
                    </button>
                    <button
                      onClick={() => sendCodeToRequest(req.id)}
                      title="Reply with your connection code — they link themselves"
                      className="font-display font-bold text-xs tracking-widest px-3 py-1.5 rounded-lg bg-brown/15 hover:bg-brown/30 text-brown-light border border-brown/30 transition-colors"
                    >
                      SEND CODE
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

      {/* Auto-adjust nudges — clients whose targets deserve a look */}
      {nudges.length > 0 && (
        <div className="px-8 pt-4 pb-0 flex-shrink-0">
          <div className="bg-card border border-amber-400/25 rounded-xl p-4 space-y-3 card-dim">
            <div className="flex items-center gap-2">
              <Gauge size={14} className="text-amber-300" />
              <span className="font-display font-bold text-xs tracking-widest text-amber-300">
                TARGET REVIEW SUGGESTED ({nudges.length})
              </span>
            </div>
            <div className="space-y-2">
              {nudges.map(({ client, nudge }) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between gap-3 bg-surface border border-border rounded-lg px-3 py-2.5 card-dim"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ClientAvatar name={client.name} avatarUrl={client.avatarUrl} className="w-7 h-7 flex-shrink-0" textClassName="text-[10px]" />
                    <div className="min-w-0">
                      <p className="font-mono text-sm text-cream truncate">
                        {client.name} <span className="text-amber-300">· {nudge.title}</span>
                      </p>
                      <p className="font-mono text-xs text-muted truncate">{nudge.detail}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleReview(client.id)}
                    className="flex-shrink-0 font-display font-bold text-xs tracking-widest px-3 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/30 text-amber-300 border border-amber-400/30 transition-colors"
                  >
                    REVIEW
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary stats + business signals */}
      <div className="grid grid-cols-5 gap-3 px-8 py-5 border-b border-border flex-shrink-0 glass-panel">
        {[
          { label: 'ACTIVE USERS', val: active.length, color: 'text-cream',       Icon: Users      },
          { label: 'AVG 7-DAY LOG', val: `${avgCompliance}%`,
            color: avgCompliance >= 70 ? 'text-olive-light' : avgCompliance >= 40 ? 'text-brown-light' : 'text-red-400',
            Icon: TrendingUp },
          { label: 'MEAL PLANS',   val: activePlans,   color: 'text-brown-light', Icon: Target     },
          { label: 'NEW (30D)',    val: newLast30,     color: 'text-olive-light', Icon: UserPlus2  },
          { label: 'AT RISK',      val: atRisk,
            color: atRisk > 0 ? 'text-red-400' : 'text-dim',
            Icon: AlertTriangle,
            title: 'Active clients with nothing logged in 5+ days' },
        ].map(({ label, val, color, Icon, title }, i) => (
          <div
            key={label}
            title={title}
            className="bg-card border border-border rounded-2xl px-4 py-4 flex items-center gap-3 anim-fade-in-up card-hover card-dim"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <Icon size={18} className={`${color} opacity-50 flex-shrink-0`} />
            <div className="min-w-0">
              <p className={`font-display font-black text-2xl ${color} data-flicker`}>{val}</p>
              <p className="font-mono text-[10px] text-muted truncate">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Client cards */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {active.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center anim-fade-in">
            <Users size={40} className="text-dim mb-4" />
            <p className="font-display font-bold text-2xl text-muted tracking-widest">NO USERS YET</p>
            <p className="font-mono text-sm text-dim mt-2">Add users from the Users page</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
            {active.map((client, i) => (
              <ClientCard
                key={client.id}
                client={client}
                delay={i * 65 + 80}
                onEdit={setEditClient}
                onEmail={(id) => { setEmailPreselect(id); setEmailModal(true) }}
                onChat={handleChat}
                onMealPlans={handleMealPlans}
                onReview={handleReview}
                onFormsReview={handleFormsReview}
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
          clients={active}
          preselectedId={emailPreselect}
          onClose={() => { setEmailModal(false); setEmailPreselect(null) }}
        />
      )}
      {showKay && <KayCoachChat onClose={() => setShowKay(false)} />}
    </div>
  )
}
