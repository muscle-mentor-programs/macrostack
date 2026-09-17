import useSessionDraft from '../../hooks/useSessionDraft'
import useCoachPreference from '../../hooks/useCoachPreference'
import ClientSections from '../../components/coach/ClientSections'
import { lazy, Suspense, useState, useEffect, useRef, useMemo } from 'react'
import { format, parseISO, subDays, addDays } from 'date-fns'
import { Plus, X, User, Edit2, Trash2, ChevronLeft, Check, Calculator, BookOpen, Star, Pencil, Search, MessageCircle, Lock, ChevronDown, Send, Download, Archive, ArchiveRestore, Wand2 } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import useStore from '../../store'
import { coachClientLimit, coachTierLabel } from '../../lib/coachTiers'
import ClientAvatar from '../../components/ClientAvatar'
import ClientWorkspace, { LegacyCoachNotes } from '../../components/coach/ClientWorkspace'
import AnimatedNumber from '../../components/AnimatedNumber'
import ScrambleText from '../../components/ScrambleText'
const MealPlanBuilder = lazy(() => import('./MealPlanBuilder'))
import ProgressPhotos from '../../components/ProgressPhotos'
import { DEFAULT_QUESTIONS } from '../../lib/checkinQuestions'
import FormEditor from '../../components/FormEditor'
import { suggestTargetsFromIntake } from '../../lib/intake'
import { generateClientReportPDF } from '../../lib/clientReportPDF'
import { computeWeeklyStats } from '../../lib/generateProgressReportPDF'
import { estimateMaintenance } from '../../lib/adaptiveTargets'
import { reconcileGoals } from '../../utils/macros'

// ─── Harris-Benedict (Mifflin-St Jeor revision) ──────────────────────────────
const ACTIVITY = [
  { label: 'Sedentary (desk job, little exercise)',    factor: 1.2   },
  { label: 'Lightly Active (1–3 days/week)',           factor: 1.375 },
  { label: 'Moderately Active (3–5 days/week)',        factor: 1.55  },
  { label: 'Very Active (6–7 days/week)',              factor: 1.725 },
  { label: 'Extremely Active (athlete / physical job)',factor: 1.9   },
]
const GOALS = [
  { label: 'Aggressive Cut  (−500 kcal)', delta: -500 },
  { label: 'Cut             (−250 kcal)', delta: -250 },
  { label: 'Maintenance     (±0)',        delta:    0 },
  { label: 'Lean Bulk       (+200 kcal)', delta:  200 },
  { label: 'Bulk            (+500 kcal)', delta:  500 },
]

function calcTDEE({ sex, age, weightLbs, heightIn, activityIdx, goalIdx }) {
  const weightKg = weightLbs * 0.453592
  const heightCm = heightIn * 2.54
  const a = Number(age)
  if (!weightKg || !heightCm || !a) return null

  // Mifflin-St Jeor BMR
  const bmr =
    sex === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * a + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * a - 161

  const tdee = bmr * ACTIVITY[activityIdx].factor
  const calories = Math.round(tdee + GOALS[goalIdx].delta)

  // Macros: protein = 1g/lb bodyweight, fat = 0.35g/lb, carbs fill rest
  const protein = Math.round(weightLbs * 1.0 / 5) * 5
  const fat = Math.round(weightLbs * 0.35 / 5) * 5
  const carbKcal = calories - protein * 4 - fat * 9
  const carbs = Math.max(Math.round(carbKcal / 4 / 5) * 5, 50)

  return { calories, protein, carbs, fat }
}

function AddClientModal({ onClose }) {
  const { addClient, setActivePage, currentUser } = useStore()
  const clientLimit = coachClientLimit(currentUser)
  const onFreeTier  = coachTierLabel(currentUser) === 'Free'

  // Basic info
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [saving,      setSaving]      = useState(false)
  const [inviteSent,  setInviteSent]  = useState(false)
  const [inviteError, setInviteError] = useState(false)
  const [capReached,  setCapReached]  = useState(false)

  // Calculator
  const [sex, setSex]               = useState('male')
  const [age, setAge]               = useState('')
  const [weightLbs, setWeightLbs]   = useState('')
  const [heightFt, setHeightFt]     = useState('')
  const [heightIn, setHeightIn]     = useState('')
  const [activityIdx, setActivityIdx] = useState(2)
  const [goalIdx, setGoalIdx]       = useState(2)
  const [calcResult, setCalcResult] = useState(null)
  const [calcError, setCalcError]   = useState('')
  const [showCalc, setShowCalc]     = useState(true)

  // Manual targets (editable, auto-filled by calc)
  const [targets, setTargets] = useState({ calories: '2000', protein: '150', carbs: '200', fat: '65' })

  const runCalc = () => {
    const totalIn = Number(heightFt) * 12 + Number(heightIn)

    if (!age || !weightLbs || !heightFt) {
      setCalcError('Fill in age, weight, and height to calculate.')
      return
    }
    setCalcError('')

    const result = calcTDEE({
      sex,
      age: Number(age),
      weightLbs: Number(weightLbs),
      heightIn: totalIn,
      activityIdx: Number(activityIdx),
      goalIdx: Number(goalIdx),
    })

    if (!result) {
      setCalcError('Calculation failed, check your inputs.')
      return
    }

    setCalcResult(result)
    setTargets({
      calories: String(result.calories),
      protein:  String(result.protein),
      carbs:    String(result.carbs),
      fat:      String(result.fat),
    })
  }

  const handleSave = async () => {
    if (!name.trim() || saving) return
    const hasEmail = Boolean(email.trim())
    setSaving(true)
    setInviteError(false)
    const result = await addClient({
      name: name.trim(),
      email: email.trim(),
      goals: {
        calories: Number(targets.calories) || 2000,
        protein:  Number(targets.protein)  || 150,
        carbs:    Number(targets.carbs)    || 200,
        fat:      Number(targets.fat)      || 65,
      },
    })
    setSaving(false)
    const { id, inviteSent, capReached: cap } = result || {}
    if (cap) { setCapReached(true); return }
    if (id && hasEmail) {
      if (inviteSent) {
        setInviteSent(true)
        setTimeout(onClose, 1600)
      } else {
        setInviteError(true)
      }
    } else {
      onClose()
    }
  }

  // Retry just the invite email for the already-created client
  const handleRetryInvite = async () => {
    if (!email.trim() || saving) return
    setSaving(true)
    setInviteError(false)
    const { resendInvite, clients } = useStore.getState()
    // Find the most recently added client with this email
    const match = [...clients].reverse().find((c) => c.email?.toLowerCase() === email.trim().toLowerCase())
    if (match) {
      await resendInvite(match.id)
    }
    setSaving(false)
    setInviteSent(true)
    setTimeout(onClose, 1600)
  }

  const inputCls = 'w-full bg-surface border border-border rounded-xl px-3 py-2 font-mono text-sm text-cream placeholder-muted focus:outline-none focus:border-brown transition-colors'

  // Free-tier cap reached → upgrade prompt instead of the form
  if (capReached) {
    return (
      <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-50 anim-fade-in p-4">
        <div className="glass-card border border-border rounded-2xl w-[440px] max-w-full p-8 text-center anim-spring-in card-dim">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 anim-pop"
            style={{ background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent) 28%, transparent)' }}>
            <Lock size={22} style={{ color: 'var(--color-accent)' }} />
          </div>
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted mb-2">CLIENT LIMIT REACHED</p>
          <h3 className="font-display font-black text-xl tracking-widest text-cream">
            {onFreeTier ? 'GO PREMIUM' : 'UPGRADE YOUR TIER'}
          </h3>
          <p className="font-mono text-xs text-muted mt-2 leading-relaxed">
            {onFreeTier
              ? `Coaching your first client is free. Pick a tier to grow your roster past ${clientLimit} client${clientLimit === 1 ? '' : 's'}.`
              : `Your ${coachTierLabel(currentUser)} tier allows up to ${clientLimit} clients. Move up a tier to keep growing.`}
          </p>
          <button
            onClick={() => { onClose(); setActivePage('upgrade') }}
            className="w-full btn-accent text-bg font-display font-bold text-sm tracking-widest py-3 rounded-xl mt-5 transition-colors glow-hover press"
          >
            {onFreeTier ? 'VIEW PLANS' : 'CHANGE TIER'}
          </button>
          <button onClick={onClose} className="w-full font-mono text-xs text-muted hover:text-cream transition-colors mt-3 py-2">
            Maybe later
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-50 anim-fade-in">
      <div className="bg-card border border-border rounded-2xl w-[580px] max-h-[90vh] overflow-y-auto shadow-2xl anim-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="font-display font-black text-xl tracking-widest text-cream">
            <ScrambleText text="NEW USER" duration={600} />
          </h3>
          <button onClick={onClose} className="text-muted hover:text-cream transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-display text-xs text-muted tracking-widest block mb-1.5">FULL NAME *</label>
              <input autoFocus type="text" placeholder="Jane Smith" value={name}
                onChange={(e) => setName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="font-display text-xs text-muted tracking-widest block mb-1.5">EMAIL</label>
              <input type="email" placeholder="jane@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* TDEE Calculator toggle */}
          <div>
            <button
              onClick={() => setShowCalc(!showCalc)}
              className="flex items-center gap-2 text-brown hover:text-brown-light transition-colors"
            >
              <Calculator size={14} />
              <span className="font-display font-bold text-xs tracking-widest">
                HARRIS-BENEDICT TDEE CALCULATOR {showCalc ? '▲' : '▼'}
              </span>
            </button>
          </div>

          {showCalc && (
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-4 anim-fade-in card-dim">
              {/* Sex */}
              <div>
                <p className="font-display text-xs text-muted tracking-widest mb-2">BIOLOGICAL SEX</p>
                <div className="flex gap-2">
                  {['male', 'female'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSex(s)}
                      className={`font-display font-bold text-xs tracking-widest px-5 py-2 rounded transition-colors ${
                        sex === s
                          ? 'bg-brown text-bg'
                          : 'bg-card border border-border text-muted hover:text-cream'
                      }`}
                    >
                      {s === 'male' ? '♂ MALE' : '♀ FEMALE'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age + Weight */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-display text-xs text-muted tracking-widest block mb-1.5">AGE</label>
                  <input type="number" placeholder="28" value={age}
                    onChange={(e) => setAge(e.target.value)} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className="font-display text-xs text-muted tracking-widest block mb-1.5">WEIGHT (LBS)</label>
                  <input type="number" placeholder="175" value={weightLbs}
                    onChange={(e) => setWeightLbs(e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* Height */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-display text-xs text-muted tracking-widest block mb-1.5">HEIGHT (FT)</label>
                  <input type="number" placeholder="5" value={heightFt}
                    onChange={(e) => setHeightFt(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="font-display text-xs text-muted tracking-widest block mb-1.5">HEIGHT (IN)</label>
                  <input type="number" placeholder="10" value={heightIn}
                    onChange={(e) => setHeightIn(e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* Activity + Goal */}
              <div>
                <label className="font-display text-xs text-muted tracking-widest block mb-1.5">ACTIVITY LEVEL</label>
                <select value={activityIdx} onChange={(e) => setActivityIdx(e.target.value)}
                  className={inputCls}>
                  {ACTIVITY.map((a, i) => <option key={i} value={i}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <label className="font-display text-xs text-muted tracking-widest block mb-1.5">USER GOAL</label>
                <select value={goalIdx} onChange={(e) => setGoalIdx(e.target.value)}
                  className={inputCls}>
                  {GOALS.map((g, i) => <option key={i} value={i}>{g.label}</option>)}
                </select>
              </div>

              {/* Calculate button */}
              <button
                type="button"
                onClick={runCalc}
                className="w-full bg-brown hover:bg-brown-light text-bg font-display font-bold text-sm tracking-widest py-2.5 rounded-xl transition-colors"
              >
                CALCULATE TARGETS
              </button>

              {calcError && (
                <p className="font-mono text-xs text-red-400 text-center -mt-1">{calcError}</p>
              )}

              {/* Result preview */}
              {calcResult && (
                <div className="grid grid-cols-4 gap-2 anim-fade-in-up">
                  {[
                    { label: 'KCAL', val: calcResult.calories, color: 'text-cream' },
                    { label: 'PRO', val: calcResult.protein, color: 'text-olive-light' },
                    { label: 'CARB', val: calcResult.carbs, color: 'text-brown-light' },
                    { label: 'FAT', val: calcResult.fat, color: 'text-slategray-light' },
                  ].map(({ label, val, color }, i) => (
                    <div key={label} className="border border-brown/20 rounded-lg p-2.5 text-center card-inset">
                      <p className={`font-display font-black text-lg ${color} data-flicker`}>
                        <AnimatedNumber value={val} duration={700} delay={i * 60} />
                      </p>
                      <p className="font-mono text-xs text-muted">{label}</p>
                    </div>
                  ))}
                  <p className="col-span-4 font-mono text-xs text-dim text-center mt-1">
                    ↑ auto-applied to targets below, adjust as needed
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Manual targets */}
          <div>
            <p className="font-display text-xs text-muted tracking-widest mb-3">NUTRITION TARGETS</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { key: 'calories', label: 'CALORIES', color: 'text-cream' },
                { key: 'protein',  label: 'PROTEIN',  color: 'text-olive-light' },
                { key: 'carbs',    label: 'CARBS',    color: 'text-brown-light' },
                { key: 'fat',      label: 'FAT',      color: 'text-slategray-light' },
              ].map(({ key, label, color }) => (
                <div key={key}>
                  <label className={`font-display text-xs tracking-widest block mb-1.5 ${color}`}>{label}</label>
                  <input type="number" value={targets[key]}
                    onChange={(e) => {
                      const val = e.target.value
                      setTargets((prev) => {
                        const next = { ...prev, [key]: val }
                        if (key !== 'calories') {
                          const p = Number(key === 'protein' ? val : prev.protein) || 0
                          const c = Number(key === 'carbs'   ? val : prev.carbs)   || 0
                          const f = Number(key === 'fat'     ? val : prev.fat)     || 0
                          next.calories = String(Math.round(p * 4 + c * 4 + f * 9))
                        }
                        return next
                      })
                    }}
                    className={inputCls} />
                </div>
              ))}
            </div>
            <p className="font-mono text-[10px] text-dim mt-2">Editing protein, carbs, or fat auto-updates calories · calories can also be set directly</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 space-y-3">
          {inviteError && (
            <p className="font-mono text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2 text-center">
              User added, but the invite email failed to send. You can resend it from their card.
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={inviteError ? handleRetryInvite : handleSave}
              disabled={saving || inviteSent}
              className={`flex-1 flex items-center justify-center gap-2 font-display font-bold text-sm tracking-widest py-2.5 rounded-lg transition-all disabled:opacity-70 ${
                inviteSent
                  ? 'bg-olive text-bg'
                  : inviteError
                  ? 'bg-amber-600 hover:bg-amber-500 text-bg'
                  : 'bg-brown hover:bg-brown-light text-bg glow-hover'
              }`}>
              {inviteSent ? (
                <><Check size={14} /> INVITE SENT</>
              ) : saving ? 'SENDING…' : inviteError ? 'RETRY INVITE' : 'ADD USER'}
            </button>
            <button onClick={onClose} disabled={saving || inviteSent}
              className="bg-surface border border-border text-muted hover:text-cream font-display font-bold text-sm tracking-widest px-5 py-2.5 rounded-lg transition-colors disabled:opacity-40">
              {inviteError ? 'CLOSE' : 'CANCEL'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MealPlansTab({ clientId }) {
  /* Template plumbing lives at the top so hooks stay unconditional */
  // Read directly from the store so the list always reflects the latest saved state
  const { clients, addMealPlan, updateMealPlan, removeMealPlan, setActiveMealPlan,
    mealPlanTemplates, fetchMealPlanTemplates, saveMealPlanTemplate, deleteMealPlanTemplate } = useStore()
  const client = clients.find((c) => c.id === clientId) || {}

  const [showBuilder, setShowBuilder]   = useState(false)
  const [editingPlan, setEditingPlan]   = useState(null)   // plan object or null
  const [expandedPlanId, setExpandedPlanId] = useState(null)
  const [templateSaved, setTemplateSaved]   = useState(false)

  useEffect(() => { if (mealPlanTemplates === null) fetchMealPlanTemplates() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveTemplate = async (plan) => {
    const res = await saveMealPlanTemplate(plan.planName, plan.days || [])
    if (res.ok) { setTemplateSaved(true); setTimeout(() => setTemplateSaved(false), 2500) }
  }

  const plans = client.mealPlans || []
  const activePlanId = client.activeMealPlanId

  const handleSavePlan = async (planData) => {
    if (editingPlan?.id) {
      // Editing an existing saved plan (has a real id)
      await updateMealPlan(client.id, editingPlan.id, planData)
    } else {
      // Create a new meal plan
      const id = await addMealPlan(client.id, planData)
      if (!id) throw new Error('Could not save meal plan. Please retry; your draft has been kept.')
    }
    // Don't close here, let MealPlanBuilder show the "SAVED" animation
    // then call onClose() itself after 800 ms
  }


  const MEAL_COLORS = {
    Breakfast: 'text-brown-light',
    Lunch:     'text-olive-light',
    Dinner:    'text-slategray-light',
    Snack:     'text-cream',
  }

  if (showBuilder) {
    return (
      <Suspense fallback={<p role="status" className="p-6">Loading meal plan editor…</p>}>
      <MealPlanBuilder
        client={client}
        initialPlan={editingPlan}
        onSave={handleSavePlan}
        onClose={() => { setShowBuilder(false); setEditingPlan(null) }}
      />
      </Suspense>
    )
  }

  return (
    <div className="space-y-5">
      {/* Existing plans */}
      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center anim-fade-in">
          <BookOpen size={28} className="text-dim mb-3 anim-pop" />
          <p className="font-display font-bold text-lg text-muted tracking-widest">NO PLANS YET</p>
          <p className="font-mono text-xs text-dim mt-1">Create a meal plan for your client.</p>
        </div>
      ) : (
        <div className="space-y-3 anim-fade-in-up">
          <p className="font-display text-xs text-muted tracking-widest">PLANS</p>
          {plans.map((plan, pi) => {
            const isActive   = plan.id === activePlanId
            const isExpanded = expandedPlanId === plan.id
            return (
              <div
                key={plan.id}
                className={`bg-card border rounded-xl overflow-hidden anim-fade-in-up card-dim ${
                  isActive ? 'border-brown/50' : 'border-border'
                }`}
                style={{ animationDelay: `${pi * 50}ms` }}
              >
                {/* Plan header row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-brown flex-shrink-0" />}
                      <p className="font-display font-bold text-sm text-cream truncate">{plan.planName}</p>
                    </div>
                    <p className="font-mono text-xs text-muted mt-0.5">
                      {plan.days?.length || 0} day{plan.days?.length !== 1 ? 's' : ''} · created {format(parseISO(plan.createdAt), 'MMM d')}
                    </p>
                  </button>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setActiveMealPlan(client.id, isActive ? null : plan.id)}
                      title={isActive ? 'Deactivate' : 'Set as active'}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                        isActive
                          ? 'text-brown hover:text-red-400'
                          : 'text-dim hover:text-brown'
                      }`}
                    >
                      {isActive ? <Star size={13} fill="currentColor" /> : <Star size={13} />}
                    </button>
                    <button
                      onClick={() => { setEditingPlan(plan); setShowBuilder(true) }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-dim hover:text-cream transition-colors"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => handleSaveTemplate(plan)}
                      title="Save as template (reuse for any client)"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-dim hover:text-olive-light transition-colors"
                    >
                      <Download size={12} />
                    </button>
                    <button
                      onClick={() => removeMealPlan(client.id, plan.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-dim hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Expanded day preview */}
                {isExpanded && plan.days?.length > 0 && (
                  <div className="border-t border-border px-4 py-3 space-y-2 anim-fade-in">
                    {plan.days.map((day) => {
                      const dayTotal = ['Breakfast','Lunch','Dinner','Snack'].reduce((acc, m) => {
                        const items = day.meals?.[m] || []
                        return {
                          cal: acc.cal + items.reduce((s, e) => s + e.calories, 0),
                          pro: acc.pro + items.reduce((s, e) => s + e.protein, 0),
                        }
                      }, { cal: 0, pro: 0 })
                      return (
                        <div key={day.id} className="bg-surface border border-border rounded-lg px-3 py-2 card-dim">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="font-display font-bold text-xs text-cream tracking-widest">{day.label}</p>
                            <p className="font-mono text-xs text-muted">
                              {dayTotal.cal.toFixed(0)} kcal · {dayTotal.pro.toFixed(0)}p
                            </p>
                          </div>
                          {['Breakfast','Lunch','Dinner','Snack'].map((m) => {
                            const items = day.meals?.[m] || []
                            if (items.length === 0) return null
                            return (
                              <div key={m} className="mb-1">
                                <p className={`font-mono text-[10px] ${MEAL_COLORS[m]} mb-0.5`}>{m}</p>
                                {items.map((item) => (
                                  <p key={item.id} className="font-mono text-xs text-muted pl-2 truncate">
                                    {item.quantity !== 1 ? `${item.quantity}× ` : ''}{item.name}
                                  </p>
                                ))}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create manual plan */}
      <button
        onClick={() => { setEditingPlan(null); setShowBuilder(true) }}
        className="w-full flex items-center justify-center gap-2 bg-surface border border-border hover:border-brown/50 text-muted hover:text-cream font-display font-bold text-xs tracking-widest py-3 rounded-xl transition-all anim-fade-in-up glow-hover"
        style={{ animationDelay: '100ms' }}
      >
        <Plus size={13} />
        CREATE PLAN MANUALLY
      </button>

      {/* Templates, reuse plans across the whole roster */}
      {(mealPlanTemplates || []).length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-2 anim-fade-in-up card-dim" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-5 h-px bg-brown/50 flex-shrink-0" />
            <p className="font-mono text-[10px] tracking-[0.3em] text-muted">FROM TEMPLATE</p>
          </div>
          {mealPlanTemplates.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-2 bg-surface border border-border rounded-lg px-3 py-2 card-dim">
              <div className="min-w-0">
                <p className="font-mono text-xs text-cream truncate">{t.name}</p>
                <p className="font-mono text-[10px] text-dim">{t.days?.length || 0} days</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => addMealPlan(client.id, { planName: t.name, days: t.days })}
                  className="font-display font-bold text-[9px] tracking-widest px-2.5 py-1.5 rounded-lg border border-border text-muted hover:text-cream hover:border-muted transition-colors"
                >
                  ASSIGN
                </button>
                <button
                  onClick={() => deleteMealPlanTemplate(t.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-dim hover:text-red-400 transition-colors"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {templateSaved && (
        <p className="font-mono text-[10px] text-olive-light text-center">Saved as template ✓, assign it to any client from here.</p>
      )}

    </div>
  )
}

// ── Coach weekly check-in review (latest submission and coach response) ───────────
/* ── Archive / restore, pause a client without losing their data ──────────── */
function ArchiveButton({ client, onArchived }) {
  const setClientArchived = useStore((s) => s.setClientArchived)
  const [error, setError] = useState('')
  const archived = client.status === 'archived'

  const toggle = async () => {
    setError('')
    const res = await setClientArchived(client.id, !archived)
    if (!res.ok) setError(res.error)
    else if (!archived) onArchived?.()
  }

  return (
    <div>
      <button
        onClick={toggle}
        className="flex items-center gap-2 text-muted hover:text-cream font-display font-bold text-xs tracking-widest transition-colors"
        title={archived ? 'Restore to active roster' : "Pause this client, keeps all data, doesn't count toward your tier"}
      >
        {archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
        {archived ? 'RESTORE USER' : 'ARCHIVE USER'}
      </button>
      {error && <p className="font-mono text-[10px] text-red-400 mt-1.5 leading-relaxed">{error}</p>}
    </div>
  )
}

/* ── Original private coach notes, never visible to the client ───────────── */
function PrivateNotes({ clientId }) {
  return <div className="coach-workspace"><LegacyCoachNotes key={clientId} clientId={clientId} /></div>
}

/* ── Scheduled target changes, set-and-forget macro periodization ─────────── */
function TargetScheduler({ client }) {
  const { targetSchedules, fetchTargetSchedules, addTargetSchedule, deleteTargetSchedule } = useStore()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    applyOn: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    calories: client.goals.calories, protein: client.goals.protein,
    carbs: client.goals.carbs, fat: client.goals.fat, note: '',
  })
  const [error, setError] = useState('')

  useEffect(() => { fetchTargetSchedules(client.id) }, [client.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const schedules = (targetSchedules[client.id] || []).filter((s) => !s.applied)

  const save = async () => {
    setError('')
    const res = await addTargetSchedule(client.id, {
      applyOn: form.applyOn,
      calories: Number(form.calories), protein: Number(form.protein),
      carbs: Number(form.carbs), fat: Number(form.fat), note: form.note,
    })
    if (!res.ok) setError(res.error || 'Could not schedule.')
    else setAdding(false)
  }

  const numCls = 'w-full bg-surface border border-border rounded-lg px-2 py-1.5 font-mono text-xs text-cream focus:outline-none focus:border-brown'

  return (
    <div className="bg-card border border-border rounded-2xl p-4 card-dim">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-5 h-px bg-brown/50 flex-shrink-0" />
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted">SCHEDULED CHANGES</p>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="font-display font-bold text-[9px] tracking-widest text-muted hover:text-cream border border-border rounded-lg px-2 py-1 transition-colors"
        >
          {adding ? 'CANCEL' : '+ SCHEDULE'}
        </button>
      </div>

      {schedules.length === 0 && !adding && (
        <p className="font-mono text-[10px] text-dim leading-relaxed">
          Plan a diet break, refeed, or calorie ramp, targets change automatically on the date you pick.
        </p>
      )}

      {schedules.map((s) => (
        <div key={s.id} className="flex items-center justify-between gap-2 border border-border/50 rounded-lg px-2.5 py-2 mb-1.5 card-inset">
          <div className="min-w-0">
            <p className="font-mono text-[10px] text-cream">
              {format(parseISO(s.applyOn), 'MMM d')} → {s.calories} kcal · {s.protein}p/{s.carbs}c/{s.fat}f
            </p>
            {s.note && <p className="font-mono text-[9px] text-dim truncate">{s.note}</p>}
          </div>
          <button onClick={() => deleteTargetSchedule(client.id, s.id)}
            className="text-dim hover:text-red-400 transition-colors p-1 flex-shrink-0">
            <Trash2 size={11} />
          </button>
        </div>
      ))}

      {adding && (
        <div className="space-y-2 mt-2">
          <input type="date" value={form.applyOn} min={format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => setForm((p) => ({ ...p, applyOn: e.target.value }))}
            className={`${numCls}`} style={{ colorScheme: 'dark' }} />
          <div className="grid grid-cols-4 gap-1.5">
            {['calories', 'protein', 'carbs', 'fat'].map((k) => (
              <div key={k}>
                <label className="font-mono text-[8px] text-dim tracking-widest block mb-0.5">{k.slice(0, 4).toUpperCase()}</label>
                <input type="number" value={form[k]}
                  onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))} className={numCls} />
              </div>
            ))}
          </div>
          <input value={form.note} placeholder="Note (e.g. diet break)"
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} className={numCls} />
          {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}
          <button onClick={save}
            className="w-full btn-accent text-bg font-display font-bold text-[10px] tracking-widest py-2 rounded-lg transition-colors">
            SCHEDULE CHANGE
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Check-in trends, scale answers charted across weeks ──────────────────── */
const TREND_COLORS = ['#82ADE1', '#6B7A52', '#9A7B55', '#8A6FA8', '#B06848']
function CheckinTrends({ client }) {
  const checkins = [...(client.checkins || [])].reverse() // oldest → newest
  if (checkins.length < 2) return null

  // Collect scale series by label across check-ins (answers + legacy fields)
  const labels = new Map()
  const data = checkins.map((k) => {
    const point = { date: k.createdAt ? format(parseISO(k.createdAt), 'M/d') : '' }
    const put = (label, value) => {
      if (value == null) return
      labels.set(label, true)
      point[label] = value
    }
    if (k.answers?.length) {
      k.answers.filter((a) => a.type === 'scale' && a.value).forEach((a) => put(a.label, a.value))
    } else {
      put('Adherence', k.adherence); put('Hunger', k.hunger); put('Energy', k.energy)
    }
    return point
  })
  const keys = [...labels.keys()].slice(0, 5)
  if (!keys.length) return null

  return (
    <div className="glass-card border border-border rounded-2xl p-5 card-dim">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-5 h-px bg-brown/50 flex-shrink-0" />
        <p className="font-mono text-[10px] tracking-[0.3em] text-muted">CHECK-IN TRENDS</p>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
        {keys.map((k, i) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full" style={{ background: TREND_COLORS[i % TREND_COLORS.length] }} />
            <span className="font-mono text-[9px] text-muted">{k.length > 34 ? k.slice(0, 32) + '…' : k}</span>
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -26, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--color-muted)', fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 5]} ticks={[1, 3, 5]} tick={{ fontSize: 9, fill: 'var(--color-dim)', fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, fontFamily: 'Space Mono', fontSize: 11 }} />
          {keys.map((k, i) => (
            <Line key={k} type="monotone" dataKey={k} stroke={TREND_COLORS[i % TREND_COLORS.length]}
              strokeWidth={2} dot={{ r: 2.5 }} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ── Client tags, quick labels with inline add/remove ─────────────────────── */
function TagEditor({ client }) {
  const updateClientTags = useStore((s) => s.updateClientTags)
  const [adding, setAdding] = useState(false)
  const [input, setInput]   = useState('')
  const tags = client.tags || []

  const add = () => {
    const t = input.trim().toLowerCase()
    if (t && !tags.includes(t)) updateClientTags(client.id, [...tags, t])
    setInput(''); setAdding(false)
  }
  const remove = (t) => updateClientTags(client.id, tags.filter((x) => x !== t))

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {tags.map((t) => (
        <span key={t} className="group/tag flex items-center gap-1 font-mono text-[9px] tracking-wide px-2 py-0.5 rounded-full border"
          style={{ borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)', color: 'var(--color-accent)', background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)' }}>
          {t}
          <button onClick={() => remove(t)} className="opacity-40 group-hover/tag:opacity-100 hover:text-red-400 transition-opacity">
            <X size={8} />
          </button>
        </span>
      ))}
      {adding ? (
        <input
          autoFocus value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add(); if (e.key === 'Escape') setAdding(false) }}
          onBlur={add}
          placeholder="tag…"
          className="w-20 bg-surface border border-border rounded-full px-2 py-0.5 font-mono text-[9px] text-cream focus:outline-none focus:border-brown"
        />
      ) : (
        <button onClick={() => setAdding(true)}
          className="font-mono text-[9px] text-dim hover:text-muted px-1.5 py-0.5 rounded-full border border-dashed border-border transition-colors">
          + tag
        </button>
      )}
    </div>
  )
}

/* Renders a check-in's content, new answer snapshots when present, the
   legacy adherence/hunger/energy fields for older submissions.
   (Exported for the mobile client detail screen.) */
export function CheckinAnswers({ checkin, compact = false }) {
  const scaleLabel = (n) => (n ? `${n}/5` : '-')
  const answers = checkin.answers || []

  if (answers.length > 0) {
    const scales = answers.filter((a) => a.type === 'scale')
    const rest   = answers.filter((a) => a.type !== 'scale')
    return (
      <div className="space-y-3">
        {scales.length > 0 && (
          <div className={`grid gap-2 ${compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {scales.map((a, i) => (
              <div key={i} className="border border-border/50 rounded-lg p-2.5 card-inset">
                <p className="font-display font-black text-lg text-cream">{a.value ? `${a.value}/5` : '-'}</p>
                <p className="font-mono text-[9px] text-muted leading-snug mt-0.5">{a.label}</p>
              </div>
            ))}
          </div>
        )}
        {rest.map((a, i) => (
          <div key={i}>
            <p className="font-mono text-[10px] tracking-widest text-muted mb-1">{a.label.toUpperCase()}</p>
            {a.type === 'yesno' ? (
              <p className="font-mono text-sm text-cream">{a.value === null || a.value === undefined ? '-' : a.value ? 'Yes' : 'No'}</p>
            ) : (
              <p className="font-mono text-sm text-cream leading-relaxed whitespace-pre-wrap">{a.value === null || a.value === undefined || a.value === '' ? '-' : String(a.value)}</p>
            )}
          </div>
        ))}
        <CheckinPhotos urls={checkin.photoUrls} />
      </div>
    )
  }

  // Legacy check-ins (pre-custom-questions)
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {[['ADHERENCE', checkin.adherence], ['HUNGER', checkin.hunger], ['ENERGY', checkin.energy]].map(([l, v]) => (
          <div key={l} className="border border-border/50 rounded-lg p-2.5 text-center card-inset">
            <p className="font-display font-black text-lg text-cream">{scaleLabel(v)}</p>
            <p className="font-mono text-[9px] text-muted tracking-widest mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      {checkin.notes && (
        <div>
          <p className="font-mono text-[10px] tracking-widest text-muted mb-1">NOTES</p>
          <p className="font-mono text-sm text-cream leading-relaxed">{checkin.notes}</p>
        </div>
      )}
      <CheckinPhotos urls={checkin.photoUrls} />
    </div>
  )
}

/* Photo attachments on a check-in (also saved to the client's PHOTOS tab). */
function CheckinPhotos({ urls }) {
  const [viewer, setViewer] = useState(null)
  if (!urls?.length) return null
  return (
    <div>
      <p className="font-mono text-[10px] tracking-widest text-muted mb-1.5">ATTACHED PHOTOS</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {urls.map((u, i) => (
          <button key={i} onClick={() => setViewer(u)} className="flex-shrink-0">
            <img src={u} alt={`Check-in photo ${i + 1}`} loading="lazy"
              className="w-16 aspect-[3/4] object-cover rounded-lg border border-border hover:border-brown/50 transition-colors" />
          </button>
        ))}
      </div>
      {viewer && (
        <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex items-center justify-center p-5 anim-fade-in"
          onClick={() => setViewer(null)}>
          <img src={viewer} alt="Check-in photo" className="max-w-full max-h-[80vh] rounded-2xl border border-border object-contain" />
        </div>
      )}
    </div>
  )
}

/* Weekly check-in question editor, thin wrapper over the shared FormEditor
   that loads the coach's set (or defaults) and saves via saveCheckinQuestions. */
function QuestionEditorModal({ onClose }) {
  const { fetchCheckinQuestions, saveCheckinQuestions } = useStore()
  const [list, setList] = useState(null)

  useEffect(() => {
    fetchCheckinQuestions().then((qs) =>
      setList(qs?.length ? qs.map((q) => ({ ...q })) : DEFAULT_QUESTIONS.map((q) => ({ ...q })))
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (list === null) return null
  return (
    <FormEditor
      heading="CHECK-IN QUESTIONS"
      subtitle="What every client answers each week"
      initialQuestions={list}
      saveLabel="SAVE QUESTIONS"
      onSave={({ questions }) => saveCheckinQuestions(questions)}
      onClose={onClose}
    />
  )
}

/* Intro questionnaire + custom form responses for one client. Viewing marks
   them reviewed (clears the dashboard badge). */
/* Intake answers → Mifflin-based starting targets, one tap to apply. */
function IntakeSuggestion({ client, submission }) {
  const updateClientGoals = useStore((s) => s.updateClientGoals)
  const [applied, setApplied] = useState(false)
  const suggestion = suggestTargetsFromIntake(submission.answers)
  if (!suggestion) return null

  const { calories, protein, carbs, fat, basis } = suggestion
  return (
    <div className="rounded-xl p-4 space-y-3"
      style={{ background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)' }}>
      <div className="flex items-center gap-2">
        <Wand2 size={12} style={{ color: 'var(--color-accent)' }} />
        <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: 'var(--color-accent)' }}>
          SUGGESTED STARTING TARGETS
        </p>
      </div>
      <p className="font-mono text-[10px] text-muted leading-relaxed">
        Mifflin-St Jeor from their intake, {basis.age}y {basis.sex}, {basis.weightLb} lbs,{' '}
        {Math.floor(basis.heightIn / 12)}'{basis.heightIn % 12}", activity ×{basis.activity} → {basis.tdee} TDEE (maintenance start).
      </p>
      <div className="grid grid-cols-4 gap-2">
        {[['KCAL', calories], ['PRO', protein], ['CARB', carbs], ['FAT', fat]].map(([l, v]) => (
          <div key={l} className="border border-border/50 rounded-lg p-2 text-center card-inset">
            <p className="font-display font-black text-base text-cream">{v}</p>
            <p className="font-mono text-[9px] text-muted tracking-widest mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      {applied ? (
        <div className="flex items-center justify-center gap-2 text-olive-light">
          <Check size={13} />
          <span className="font-display font-bold text-[10px] tracking-widest">TARGETS APPLIED</span>
        </div>
      ) : (
        <button
          onClick={() => { updateClientGoals(client.id, { calories, protein, carbs, fat }); setApplied(true) }}
          className="w-full btn-accent text-bg font-display font-bold text-[10px] tracking-widest py-2.5 rounded-lg transition-colors"
        >
          APPLY AS {client.name.split(' ')[0].toUpperCase()}'S TARGETS
        </button>
      )}
    </div>
  )
}

export function ClientFormsTab({ client }) {
  const { markSubmissionReviewed, setActivePage } = useStore()
  const subs = client.submissions || []

  useEffect(() => {
    subs.filter((s) => !s.reviewed).forEach((s) => markSubmissionReviewed(client.id, s.id))
  }, [client.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (subs.length === 0) {
    return (
      <div className="glass-card border border-border rounded-2xl p-8 text-center card-dim">
        <p className="font-display font-bold text-sm text-muted tracking-widest">NO FORM RESPONSES YET</p>
        <p className="font-mono text-xs text-dim mt-1.5 leading-relaxed">
          {client.name.split(' ')[0]}'s intro questionnaire and custom form answers will appear here.
          Manage what gets sent from the FORMS tab.
        </p>
        <button
          onClick={() => setActivePage('forms')}
          className="mt-4 font-display font-bold text-[10px] tracking-widest text-muted hover:text-cream border border-border hover:border-muted rounded-lg px-3 py-2 transition-colors"
        >
          OPEN FORMS
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {subs.map((s) => (
        <div key={s.id} className="glass-card border border-border rounded-2xl p-5 card-dim space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <p className="font-display font-bold text-sm text-cream truncate">{s.formTitle || 'Form'}</p>
              <span className="font-mono text-[8px] tracking-[0.18em] px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: 'color-mix(in srgb, var(--color-accent) 14%, transparent)', color: 'var(--color-accent)' }}>
                {s.formKind === 'intro' ? 'INTRO' : 'CUSTOM'}
              </span>
            </div>
            <p className="font-mono text-xs text-muted flex-shrink-0">
              {s.createdAt ? format(parseISO(s.createdAt), 'MMM d, yyyy') : ''}
            </p>
          </div>
          {s.formKind === 'intro' && <IntakeSuggestion client={client} submission={s} />}
          <CheckinAnswers checkin={{ answers: s.answers, photoUrls: s.photoUrls }} compact />
        </div>
      ))}
    </div>
  )
}

export function CheckinTab({ client }) {
  const { markCheckinReviewed, sendMessage } = useStore()
  const [showEditor, setShowEditor]   = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [reply, setReply]         = useSessionDraft(`checkin:${client.id}`, '')
  const [replyError, setReplyError] = useState('')
  const [replySent, setReplySent] = useState(false)
  const [sending, setSending]     = useState(false)

  const latest = client.checkins?.[0] || null
  const history = (client.checkins || []).slice(1)

  // Opening the tab clears the NEW badge on the latest check-in
  useEffect(() => {
    if (latest && !latest.reviewed) markCheckinReviewed(client.id, latest.id)
  }, [latest?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const checkinDate = latest?.createdAt ? format(parseISO(latest.createdAt), 'MMM d, yyyy') : null

  return (
    <div className="coach-checkin-grid max-w-6xl mx-auto space-y-5">
      {/* Latest submission */}
      <div className="anim-fade-in-up">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-px bg-brown/50 flex-shrink-0" />
            <p className="font-mono text-[10px] tracking-[0.3em] text-muted">LATEST CHECK-IN</p>
          </div>
          <button
            onClick={() => setShowEditor(true)}
            className="flex items-center gap-1.5 font-display font-bold text-[10px] tracking-widest text-muted hover:text-cream border border-border hover:border-muted rounded-lg px-2.5 py-1.5 transition-colors"
          >
            <Pencil size={11} />
            EDIT QUESTIONS
          </button>
        </div>
        {latest ? (
          <div className="glass-card border border-border rounded-2xl p-5 card-dim space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-display font-bold text-sm text-cream">{checkinDate}</p>
              {latest.weight != null && (
                <p className="font-mono text-sm text-cream">{latest.weight} {latest.weightUnit}</p>
              )}
            </div>
            <CheckinAnswers checkin={latest} />
          </div>
        ) : (
          <div className="glass-card border border-border rounded-2xl p-8 text-center card-dim">
            <p className="font-display font-bold text-sm text-muted tracking-widest">NO CHECK-IN YET</p>
            <p className="font-mono text-xs text-dim mt-1.5">
              {client.name.split(' ')[0]} hasn't submitted a weekly check-in yet.
            </p>
          </div>
        )}
      </div>

      {/* Respond to the client, closes the check-in loop */}
      {latest && (
        <div className="glass-card border border-border rounded-2xl p-5 card-dim space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-px bg-brown/50 flex-shrink-0" />
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted">RESPOND TO {client.name.split(' ')[0].toUpperCase()}</p>
            </div>
          </div>
          {replyError && <p role="alert" className="text-red-400 text-sm">{replyError}</p>}
          {replySent ? (
            <div className="flex items-center gap-2 text-olive-light py-1">
              <Check size={14} />
              <span className="font-display font-bold text-xs tracking-widest">SENT TO CHAT</span>
            </div>
          ) : (
            <>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
                placeholder={`Nice work this week… (goes straight to ${client.name.split(' ')[0]}'s chat)`}
                className="w-full bg-surface border border-border rounded-xl px-3.5 py-3 font-mono text-sm text-cream placeholder-dim focus:outline-none focus:border-brown resize-y leading-relaxed"
              />
              <button
                onClick={async () => {
                  if (!reply.trim() || sending) return
                  setSending(true)
                  setReplyError('')
                  try {
                    const result = await sendMessage(client.id, 'coach', reply.trim())
                    if (result?.ok === false) throw new Error(result.error)
                    setReplySent(true); setReply('')
                  } catch (error) { setReplyError(error.message || 'Could not send. Please retry.') } finally { setSending(false) }
                }}
                disabled={!reply.trim() || sending}
                className="w-full flex items-center justify-center gap-2 btn-accent text-bg font-display font-bold text-xs tracking-widest py-3 rounded-xl transition-colors disabled:opacity-40"
              >
                <Send size={13} />
                {sending ? 'SENDING…' : 'SEND RESPONSE'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Trends across check-ins */}
      <CheckinTrends client={client} />

      {/* Past check-ins */}
      {history.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="w-full flex items-center justify-between glass-card border border-border rounded-2xl px-5 py-3.5 card-dim text-left hover:border-muted transition-colors"
          >
            <span className="font-mono text-[10px] tracking-[0.3em] text-muted">
              PAST CHECK-INS ({history.length})
            </span>
            <ChevronDown size={14} className={`text-muted transition-transform ${showHistory ? 'rotate-180' : ''}`} />
          </button>
          {showHistory && (
            <div className="space-y-3 mt-3 anim-fade-in">
              {history.map((k) => (
                <div key={k.id} className="glass-card border border-border rounded-2xl p-5 card-dim space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-display font-bold text-sm text-cream">
                      {k.createdAt ? format(parseISO(k.createdAt), 'MMM d, yyyy') : ''}
                    </p>
                    {k.weight != null && (
                      <p className="font-mono text-sm text-muted">{k.weight} {k.weightUnit}</p>
                    )}
                  </div>
                  <CheckinAnswers checkin={k} compact />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showEditor && <QuestionEditorModal onClose={() => setShowEditor(false)} />}
    </div>
  )
}

function ClientDetail({ client, onClose, initialTab = 'overview' }) {
  const { updateClientGoals, updateClientInfo, removeClient, getClientTotalsForDate } = useStore()
  const [tab, setTab]           = useState(initialTab)
  const [editGoals, setEditGoals] = useState(false)
  const [goals, setGoals]       = useState({ ...client.goals })
  const [editName, setEditName] = useState(false)
  const [name, setName]         = useState(client.name)
  const [email, setEmail]       = useState(client.email || '')

  useEffect(() => {
    const warn = event => { if (editGoals || editName) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [editGoals, editName])

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayTotals = getClientTotalsForDate(client.id, today)

  const weekStart = subDays(new Date(), new Date().getDay())
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = format(addDays(weekStart, i), 'yyyy-MM-dd')
    const logged = (client.log?.[date] || []).length > 0
    const cal = (client.log?.[date] || []).reduce((s, e) => s + e.calories, 0)
    return { date, logged, cal }
  })
  const compliance = Math.round((days.filter((d) => d.logged).length / 7) * 100)

  // Last-7-days adherence insights (shared with the client Profile + report PDF)
  const weekly = computeWeeklyStats(client)
  const calAdherencePct = weekly.daysLogged
    ? Math.round((weekly.calOnTarget / weekly.daysLogged) * 100)
    : 0

  // Maintenance estimate from actual intake vs weight trend (non-prescriptive)
  const maint = estimateMaintenance(client)

  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const saveGoals = async () => {
    if (saving) return
    if (Object.values(goals).some(value => !Number.isFinite(Number(value)) || Number(value) < 0)) { setSaveError('Enter valid, nonnegative targets.'); return }
    setSaving(true); setSaveError('')
    try {
    const result = await updateClientGoals(client.id, {
      calories: Number(goals.calories),
      protein:  Number(goals.protein),
      carbs:    Number(goals.carbs),
      fat:      Number(goals.fat),
    })
    if (result?.ok === false) { setSaveError(result.error); return }
    setEditGoals(false)
    } catch { setSaveError('Could not save targets. Please retry.') } finally { setSaving(false) }
  }

  const saveName = async () => {
    if (saving || !name.trim()) return
    setSaving(true); setSaveError('')
    try { const result = await updateClientInfo(client.id, { name: name.trim(), email }); if (result?.ok === false) { setSaveError(result.error); return }; setEditName(false) } catch { setSaveError('Could not save client details. Please retry.') } finally { setSaving(false) }
  }

  return (
    <div className="coach-client-detail flex flex-col h-full overflow-hidden">
      {/* Focus header, back to grid + identity + live pulse */}
      <div className="app-page-gutter relative flex items-center gap-3 md:gap-4 px-4 md:px-8 py-4 md:py-5 border-b border-border flex-shrink-0 glass-panel accent-line">
        <button
          onClick={() => { if (!(editGoals || editName) || window.confirm('Discard your unsaved client changes?')) onClose() }}
          aria-label="Back to clients"
          className="h-9 px-3 flex items-center gap-1.5 rounded-xl border border-border text-muted hover:text-cream hover:border-muted transition-colors flex-shrink-0"
        >
          <ChevronLeft size={14} />
          <span className="font-display font-bold text-[10px] tracking-widest hidden sm:inline">CLIENTS</span>
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <ClientAvatar name={client.name} avatarUrl={client.avatarUrl} className="w-11 h-11" textClassName="text-base" />
          <div className="min-w-0">
            {editName ? (
              <div className="flex items-center gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="bg-bg border border-border rounded px-2 py-1 font-mono text-sm text-cream focus:outline-none focus:border-brown" />
                <button onClick={saveName} className="text-olive-light hover:text-olive">
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <button onClick={() => setEditName(true)} className="flex items-center gap-1.5 group">
                <p className="font-display font-bold text-base md:text-lg text-cream truncate">{client.name}</p>
                <Edit2 size={12} className="text-dim group-hover:text-muted flex-shrink-0" />
              </button>
            )}
            <p className="font-mono text-xs text-muted truncate">{client.email || 'No email'}</p>
          </div>
        </div>

        {/* Pulse chips, glanceable context without leaving the header */}
        <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
          {[
            {
              label: 'TODAY',
              value: `${Math.round((todayTotals.calories / (client.goals.calories || 1)) * 100)}%`,
              accent: true,
            },
            { label: '7-DAY', value: `${compliance}%`, accent: false },
            {
              label: 'TARGET',
              value: `${client.goals.calories} kcal`,
              accent: false,
            },
          ].map(({ label, value, accent }) => (
            <div
              key={label}
              className="px-3.5 py-2 rounded-xl border text-right"
              style={accent
                ? { borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)', background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)' }
                : { borderColor: 'var(--color-border)' }}
            >
              <p className="font-display font-black text-sm leading-none" style={{ color: accent ? 'var(--color-accent)' : 'var(--color-cream)' }}>
                {value}
              </p>
              <p className="font-mono text-[8px] tracking-[0.2em] text-muted mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {saveError && <p role="alert" className="px-4 py-3 text-red-400">{saveError}</p>}
      {saving && <p role="status" className="px-4 text-muted">Saving…</p>}
      <ClientSections value={tab === 'forms' ? 'checkin' : tab === 'tasks' ? 'workspace' : tab} onChange={next => {
        if ((editGoals || editName) && !window.confirm('Discard your unsaved client edits?')) return
        setEditGoals(false); setEditName(false); setTab(next)
      }} />
      <div className="flex-1 min-h-0 overflow-y-auto pb-6">
        {(tab === 'workspace' || tab === 'tasks') && <ClientWorkspace key={`${client.id}-notes`} client={client} mode="records" initialSection={tab === 'tasks' ? 'Tasks' : 'Notes'} />}
        {tab === 'journal' && <ClientWorkspace key={`${client.id}-journal`} client={client} mode="journal" initialSection="Journal" />}
        {tab === 'overview' && <details className="coach-record-summary"><summary>Client brief & follow-ups</summary><ClientWorkspace client={client} mode="overview" /></details>}
        {tab === 'overview' && (
          <div className="app-page-gutter p-4 md:p-6 xl:p-8 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 xl:gap-6">

              {/* ── Left column: today's intake + 7-day compliance ── */}
              <div className="space-y-5">
                {/* Today's macros */}
                <div className="anim-fade-in-up">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-5 h-px bg-brown/50 flex-shrink-0" />
                    <p className="font-mono text-[10px] tracking-[0.3em] text-muted">TODAY'S INTAKE</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { label: 'CALORIES', val: todayTotals.calories, goal: client.goals.calories, text: 'text-cream',           bar: 'bg-brown'     },
                      { label: 'PROTEIN',  val: todayTotals.protein,  goal: client.goals.protein,  text: 'text-olive-light',     bar: 'bg-olive'     },
                      { label: 'CARBS',    val: todayTotals.carbs,    goal: client.goals.carbs,    text: 'text-brown-light',     bar: 'bg-brown'     },
                      { label: 'FAT',      val: todayTotals.fat,      goal: client.goals.fat,      text: 'text-slategray-light', bar: 'bg-slategray' },
                    ].map(({ label, val, goal, text, bar }, i) => {
                      const pct = Math.min(Math.round((val / (goal || 1)) * 100), 100)
                      return (
                        <div key={label} className="bg-card border border-border rounded-2xl p-3 anim-fade-in-up card-dim"
                          style={{ animationDelay: `${i * 50}ms` }}>
                          <div className="flex justify-between items-baseline mb-1.5">
                            <p className="font-display text-xs text-muted tracking-widest">{label}</p>
                            <p className="font-mono text-xs text-dim">{pct}%</p>
                          </div>
                          <p className={`font-display font-black text-xl ${text}`}>
                            <AnimatedNumber value={val} duration={700} delay={i * 60} />
                            <span className="font-normal text-muted text-xs"> / {goal}</span>
                          </p>
                          <div className="mt-2 w-full bg-dim rounded-full h-1">
                            <div className={`h-1 rounded-full bar-fill ${pct >= 100 ? 'bg-red-400' : bar}`}
                              style={{ width: `${pct}%`, animationDelay: `${i * 60 + 100}ms` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 7-day compliance */}
                <div className="anim-fade-in-up" style={{ animationDelay: '150ms' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-px bg-brown/50 flex-shrink-0" />
                      <p className="font-mono text-[10px] tracking-[0.3em] text-muted">7-DAY COMPLIANCE</p>
                    </div>
                    <span className="font-display font-bold text-sm text-olive-light">
                      <AnimatedNumber value={compliance} duration={800} />%
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {days.map((d, i) => (
                      <div key={d.date} className="flex-1 anim-fade-in-up" style={{ animationDelay: `${i * 40 + 200}ms` }}>
                        <div className={`h-9 rounded ${d.logged ? 'bg-olive/40 border border-olive/30' : 'bg-dim'} flex items-center justify-center`}>
                          {d.logged && <div className="w-1.5 h-1.5 rounded-full bg-olive-light" />}
                        </div>
                        <p className="font-mono text-xs text-dim text-center mt-1">
                          {format(parseISO(d.date), 'E').charAt(0)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7-day adherence insights */}
                <div className="anim-fade-in-up" style={{ animationDelay: '170ms' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-5 h-px bg-brown/50 flex-shrink-0" />
                    <p className="font-mono text-[10px] tracking-[0.3em] text-muted">7-DAY ADHERENCE</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { val: `${calAdherencePct}%`,                              label: 'calorie adherence', color: 'text-cream' },
                      { val: `${weekly.proteinHits}/${weekly.daysLogged || 0}`,  label: 'protein goal hit',  color: 'text-olive-light' },
                      { val: `${weekly.streak}d`,                                label: 'log streak',        color: 'text-brown-light' },
                    ].map(({ val, label, color }) => (
                      <div key={label} className="border border-border/50 rounded-lg p-3 card-inset">
                        <p className={`font-display font-bold text-lg ${color}`}>{val}</p>
                        <p className="font-mono text-[10px] text-muted leading-tight mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Right column: targets + meta + danger ── */}
              <div className="space-y-5">
                {/* Goals editor */}
                <div className="anim-fade-in-up" style={{ animationDelay: '100ms' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-px bg-brown/50 flex-shrink-0" />
                      <p className="font-mono text-[10px] tracking-[0.3em] text-muted">NUTRITION TARGETS</p>
                    </div>
                    <button onClick={() => setEditGoals(!editGoals)}
                      className="font-display text-xs text-brown hover:text-brown-light tracking-widest transition-colors">
                      {editGoals ? 'CANCEL' : 'EDIT'}
                    </button>
                  </div>
                  {editGoals ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { key: 'calories', label: 'CALORIES', color: 'text-cream' },
                          { key: 'protein',  label: 'PROTEIN',  color: 'text-olive-light' },
                          { key: 'carbs',    label: 'CARBS',    color: 'text-brown-light' },
                          { key: 'fat',      label: 'FAT',      color: 'text-slategray-light' },
                        ].map(({ key, label, color }) => (
                          <div key={key}>
                            <label className={`font-display text-xs tracking-widest block mb-1.5 ${color}`}>{label}</label>
                            <input type="number" value={goals[key]}
                              onChange={(e) => setGoals((p) => reconcileGoals(p, key, e.target.value))}
                              className="w-full bg-card border border-border rounded-lg px-3 py-2 font-mono text-sm text-cream focus:outline-none focus:border-brown" />
                          </div>
                        ))}
                      </div>
                      <button onClick={saveGoals}
                        className="w-full bg-brown hover:bg-brown-light text-bg font-display font-bold text-sm tracking-widest py-2.5 rounded-xl transition-colors">
                        SAVE TARGETS
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'CALORIES', val: client.goals.calories, color: 'text-cream' },
                        { label: 'PROTEIN',  val: client.goals.protein,  color: 'text-olive-light' },
                        { label: 'CARBS',    val: client.goals.carbs,    color: 'text-brown-light' },
                        { label: 'FAT',      val: client.goals.fat,      color: 'text-slategray-light' },
                      ].map(({ label, val, color }, i) => (
                        <div key={label} className="border border-border/50 rounded-lg p-3 card-inset">
                          <p className={`font-display font-bold text-lg ${color}`}>
                            <AnimatedNumber value={val} duration={700} delay={i * 50} />
                          </p>
                          <p className="font-mono text-xs text-muted">{label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Adaptive target, maintenance estimate from real data */}
                {maint && (
                  <div className="anim-fade-in-up" style={{ animationDelay: '175ms' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-5 h-px bg-brown/50 flex-shrink-0" />
                      <p className="font-mono text-[10px] tracking-[0.3em] text-muted">MAINTENANCE ESTIMATE</p>
                    </div>
                    <div className="border border-border/50 rounded-xl p-3.5 card-inset">
                      <div className="flex items-baseline gap-2">
                        <p className="font-display font-black text-2xl text-cream">≈ {maint.estMaintenance.toLocaleString()}</p>
                        <p className="font-mono text-[10px] text-muted">kcal / day</p>
                      </div>
                      <p className="font-mono text-[11px] text-muted mt-1.5 leading-relaxed">
                        From {maint.avgIntake.toLocaleString()} kcal avg over {maint.loggedDays} logged days and a
                        {' '}{maint.weeklyChange > 0 ? '+' : ''}{maint.weeklyChange} {maint.unit}/wk trend ({maint.spanDays}d).
                      </p>
                      {maint.delta !== null && (
                        <p className="font-mono text-[11px] mt-2 leading-relaxed"
                          style={{ color: Math.abs(maint.delta) < 100 ? 'var(--color-muted)' : 'var(--color-cream)' }}>
                          {Math.abs(maint.delta) < 100
                            ? `Current target (${maint.currentTarget.toLocaleString()}) sits about at maintenance.`
                            : maint.delta < 0
                            ? `Current target is ~${Math.abs(maint.delta).toLocaleString()} kcal below maintenance, a deficit.`
                            : `Current target is ~${maint.delta.toLocaleString()} kcal above maintenance, a surplus.`}
                        </p>
                      )}
                      <p className="font-mono text-[9px] text-dim mt-2">Estimate only, adjust targets above as you see fit.</p>
                    </div>
                  </div>
                )}

                {/* Scheduled target changes */}
                <div className="anim-fade-in-up" style={{ animationDelay: '190ms' }}>
                  <TargetScheduler client={client} />
                </div>

                {/* Private coach notes */}
                <div className="anim-fade-in-up" style={{ animationDelay: '210ms' }}>
                  <PrivateNotes clientId={client.id} />
                </div>

                {/* Client meta */}
                <div className="bg-card border border-border rounded-2xl p-4 anim-fade-in-up card-dim" style={{ animationDelay: '230ms' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-px bg-brown/50 flex-shrink-0" />
                    <p className="font-mono text-[10px] tracking-[0.3em] text-muted">USER INFO</p>
                  </div>
                  <p className="font-mono text-xs text-dim">
                    Member since {format(parseISO(client.createdAt), 'MMM d, yyyy')}
                  </p>
                  {client.email && (
                    <p className="font-mono text-xs text-muted mt-1 truncate">{client.email}</p>
                  )}
                  <div className="mt-3">
                    <TagEditor client={client} />
                  </div>
                  <button
                    onClick={() => generateClientReportPDF(client, useStore.getState().currentUser?.name).save(`${client.name.replace(/\s+/g, '-')}-report.pdf`)}
                    className="mt-3 flex items-center gap-1.5 font-display font-bold text-[10px] tracking-widest text-muted hover:text-cream border border-border hover:border-muted rounded-lg px-2.5 py-1.5 transition-colors"
                  >
                    <Download size={11} />
                    EXPORT CLIENT PDF
                  </button>
                </div>

                {/* Archive + danger zone */}
                <div className="border border-red-900/30 rounded-2xl p-4 anim-fade-in-up space-y-3" style={{ animationDelay: '250ms' }}>
                  <p className="font-display text-xs text-red-400/70 tracking-widest">DANGER ZONE</p>
                  <ArchiveButton client={client} onArchived={onClose} />
                  <button
                    onClick={() => { if (window.confirm('Remove this client? This cannot be undone.')) { removeClient(client.id); onClose() } }}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 font-display font-bold text-xs tracking-widest transition-colors"
                  >
                    <Trash2 size={13} />
                    REMOVE USER
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {(tab === 'checkin' || tab === 'forms') && (
          <div className="app-page-gutter p-4 md:p-6 max-w-6xl mx-auto">
            <CheckinTab client={client} />
            <details className="coach-checkin-forms" open={tab === 'forms' || undefined}><summary>Forms & responses</summary><ClientFormsTab client={client} /></details>
          </div>
        )}

        {tab === 'mealplans' && (
          <div className="app-page-gutter p-4 md:p-6 max-w-6xl mx-auto">
            <MealPlansTab clientId={client.id} />
          </div>
        )}

        {tab === 'photos' && (
          <div className="app-page-gutter p-4 md:p-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-px bg-brown/50 flex-shrink-0" />
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted">PROGRESS PHOTO TIMELINE</p>
            </div>
            <ProgressPhotos client={client} canRequest />
          </div>
        )}


      </div>
    </div>
  )
}

const FILTERS = [
  { id: 'all',      label: 'ALL'          },
  { id: 'logged',   label: 'LOGGED TODAY' },
  { id: 'quiet',    label: 'NOT LOGGED'   },
  { id: 'pending',  label: 'PENDING'      },
  { id: 'archived', label: 'ARCHIVED'     },
]

export default function Clients() {
  const { clients, getClientTotalsForDate, messages, viewingClientId, viewingClientTab, setViewingClientId } = useStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const rosterScroll = useRef(0)
  const [limit, setLimit] = useState(30)
  const [selectedId,   setSelectedId]   = useState(viewingClientId || null)
  const [initialTab,   setInitialTab]   = useState(viewingClientTab || 'overview')
  const [search, setSearch] = useCoachPreference('client-search', '')
  const [filter, setFilter] = useCoachPreference('client-filter', 'all')

  const today = format(new Date(), 'yyyy-MM-dd')

  // Consume the navigation hint from the store once (clear after reading)
  useEffect(() => {
    if (viewingClientId) setViewingClientId(null, null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedClient = clients.find((c) => c.id === selectedId)

  /* ── Roster annotation, memoized: streaks/dots recompute only when data
     changes, not on every keystroke of unrelated state ── */
  const annotated = useMemo(() => clients.map((client) => {
    const totals      = getClientTotalsForDate(client.id, today)
    const calPct      = Math.round((totals.calories / (client.goals.calories || 1)) * 100)
    const loggedToday = (client.log?.[today] || []).length > 0

    // Last 7 days, oldest -> newest, for the dot row
    const days7 = Array.from({ length: 7 }, (_, j) => {
      const d = format(subDays(new Date(), 6 - j), 'yyyy-MM-dd')
      return (client.log?.[d] || []).length > 0
    })

    // Forgiving streak: today not logged yet doesn't break it
    let streak = 0
    for (let j = loggedToday ? 0 : 1; ; j++) {
      const d = format(subDays(new Date(), j), 'yyyy-MM-dd')
      if ((client.log?.[d] || []).length > 0) streak++
      else break
      if (j > 365) break
    }

    const unread = (messages[client.id] || []).filter(
      (m) => m.from === 'client' && !m.readByCoach
    ).length

    return { client, totals, calPct, loggedToday, days7, streak, unread }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [clients, messages, today])

  const loggedCount = useMemo(() => annotated.filter((a) => a.loggedToday).length, [annotated])

  const visible = useMemo(() => annotated.filter(({ client, loggedToday }) => {
    const q = search.trim().toLowerCase()
    if (q && !(client.name + ' ' + (client.email || '') + ' ' + (client.tags || []).join(' ')).toLowerCase().includes(q)) return false
    if (filter === 'archived') return client.status === 'archived'
    if (client.status === 'archived') return false   // hidden everywhere else
    if (filter === 'logged')  return loggedToday
    if (filter === 'quiet')   return !loggedToday && client.status !== 'pending'
    if (filter === 'pending') return client.status === 'pending'
    return true
  }), [annotated, search, filter])

  /* ── FOCUS VIEW, full-page client detail, no split pane ── */
  if (selectedClient) {
    return (
      <>
        <ClientDetail
          key={selectedClient.id}
          client={selectedClient}
          initialTab={initialTab}
          onClose={() => { setSelectedId(null); setInitialTab('overview') }}
        />
        {showAddModal && <AddClientModal onClose={() => setShowAddModal(false)} />}
      </>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="app-page-gutter relative px-5 md:px-8 pt-6 md:pt-7 pb-5 border-b border-border flex-shrink-0 anim-fade-in-down glass-panel accent-line">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-5 h-px flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--color-accent) 50%, transparent)' }} />
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted">YOUR ROSTER</p>
            </div>
            <h2 className="font-display font-black text-4xl tracking-wide text-cream leading-none">
              <ScrambleText text="CLIENTS" duration={700} />
            </h2>
          </div>

          {/* Pulse stats */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="font-display font-black text-2xl leading-none" style={{ color: 'var(--color-accent)' }}>
                <AnimatedNumber value={loggedCount} duration={600} />
                <span className="text-muted text-lg">/{clients.length}</span>
              </p>
              <p className="font-mono text-[9px] tracking-[0.2em] text-muted mt-1">LOGGED TODAY</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 btn-accent text-bg font-display font-bold text-xs tracking-widest px-5 py-3 rounded-xl transition-colors glow-hover"
            >
              <Plus size={14} />
              ADD USER
            </button>
          </div>
        </div>

        {/* Search + filters */}
        <div className="flex flex-wrap items-center gap-3 mt-5">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl pl-8 pr-3 py-2 font-mono text-xs text-cream placeholder:text-dim focus:outline-none focus:border-brown transition-colors"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto max-w-full pb-0.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-2 rounded-xl font-display font-bold text-[10px] tracking-widest transition-all border ${
                  filter === f.id
                    ? 'text-bg border-transparent'
                    : 'text-muted border-border hover:text-cream hover:border-muted'
                }`}
                style={filter === f.id ? { background: 'var(--color-accent)', color: '#fff' } : undefined}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div ref={node => { if (node) node.scrollTop = rosterScroll.current }} onScroll={event => { rosterScroll.current = event.currentTarget.scrollTop }} className="app-page-gutter flex-1 overflow-y-auto p-5 md:p-6 xl:p-8">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 anim-fade-in">
            <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mb-4">
              <User size={24} className="text-muted" />
            </div>
            <p className="font-display font-bold text-xl text-muted tracking-widest">NO CLIENTS</p>
            <p className="font-mono text-sm text-dim mt-2">Add your first user to get started</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-6 btn-accent text-bg font-display font-bold text-sm tracking-widest px-6 py-2.5 rounded-xl transition-colors"
            >
              + ADD FIRST USER
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 anim-fade-in">
            <p className="font-display font-bold text-lg text-muted tracking-widest">NO MATCHES</p>
            <p className="font-mono text-xs text-dim mt-2">Try a different search or filter</p>
          </div>
        ) : (
          <><div className="coach-roster">
            {visible.slice(0,limit).map(({client,totals,loggedToday,unread}) => <article className="coach-roster-row" key={client.id}>
              <button onClick={() => { setInitialTab('overview'); setSelectedId(client.id) }}>{client.name}<small>{client.email || 'No email'}</small></button>
              <span>Today<small>{loggedToday ? `${Math.round(totals.calories)} kcal` : 'No log yet'}</small></span>
              <span>Status<small>{client.status || 'Active'}</small></span>
              <span>Messages<small>{unread} unread</small></span>
              <button data-action onClick={() => { useStore.getState().setPendingChatClientId(client.id); useStore.getState().setActivePage('chat') }}>Message</button>
            </article>)}
          </div>{visible.length>limit&&<button className="coach-load-more" onClick={()=>setLimit(n=>n+30)}>Show more clients</button>}</>
        )}
      </div>

      {showAddModal && <AddClientModal onClose={() => setShowAddModal(false)} />}
    </div>
  )
}
