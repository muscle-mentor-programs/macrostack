import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { format, parseISO, subDays, addDays } from 'date-fns'
import { Plus, X, User, Edit2, Trash2, ChevronRight, Check, Calculator, BookOpen, Sparkles, Star, StarOff, Pencil } from 'lucide-react'
import useStore from '../../store'
import ClientAvatar from '../../components/ClientAvatar'
import AnimatedNumber from '../../components/AnimatedNumber'
import ScrambleText from '../../components/ScrambleText'
import MealPlanBuilder from './MealPlanBuilder'
import { generateMealPlan } from '../../services/mealPlanAI'

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
  const { addClient } = useStore()

  // Basic info
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [saving,      setSaving]      = useState(false)
  const [inviteSent,  setInviteSent]  = useState(false)
  const [inviteError, setInviteError] = useState(false)

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
      setCalcError('Calculation failed — check your inputs.')
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
    const { id, inviteSent } = result || {}
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

  const inputCls = 'w-full bg-surface border border-border rounded-lg px-3 py-2 font-mono text-sm text-cream placeholder-muted focus:outline-none focus:border-brown transition-colors'

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
            <div className="bg-surface border border-border rounded-xl p-4 space-y-4 anim-fade-in">
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
                className="w-full bg-brown hover:bg-brown-light text-bg font-display font-bold text-sm tracking-widest py-2.5 rounded-lg transition-colors"
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
                    <div key={label} className="bg-card border border-brown/20 rounded-lg p-2.5 text-center">
                      <p className={`font-display font-black text-lg ${color} data-flicker`}>
                        <AnimatedNumber value={val} duration={700} delay={i * 60} />
                      </p>
                      <p className="font-mono text-xs text-muted">{label}</p>
                    </div>
                  ))}
                  <p className="col-span-4 font-mono text-xs text-dim text-center mt-1">
                    ↑ auto-applied to targets below — adjust as needed
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
  // Read directly from the store so the list always reflects the latest saved state
  const { clients, addMealPlan, updateMealPlan, removeMealPlan, setActiveMealPlan, customFoods } = useStore()
  const client = clients.find((c) => c.id === clientId) || {}

  const [showBuilder, setShowBuilder]   = useState(false)
  const [editingPlan, setEditingPlan]   = useState(null)   // plan object or null
  const [aiDays, setAiDays]             = useState(7)
  const [aiPrefs, setAiPrefs]           = useState('')
  const [aiLoading, setAiLoading]       = useState(false)
  const [aiError, setAiError]           = useState('')
  const [expandedPlanId, setExpandedPlanId] = useState(null)

  const plans = client.mealPlans || []
  const activePlanId = client.activeMealPlanId

  const handleSavePlan = (planData) => {
    if (editingPlan?.id) {
      // Editing an existing saved plan (has a real id)
      updateMealPlan(client.id, editingPlan.id, planData)
    } else {
      // New plan OR AI-generated plan (editingPlan may be truthy but id is null)
      addMealPlan(client.id, planData)
    }
    // Don't close here — let MealPlanBuilder show the "SAVED" animation
    // then call onClose() itself after 800 ms
  }

  const handleGenerate = async () => {
    setAiLoading(true)
    setAiError('')
    try {
      const result = await generateMealPlan({
        goals:       client.goals,
        days:        aiDays,
        preferences: aiPrefs,
        clientName:  client.name,
        customFoods: customFoods || [],
      })
      // Open builder pre-filled with AI result
      setEditingPlan({ ...result, id: null })
      setShowBuilder(true)
    } catch (e) {
      setAiError(e.message || 'AI generation failed. Check your API key.')
    } finally {
      setAiLoading(false)
    }
  }

  const MEAL_COLORS = {
    Breakfast: 'text-brown-light',
    Lunch:     'text-olive-light',
    Dinner:    'text-slategray-light',
    Snack:     'text-cream',
  }

  if (showBuilder) {
    return (
      <MealPlanBuilder
        client={client}
        initialPlan={editingPlan}
        onSave={handleSavePlan}
        onClose={() => { setShowBuilder(false); setEditingPlan(null) }}
      />
    )
  }

  return (
    <div className="space-y-5">
      {/* Existing plans */}
      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center anim-fade-in">
          <BookOpen size={28} className="text-dim mb-3 anim-pop" />
          <p className="font-display font-bold text-lg text-muted tracking-widest">NO PLANS YET</p>
          <p className="font-mono text-xs text-dim mt-1">Create a manual plan or use Auto-AI below</p>
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
                className={`bg-card border rounded-xl overflow-hidden anim-fade-in-up ${
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
                      {plan.aiGenerated && (
                        <span className="font-mono text-[9px] text-brown-light bg-brown/10 border border-brown/20 px-1.5 py-0.5 rounded flex-shrink-0">
                          AI
                        </span>
                      )}
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
                        <div key={day.id} className="bg-surface border border-border rounded-lg px-3 py-2">
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

      {/* Auto-AI section */}
      <div className="bg-card border border-brown/20 rounded-xl p-4 space-y-3 anim-fade-in-up" style={{ animationDelay: '150ms' }}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={14} className="text-brown-light" />
          <p className="font-display font-bold text-xs text-brown-light tracking-widest">ASK KAY</p>
        </div>
        <p className="font-mono text-xs text-muted leading-relaxed">
          Kay will build a meal plan using only foods in your database, matching {client.name.split(' ')[0]}'s calorie and macro targets.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-display text-xs text-muted tracking-widest block mb-1.5">DAYS</label>
            <select
              value={aiDays}
              onChange={(e) => setAiDays(Number(e.target.value))}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 font-mono text-sm text-cream focus:outline-none focus:border-brown"
            >
              {[1,2,3,4,5,6,7].map((d) => (
                <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-display text-xs text-muted tracking-widest block mb-1.5">TARGETS</label>
            <div className="bg-surface border border-border rounded-lg px-3 py-2 font-mono text-xs text-muted">
              {client.goals.calories} kcal · {client.goals.protein}p
            </div>
          </div>
        </div>

        <div>
          <label className="font-display text-xs text-muted tracking-widest block mb-1.5">PREFERENCES / NOTES</label>
          <textarea
            value={aiPrefs}
            onChange={(e) => setAiPrefs(e.target.value)}
            placeholder="e.g. no dairy, high protein breakfast, avoid nuts..."
            rows={2}
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 font-mono text-sm text-cream placeholder-dim focus:outline-none focus:border-brown resize-none"
          />
        </div>

        {aiError && (
          <p className="font-mono text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {aiError}
          </p>
        )}

        <button
          onClick={handleGenerate}
          disabled={aiLoading}
          className="w-full flex items-center justify-center gap-2 bg-brown hover:bg-brown-light disabled:opacity-50 text-bg font-display font-bold text-sm tracking-widest py-3 rounded-xl transition-all glow-hover"
        >
          {aiLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
              KAY IS BUILDING…
            </>
          ) : (
            <>
              <Sparkles size={15} />
              ASK KAY TO BUILD THIS
            </>
          )}
        </button>
        <p className="font-mono text-[10px] text-dim text-center">
          Kay's result opens in the plan builder for review before saving
        </p>
      </div>
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

  const saveGoals = () => {
    updateClientGoals(client.id, {
      calories: Number(goals.calories),
      protein:  Number(goals.protein),
      carbs:    Number(goals.carbs),
      fat:      Number(goals.fat),
    })
    setEditGoals(false)
  }

  const saveName = () => {
    updateClientInfo(client.id, { name, email })
    setEditName(false)
  }

  return (
    <div className="flex flex-col h-full bg-surface border-l border-border overflow-hidden anim-slide-right">
      {/* Header */}
      <div className="relative flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0 glass-panel accent-line">
        <div className="flex items-center gap-3">
          <ClientAvatar name={client.name} avatarUrl={client.avatarUrl} className="w-10 h-10" textClassName="text-base" />
          <div>
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
                <p className="font-display font-bold text-base text-cream">{client.name}</p>
                <Edit2 size={12} className="text-dim group-hover:text-muted" />
              </button>
            )}
            <p className="font-mono text-xs text-muted">{client.email || 'No email'}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-muted hover:text-cream transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border flex-shrink-0">
        {[
          { id: 'overview',   label: 'OVERVIEW'   },
          { id: 'mealplans',  label: 'MEAL PLANS' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 font-display font-bold text-xs tracking-widest transition-colors ${
              tab === t.id
                ? 'text-cream border-b-2 border-brown'
                : 'text-muted hover:text-cream'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'overview' && (
          <div className="p-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 gap-6">

              {/* ── Left column: today's intake + 7-day compliance ── */}
              <div className="space-y-5">
                {/* Today's macros */}
                <div className="anim-fade-in-up">
                  <p className="font-display text-xs text-muted tracking-widest mb-3">TODAY'S INTAKE</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { label: 'CALORIES', val: todayTotals.calories, goal: client.goals.calories, text: 'text-cream',           bar: 'bg-brown'     },
                      { label: 'PROTEIN',  val: todayTotals.protein,  goal: client.goals.protein,  text: 'text-olive-light',     bar: 'bg-olive'     },
                      { label: 'CARBS',    val: todayTotals.carbs,    goal: client.goals.carbs,    text: 'text-brown-light',     bar: 'bg-brown'     },
                      { label: 'FAT',      val: todayTotals.fat,      goal: client.goals.fat,      text: 'text-slategray-light', bar: 'bg-slategray' },
                    ].map(({ label, val, goal, text, bar }, i) => {
                      const pct = Math.min(Math.round((val / (goal || 1)) * 100), 100)
                      return (
                        <div key={label} className="bg-card border border-border rounded-xl p-3 anim-fade-in-up"
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
                    <p className="font-display text-xs text-muted tracking-widest">7-DAY COMPLIANCE</p>
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
              </div>

              {/* ── Right column: targets + meta + danger ── */}
              <div className="space-y-5">
                {/* Goals editor */}
                <div className="anim-fade-in-up" style={{ animationDelay: '100ms' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-display text-xs text-muted tracking-widest">NUTRITION TARGETS</p>
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
                              onChange={(e) => {
                                const val = e.target.value
                                setGoals((p) => {
                                  const next = { ...p, [key]: val }
                                  if (key !== 'calories') {
                                    next.calories = Math.round(
                                      Number(next.protein || 0) * 4 +
                                      Number(next.carbs   || 0) * 4 +
                                      Number(next.fat     || 0) * 9
                                    )
                                  }
                                  return next
                                })
                              }}
                              className="w-full bg-card border border-border rounded-lg px-3 py-2 font-mono text-sm text-cream focus:outline-none focus:border-brown" />
                          </div>
                        ))}
                      </div>
                      <button onClick={saveGoals}
                        className="w-full bg-brown hover:bg-brown-light text-bg font-display font-bold text-sm tracking-widest py-2.5 rounded-lg transition-colors">
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
                        <div key={label} className="bg-card border border-border rounded-lg p-3">
                          <p className={`font-display font-bold text-lg ${color}`}>
                            <AnimatedNumber value={val} duration={700} delay={i * 50} />
                          </p>
                          <p className="font-mono text-xs text-muted">{label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Client meta */}
                <div className="bg-card border border-border rounded-xl p-4 anim-fade-in-up" style={{ animationDelay: '200ms' }}>
                  <p className="font-display text-xs text-muted tracking-widest mb-2">USER INFO</p>
                  <p className="font-mono text-xs text-dim">
                    Member since {format(parseISO(client.createdAt), 'MMM d, yyyy')}
                  </p>
                  {client.email && (
                    <p className="font-mono text-xs text-muted mt-1 truncate">{client.email}</p>
                  )}
                </div>

                {/* Danger zone */}
                <div className="border border-red-900/30 rounded-xl p-4 anim-fade-in-up" style={{ animationDelay: '250ms' }}>
                  <p className="font-display text-xs text-red-400/70 tracking-widest mb-3">DANGER ZONE</p>
                  <button
                    onClick={() => { removeClient(client.id); onClose() }}
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

        {tab === 'mealplans' && (
          <div className="p-6">
            <MealPlansTab clientId={client.id} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function Clients() {
  const { clients, getClientTotalsForDate, viewingClientId, viewingClientTab, setViewingClientId } = useStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedId,   setSelectedId]   = useState(viewingClientId || null)
  const [initialTab,   setInitialTab]   = useState(viewingClientTab || 'overview')
  const [detailWidth,  setDetailWidth]  = useState(null)
  const containerRef = useRef(null)

  useLayoutEffect(() => {
    if (containerRef.current) {
      setDetailWidth(Math.floor(containerRef.current.offsetWidth / 2))
    }
  }, [])
  const today = format(new Date(), 'yyyy-MM-dd')

  // Consume the navigation hint from the store once (clear after reading)
  useEffect(() => {
    if (viewingClientId) {
      setViewingClientId(null, null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startDrag = useCallback((e) => {
    e.preventDefault()
    const startX    = e.clientX
    const startWidth = detailWidth

    const onMove = (mv) => {
      const containerWidth = containerRef.current?.offsetWidth || 1000
      const delta    = startX - mv.clientX          // drag left → wider detail
      const newWidth = Math.min(
        containerWidth - 280,                        // keep at least 280px for list
        Math.max(380, startWidth + delta)
      )
      setDetailWidth(newWidth)
    }

    const onUp = () => {
      document.body.style.cursor    = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }

    document.body.style.cursor    = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }, [detailWidth])

  const selectedClient = clients.find((c) => c.id === selectedId)

  return (
    <div ref={containerRef} className="flex h-full overflow-hidden">
      {/* Client list */}
      <div className={`flex flex-col flex-1 min-w-[280px] ${selectedClient ? '' : ''} border-r border-border overflow-hidden`}>
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-6 border-b border-border flex-shrink-0 anim-fade-in-down glass-panel accent-line">
          <div>
            <h2 className="font-display font-black text-3xl tracking-wider text-cream">
              <ScrambleText text="USERS" duration={700} />
            </h2>
            <p className="font-mono text-sm text-muted mt-0.5">
              <AnimatedNumber value={clients.length} duration={600} /> active {clients.length === 1 ? 'user' : 'users'}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-brown hover:bg-brown-light text-bg font-display font-bold text-xs tracking-widest px-4 py-2.5 rounded transition-colors glow-hover"
          >
            <Plus size={14} />
            ADD USER
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 anim-fade-in">
              <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mb-4">
                <User size={24} className="text-muted" />
              </div>
              <p className="font-display font-bold text-xl text-muted tracking-widest">NO USERS</p>
              <p className="font-mono text-sm text-dim mt-2">Add your first user to get started</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-6 bg-brown/20 border border-brown/30 text-brown-light font-display font-bold text-sm tracking-widest px-6 py-2.5 rounded hover:bg-brown/30 transition-colors"
              >
                + ADD FIRST USER
              </button>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {clients.map((client, i) => {
                const todayTotals = getClientTotalsForDate(client.id, today)
                const calPct = Math.min(Math.round((todayTotals.calories / (client.goals.calories || 1)) * 100), 100)
                const isSelected = selectedId === client.id

                const days7 = Array.from({ length: 7 }, (_, j) => {
                  const d = format(subDays(new Date(), j), 'yyyy-MM-dd')
                  return (client.log?.[d] || []).length > 0
                })
                const streak = days7.findIndex((logged) => !logged)
                const streakDays = streak === -1 ? 7 : streak

                return (
                  <button
                    key={client.id}
                    onClick={() => {
                      setInitialTab('overview')
                      setSelectedId(isSelected ? null : client.id)
                    }}
                    style={{
                      animationDelay: `${i * 50}ms`,
                      boxShadow: isSelected
                        ? '0 4px 16px rgba(0,0,0,0.45), 0 0 0 1px rgba(154,123,85,0.35), inset 0 1px 0 rgba(255,255,255,0.06)'
                        : '0 2px 8px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                    className={`anim-fade-in-up w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all text-left card-hover ${
                      isSelected
                        ? 'bg-card border-l-4 border-l-brown'
                        : 'bg-surface hover:bg-card border border-border'
                    }`}
                  >
                    <ClientAvatar name={client.name} avatarUrl={client.avatarUrl} className="w-10 h-10" textClassName="text-base" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="font-mono text-sm text-cream truncate">{client.name}</p>
                          {client.status === 'pending' && (
                            <span className="flex-shrink-0 font-display font-bold text-[8px] tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded px-1 py-0.5">
                              PENDING
                            </span>
                          )}
                        </div>
                        <span className="font-display font-bold text-xs text-muted ml-2 flex-shrink-0">{calPct}%</span>
                      </div>
                      <div className="w-full bg-dim rounded-full h-1 mb-1.5">
                        <div
                          className={`h-1 rounded-full bar-fill transition-all ${calPct >= 100 ? 'bg-red-400' : 'bg-brown'}`}
                          style={{ width: `${calPct}%`, animationDelay: `${i * 50 + 100}ms` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-xs text-muted">
                          {todayTotals.calories.toFixed(0)} / {client.goals.calories} kcal
                        </p>
                        {streakDays > 0 && (
                          <span className="font-mono text-xs text-olive-light">{streakDays}d streak</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={14} className={`text-dim flex-shrink-0 transition-transform duration-200 ${isSelected ? 'rotate-90' : ''}`} />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Drag handle */}
      {selectedClient && (
        <div
          onMouseDown={startDrag}
          className="relative flex-shrink-0 w-[3px] bg-border hover:bg-brown/50 active:bg-brown cursor-col-resize transition-colors group"
          title="Drag to resize"
        >
          {/* Wider invisible hit area */}
          <div className="absolute inset-y-0 -left-2 -right-2" />
          {/* Centre grip dots */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {[0,1,2].map((i) => <div key={i} className="w-0.5 h-0.5 rounded-full bg-brown-light" />)}
          </div>
        </div>
      )}

      {/* Client detail panel */}
      {selectedClient && (
        <div className="flex-shrink-0 overflow-hidden" style={{ width: detailWidth ?? '50%' }}>
          <ClientDetail
            key={selectedClient.id}
            client={selectedClient}
            initialTab={initialTab}
            onClose={() => { setSelectedId(null); setInitialTab('overview') }}
          />
        </div>
      )}

      {showAddModal && <AddClientModal onClose={() => setShowAddModal(false)} />}
    </div>
  )
}
