import { useState, useEffect } from 'react'
import { format, parseISO, subDays } from 'date-fns'
import {
  Plus, X, User, Check, ChevronLeft, Trash2, Calculator,
  BookOpen, Sparkles, Star, Pencil, Edit2, Search, ChevronRight,
} from 'lucide-react'
import useStore from '../../../store'
import AnimatedNumber from '../../../components/AnimatedNumber'
import ScrambleText from '../../../components/ScrambleText'
import MealPlanBuilder from '../MealPlanBuilder'
import { generateMealPlan } from '../../../services/mealPlanAI'

// ─── Harris-Benedict (Mifflin-St Jeor) ───────────────────────────────────────
const ACTIVITY = [
  { label: 'Sedentary (desk job)',             factor: 1.2   },
  { label: 'Lightly Active (1–3 days/week)',   factor: 1.375 },
  { label: 'Moderately Active (3–5 days/week)',factor: 1.55  },
  { label: 'Very Active (6–7 days/week)',      factor: 1.725 },
  { label: 'Extremely Active (athlete)',       factor: 1.9   },
]
const GOALS_LIST = [
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
  const bmr =
    sex === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * a + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * a - 161
  const tdee     = bmr * ACTIVITY[activityIdx].factor
  const calories = Math.round(tdee + GOALS_LIST[goalIdx].delta)
  const protein  = Math.round(weightLbs * 1.0 / 5) * 5
  const fat      = Math.round(weightLbs * 0.35 / 5) * 5
  const carbs    = Math.max(Math.round((calories - protein * 4 - fat * 9) / 4 / 5) * 5, 50)
  return { calories, protein, carbs, fat }
}

// ─── Add-client full-screen form ──────────────────────────────────────────────
function AddClientScreen({ onClose }) {
  const { addClient } = useStore()
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')

  const [sex,         setSex]         = useState('male')
  const [age,         setAge]         = useState('')
  const [weightLbs,   setWeightLbs]   = useState('')
  const [heightFt,    setHeightFt]    = useState('')
  const [heightIn,    setHeightIn]    = useState('')
  const [activityIdx, setActivityIdx] = useState(2)
  const [goalIdx,     setGoalIdx]     = useState(2)
  const [calcResult,  setCalcResult]  = useState(null)
  const [calcError,   setCalcError]   = useState('')
  const [showCalc,    setShowCalc]    = useState(true)

  const [targets, setTargets] = useState({ calories: '2000', protein: '150', carbs: '200', fat: '65' })

  const runCalc = () => {
    const totalIn = Number(heightFt) * 12 + Number(heightIn)
    if (!age || !weightLbs || !heightFt) { setCalcError('Fill in age, weight, and height.'); return }
    setCalcError('')
    const result = calcTDEE({ sex, age: Number(age), weightLbs: Number(weightLbs), heightIn: totalIn, activityIdx: Number(activityIdx), goalIdx: Number(goalIdx) })
    if (!result) { setCalcError('Calculation failed — check inputs.'); return }
    setCalcResult(result)
    setTargets({ calories: String(result.calories), protein: String(result.protein), carbs: String(result.carbs), fat: String(result.fat) })
  }

  const handleSave = () => {
    if (!name.trim()) return
    addClient({
      name: name.trim(), email: email.trim(),
      goals: { calories: Number(targets.calories) || 2000, protein: Number(targets.protein) || 150, carbs: Number(targets.carbs) || 200, fat: Number(targets.fat) || 65 },
    })
    onClose()
  }

  const inp = 'w-full bg-surface border border-border rounded-xl px-4 py-3 font-mono text-sm text-cream placeholder-muted focus:outline-none focus:border-brown transition-colors'
  const lbl = 'font-display text-xs text-muted tracking-widest block mb-1.5'

  return (
    <div className="fixed inset-0 bg-bg z-50 flex flex-col anim-fade-in overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-14 pb-4 border-b border-border bg-surface flex-shrink-0">
        <h3 className="font-display font-black text-xl tracking-widest text-cream">NEW CLIENT</h3>
        <button onClick={onClose} className="text-muted p-1"><X size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Name + email */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>FULL NAME *</label>
            <input autoFocus type="text" placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} className={inp} />
          </div>
          <div>
            <label className={lbl}>EMAIL</label>
            <input type="email" placeholder="jane@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inp} />
          </div>
        </div>

        {/* TDEE calculator toggle */}
        <button onClick={() => setShowCalc(!showCalc)} className="flex items-center gap-2 text-brown">
          <Calculator size={14} />
          <span className="font-display font-bold text-xs tracking-widest">
            TDEE CALCULATOR {showCalc ? '▲' : '▼'}
          </span>
        </button>

        {showCalc && (
          <div className="bg-surface border border-border rounded-2xl p-4 space-y-4 anim-fade-in">
            {/* Sex */}
            <div>
              <p className={lbl}>BIOLOGICAL SEX</p>
              <div className="flex gap-2">
                {['male', 'female'].map((s) => (
                  <button key={s} onClick={() => setSex(s)}
                    className={`flex-1 font-display font-bold text-xs tracking-widest py-3 rounded-xl transition-colors ${sex === s ? 'bg-brown text-bg' : 'bg-card border border-border text-muted'}`}>
                    {s === 'male' ? '♂ MALE' : '♀ FEMALE'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>AGE</label><input type="number" placeholder="28" value={age} onChange={(e) => setAge(e.target.value)} className={inp} /></div>
              <div><label className={lbl}>WEIGHT (LBS)</label><input type="number" placeholder="175" value={weightLbs} onChange={(e) => setWeightLbs(e.target.value)} className={inp} /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>HEIGHT (FT)</label><input type="number" placeholder="5" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} className={inp} /></div>
              <div><label className={lbl}>HEIGHT (IN)</label><input type="number" placeholder="10" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} className={inp} /></div>
            </div>

            <div><label className={lbl}>ACTIVITY LEVEL</label>
              <select value={activityIdx} onChange={(e) => setActivityIdx(e.target.value)} className={inp}>
                {ACTIVITY.map((a, i) => <option key={i} value={i}>{a.label}</option>)}
              </select>
            </div>
            <div><label className={lbl}>CLIENT GOAL</label>
              <select value={goalIdx} onChange={(e) => setGoalIdx(e.target.value)} className={inp}>
                {GOALS_LIST.map((g, i) => <option key={i} value={i}>{g.label}</option>)}
              </select>
            </div>

            <button onClick={runCalc} className="w-full bg-brown hover:bg-brown-light text-bg font-display font-bold text-sm tracking-widest py-4 rounded-xl transition-colors">
              CALCULATE TARGETS
            </button>
            {calcError && <p className="font-mono text-xs text-red-400 text-center">{calcError}</p>}

            {calcResult && (
              <div className="grid grid-cols-4 gap-2 anim-fade-in-up">
                {[
                  { label: 'KCAL', val: calcResult.calories, color: 'text-cream' },
                  { label: 'PRO',  val: calcResult.protein,  color: 'text-olive-light' },
                  { label: 'CARB', val: calcResult.carbs,    color: 'text-brown-light' },
                  { label: 'FAT',  val: calcResult.fat,      color: 'text-slategray-light' },
                ].map(({ label, val, color }, i) => (
                  <div key={label} className="bg-card border border-brown/20 rounded-xl p-2.5 text-center">
                    <p className={`font-display font-black text-lg ${color}`}><AnimatedNumber value={val} duration={700} delay={i * 60} /></p>
                    <p className="font-mono text-[10px] text-muted">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manual targets */}
        <div>
          <p className={lbl}>NUTRITION TARGETS</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'calories', label: 'CALORIES', color: 'text-cream' },
              { key: 'protein',  label: 'PROTEIN',  color: 'text-olive-light' },
              { key: 'carbs',    label: 'CARBS',    color: 'text-brown-light' },
              { key: 'fat',      label: 'FAT',      color: 'text-slategray-light' },
            ].map(({ key, label, color }) => (
              <div key={key}>
                <label className={`${lbl} ${color}`}>{label}</label>
                <input type="number" value={targets[key]} onChange={(e) => setTargets((p) => ({ ...p, [key]: e.target.value }))} className={inp} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 pb-6 pt-3 border-t border-border bg-surface">
        <button onClick={handleSave} disabled={!name.trim()}
          className="w-full flex items-center justify-center gap-2 bg-brown hover:bg-brown-light disabled:opacity-40 text-bg font-display font-bold text-sm tracking-widest py-4 rounded-xl transition-colors">
          <Plus size={16} />
          ADD CLIENT
        </button>
      </div>
    </div>
  )
}

// ─── Meal plans tab ───────────────────────────────────────────────────────────
function MealPlansTab({ clientId }) {
  const { clients, addMealPlan, updateMealPlan, removeMealPlan, setActiveMealPlan, customFoods } = useStore()
  const client = clients.find((c) => c.id === clientId) || {}

  const [showBuilder,    setShowBuilder]    = useState(false)
  const [editingPlan,    setEditingPlan]    = useState(null)
  const [aiDays,         setAiDays]         = useState(7)
  const [aiPrefs,        setAiPrefs]        = useState('')
  const [aiLoading,      setAiLoading]      = useState(false)
  const [aiError,        setAiError]        = useState('')
  const [expandedPlanId, setExpandedPlanId] = useState(null)

  const plans       = client.mealPlans || []
  const activePlanId = client.activeMealPlanId

  const handleSavePlan = (planData) => {
    if (editingPlan?.id) updateMealPlan(client.id, editingPlan.id, planData)
    else addMealPlan(client.id, planData)
  }

  const handleGenerate = async () => {
    setAiLoading(true); setAiError('')
    try {
      const result = await generateMealPlan({ goals: client.goals, days: aiDays, preferences: aiPrefs, clientName: client.name, customFoods: customFoods || [] })
      setEditingPlan({ ...result, id: null }); setShowBuilder(true)
    } catch (e) {
      setAiError(e.message || 'AI generation failed. Check your API key.')
    } finally { setAiLoading(false) }
  }

  const inp = 'w-full bg-surface border border-border rounded-xl px-4 py-3 font-mono text-sm text-cream focus:outline-none focus:border-brown'

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
    <div className="space-y-4">
      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <BookOpen size={26} className="text-dim mb-3" />
          <p className="font-display font-bold text-lg text-muted tracking-widest">NO PLANS YET</p>
          <p className="font-mono text-xs text-dim mt-1">Create a plan manually or use AI below</p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan, pi) => {
            const isActive   = plan.id === activePlanId
            const isExpanded = expandedPlanId === plan.id
            return (
              <div key={plan.id}
                className={`bg-card border rounded-2xl overflow-hidden ${isActive ? 'border-brown/50' : 'border-border'}`}
                style={{ animationDelay: `${pi * 40}ms` }}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)} className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-brown flex-shrink-0" />}
                      <p className="font-display font-bold text-sm text-cream truncate">{plan.planName}</p>
                      {plan.aiGenerated && (
                        <span className="font-mono text-[9px] text-brown-light bg-brown/10 border border-brown/20 px-1.5 py-0.5 rounded flex-shrink-0">AI</span>
                      )}
                    </div>
                    <p className="font-mono text-xs text-muted mt-0.5">
                      {plan.days?.length || 0} days · {format(parseISO(plan.createdAt), 'MMM d')}
                    </p>
                  </button>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setActiveMealPlan(client.id, isActive ? null : plan.id)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isActive ? 'text-brown hover:text-red-400' : 'text-dim hover:text-brown'}`}>
                      {isActive ? <Star size={14} fill="currentColor" /> : <Star size={14} />}
                    </button>
                    <button onClick={() => { setEditingPlan(plan); setShowBuilder(true) }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-dim hover:text-cream transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => removeMealPlan(client.id, plan.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-dim hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {isExpanded && plan.days?.length > 0 && (
                  <div className="border-t border-border px-4 py-3 space-y-2 anim-fade-in">
                    {plan.days.map((day) => {
                      const meals = ['Breakfast','Lunch','Dinner','Snack']
                      const dayTotal = meals.reduce((acc, m) => {
                        const items = day.meals?.[m] || []
                        return { cal: acc.cal + items.reduce((s, e) => s + e.calories, 0), pro: acc.pro + items.reduce((s, e) => s + e.protein, 0) }
                      }, { cal: 0, pro: 0 })
                      return (
                        <div key={day.id} className="bg-surface border border-border rounded-xl px-3 py-2">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="font-display font-bold text-xs text-cream tracking-widest">{day.label}</p>
                            <p className="font-mono text-xs text-muted">{dayTotal.cal.toFixed(0)} kcal</p>
                          </div>
                          {meals.map((m) => {
                            const items = day.meals?.[m] || []
                            if (items.length === 0) return null
                            return (
                              <div key={m} className="mb-1">
                                <p className="font-mono text-[10px] text-brown-light mb-0.5">{m}</p>
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

      {/* Create manually */}
      <button onClick={() => { setEditingPlan(null); setShowBuilder(true) }}
        className="w-full flex items-center justify-center gap-2 bg-surface border border-border text-muted font-display font-bold text-xs tracking-widest py-4 rounded-2xl transition-colors hover:border-brown/40 hover:text-cream">
        <Plus size={13} />
        CREATE PLAN MANUALLY
      </button>

      {/* AI generator */}
      <div className="bg-card border border-brown/20 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-brown-light" />
          <p className="font-display font-bold text-xs text-brown-light tracking-widest">AUTO-AI PLAN</p>
        </div>
        <p className="font-mono text-xs text-muted leading-relaxed">
          Claude will build a meal plan using your food database, matched to {client.name?.split(' ')[0]}'s targets.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-display text-xs text-muted tracking-widest block mb-1.5">DAYS</label>
            <select value={aiDays} onChange={(e) => setAiDays(Number(e.target.value))} className={inp}>
              {[1,2,3,4,5,6,7].map((d) => <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="font-display text-xs text-muted tracking-widest block mb-1.5">TARGETS</label>
            <div className="bg-surface border border-border rounded-xl px-4 py-3 font-mono text-xs text-muted">
              {client.goals?.calories} kcal · {client.goals?.protein}p
            </div>
          </div>
        </div>
        <div>
          <label className="font-display text-xs text-muted tracking-widest block mb-1.5">PREFERENCES / NOTES</label>
          <textarea
            value={aiPrefs} onChange={(e) => setAiPrefs(e.target.value)}
            placeholder="e.g. no dairy, high protein breakfast…"
            rows={2}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 font-mono text-sm text-cream placeholder-dim focus:outline-none focus:border-brown resize-none"
          />
        </div>
        {aiError && (
          <p className="font-mono text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">{aiError}</p>
        )}
        <button onClick={handleGenerate} disabled={aiLoading}
          className="w-full flex items-center justify-center gap-2 bg-brown hover:bg-brown-light disabled:opacity-50 text-bg font-display font-bold text-sm tracking-widest py-4 rounded-xl transition-colors">
          {aiLoading
            ? <><div className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />GENERATING…</>
            : <><Sparkles size={15} />GENERATE WITH AI</>
          }
        </button>
        <p className="font-mono text-[10px] text-dim text-center">AI result opens in the plan builder for review</p>
      </div>
    </div>
  )
}

// ─── Client detail full-screen ────────────────────────────────────────────────
function ClientDetailScreen({ client, onBack }) {
  const { updateClientGoals, updateClientInfo, removeClient, getClientTotalsForDate } = useStore()
  const [tab,       setTab]       = useState('overview')
  const [editGoals, setEditGoals] = useState(false)
  const [goals,     setGoals]     = useState({ ...client.goals })
  const [editName,  setEditName]  = useState(false)
  const [name,      setName]      = useState(client.name)
  const [email,     setEmail]     = useState(client.email || '')

  const today      = format(new Date(), 'yyyy-MM-dd')
  const todayTotals = getClientTotalsForDate(client.id, today)

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
    return { date, logged: (client.log?.[date] || []).length > 0 }
  })
  const compliance = Math.round((days.filter((d) => d.logged).length / 7) * 100)

  const saveGoals = () => {
    updateClientGoals(client.id, { calories: Number(goals.calories), protein: Number(goals.protein), carbs: Number(goals.carbs), fat: Number(goals.fat) })
    setEditGoals(false)
  }

  const saveName = () => {
    updateClientInfo(client.id, { name, email })
    setEditName(false)
  }

  const inp = 'w-full bg-card border border-border rounded-xl px-4 py-3 font-mono text-sm text-cream focus:outline-none focus:border-brown'

  return (
    <div className="fixed inset-0 bg-bg z-40 flex flex-col anim-slide-right overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-14 pb-4 border-b border-border bg-surface flex-shrink-0">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-cream hover:bg-card transition-colors flex-shrink-0">
          <ChevronLeft size={22} />
        </button>
        <div className="w-10 h-10 rounded-full bg-brown/20 border border-brown/30 flex items-center justify-center flex-shrink-0">
          <span className="font-display font-black text-base text-brown-light">{client.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          {editName ? (
            <div className="flex items-center gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-bg border border-border rounded-lg px-2 py-1.5 font-mono text-sm text-cream focus:outline-none focus:border-brown" />
              <button onClick={saveName} className="text-olive-light"><Check size={16} /></button>
            </div>
          ) : (
            <button onClick={() => setEditName(true)} className="flex items-center gap-1.5 group w-full">
              <p className="font-display font-bold text-base text-cream truncate">{client.name}</p>
              <Edit2 size={12} className="text-dim group-hover:text-muted flex-shrink-0" />
            </button>
          )}
          <p className="font-mono text-xs text-muted truncate">{client.email || 'No email'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border flex-shrink-0 bg-surface">
        {[{ id: 'overview', label: 'OVERVIEW' }, { id: 'mealplans', label: 'MEAL PLANS' }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-3.5 font-display font-bold text-xs tracking-widest transition-colors ${
              tab === t.id ? 'text-cream border-b-2 border-brown' : 'text-muted'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'overview' && (
          <div className="p-5 space-y-6">
            {/* Today's intake */}
            <div>
              <p className="font-display text-xs text-muted tracking-widest mb-3">TODAY'S INTAKE</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'CALORIES', val: todayTotals.calories, goal: client.goals.calories, text: 'text-cream',           bar: 'bg-brown'     },
                  { label: 'PROTEIN',  val: todayTotals.protein,  goal: client.goals.protein,  text: 'text-olive-light',    bar: 'bg-olive'     },
                  { label: 'CARBS',    val: todayTotals.carbs,    goal: client.goals.carbs,    text: 'text-brown-light',    bar: 'bg-brown'     },
                  { label: 'FAT',      val: todayTotals.fat,      goal: client.goals.fat,      text: 'text-slategray-light',bar: 'bg-slategray' },
                ].map(({ label, val, goal, text, bar }, i) => {
                  const pct = Math.min(Math.round((val / (goal || 1)) * 100), 100)
                  return (
                    <div key={label} className="bg-card border border-border rounded-2xl p-3">
                      <div className="flex justify-between items-baseline mb-1.5">
                        <p className="font-display text-xs text-muted tracking-widest">{label}</p>
                        <p className="font-mono text-xs text-dim">{pct}%</p>
                      </div>
                      <p className={`font-display font-black text-xl ${text}`}>
                        <AnimatedNumber value={val} duration={700} delay={i * 60} />
                        <span className="font-normal text-muted text-xs"> / {goal}</span>
                      </p>
                      <div className="mt-2 w-full bg-dim rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full bar-fill ${pct >= 100 ? 'bg-red-400' : bar}`}
                          style={{ width: `${pct}%`, animationDelay: `${i * 60 + 100}ms` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 7-day compliance */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-display text-xs text-muted tracking-widest">7-DAY COMPLIANCE</p>
                <span className="font-display font-bold text-sm text-olive-light">
                  <AnimatedNumber value={compliance} duration={800} />%
                </span>
              </div>
              <div className="flex gap-1.5">
                {days.map((d, i) => (
                  <div key={d.date} className="flex-1">
                    <div className={`h-10 rounded-lg ${d.logged ? 'bg-olive/40 border border-olive/30' : 'bg-dim'} flex items-center justify-center`}>
                      {d.logged && <div className="w-1.5 h-1.5 rounded-full bg-olive-light" />}
                    </div>
                    <p className="font-mono text-[10px] text-dim text-center mt-1">
                      {format(parseISO(d.date), 'E').charAt(0)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Nutrition targets */}
            <div>
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
                      { key: 'calories', label: 'CALORIES', color: 'text-cream'          },
                      { key: 'protein',  label: 'PROTEIN',  color: 'text-olive-light'    },
                      { key: 'carbs',    label: 'CARBS',    color: 'text-brown-light'    },
                      { key: 'fat',      label: 'FAT',      color: 'text-slategray-light' },
                    ].map(({ key, label, color }) => (
                      <div key={key}>
                        <label className={`font-display text-xs tracking-widest block mb-1.5 ${color}`}>{label}</label>
                        <input type="number" value={goals[key]}
                          onChange={(e) => setGoals((p) => ({ ...p, [key]: e.target.value }))}
                          className={inp} />
                      </div>
                    ))}
                  </div>
                  <button onClick={saveGoals}
                    className="w-full bg-brown hover:bg-brown-light text-bg font-display font-bold text-sm tracking-widest py-4 rounded-xl transition-colors">
                    SAVE TARGETS
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'KCAL', val: client.goals.calories, color: 'text-cream'          },
                    { label: 'PRO',  val: client.goals.protein,  color: 'text-olive-light'    },
                    { label: 'CARB', val: client.goals.carbs,    color: 'text-brown-light'    },
                    { label: 'FAT',  val: client.goals.fat,      color: 'text-slategray-light' },
                  ].map(({ label, val, color }, i) => (
                    <div key={label} className="bg-card border border-border rounded-xl p-2.5 text-center">
                      <p className={`font-display font-bold text-lg ${color}`}><AnimatedNumber value={val} duration={700} delay={i * 50} /></p>
                      <p className="font-mono text-xs text-muted">{label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Client since */}
            <p className="font-mono text-xs text-dim text-center">
              Client since {format(parseISO(client.createdAt), 'MMMM d, yyyy')}
            </p>

            {/* Danger zone */}
            <div className="border border-red-900/30 rounded-2xl p-4">
              <p className="font-display text-xs text-red-400/70 tracking-widest mb-3">DANGER ZONE</p>
              <button
                onClick={() => { removeClient(client.id); onBack() }}
                className="flex items-center gap-2 text-red-400 font-display font-bold text-xs tracking-widest"
              >
                <Trash2 size={13} />
                REMOVE CLIENT
              </button>
            </div>
          </div>
        )}

        {tab === 'mealplans' && (
          <div className="p-5">
            <MealPlansTab clientId={client.id} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function MobileClients() {
  const { clients, getClientTotalsForDate, viewingClientId, viewingClientTab, setViewingClientId } = useStore()

  const [showAddScreen, setShowAddScreen] = useState(false)
  const [selectedId,    setSelectedId]    = useState(viewingClientId || null)
  const [initialTab,    setInitialTab]    = useState(viewingClientTab || 'overview')
  const [search,        setSearch]        = useState('')

  const today = format(new Date(), 'yyyy-MM-dd')

  // Consume the navigation hint from the store once
  useEffect(() => {
    if (viewingClientId) setViewingClientId(null, null)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedClient = clients.find((c) => c.id === selectedId)

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || (c.email && c.email.toLowerCase().includes(q))
  })

  return (
    <div className="px-4 pt-14 pb-6 w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 anim-fade-in-down">
        <div>
          <h2 className="font-display font-black text-3xl tracking-wider text-cream">
            <ScrambleText text="CLIENTS" duration={700} />
          </h2>
          <p className="font-mono text-xs text-muted mt-0.5">
            <AnimatedNumber value={clients.length} duration={600} /> {clients.length === 1 ? 'client' : 'clients'}
          </p>
        </div>
        <button
          onClick={() => setShowAddScreen(true)}
          className="flex items-center gap-1.5 bg-brown hover:bg-brown-light text-bg font-display font-bold text-xs tracking-widest px-4 py-3 rounded-xl transition-colors glow-hover"
        >
          <Plus size={14} />
          ADD
        </button>
      </div>

      {/* Search */}
      {clients.length > 0 && (
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-3 font-mono text-sm text-cream placeholder-muted focus:outline-none focus:border-brown transition-colors"
          />
        </div>
      )}

      {/* Client list */}
      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center anim-fade-in">
          <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mb-4">
            <User size={24} className="text-muted" />
          </div>
          <p className="font-display font-bold text-xl text-muted tracking-widest">NO CLIENTS</p>
          <p className="font-mono text-sm text-dim mt-2">Add your first client to get started</p>
          <button onClick={() => setShowAddScreen(true)}
            className="mt-5 bg-brown/20 border border-brown/30 text-brown-light font-display font-bold text-sm tracking-widest px-6 py-3 rounded-xl hover:bg-brown/30 transition-colors">
            + ADD FIRST CLIENT
          </button>
        </div>
      ) : (
        <div className="space-y-4 anim-fade-in">
          {filteredClients.map((client, i) => {
            const todayTotals = getClientTotalsForDate(client.id, today)
            const calPct = Math.min(Math.round((todayTotals.calories / (client.goals.calories || 1)) * 100), 100)
            const days7 = Array.from({ length: 7 }, (_, j) => {
              const d = format(subDays(new Date(), j), 'yyyy-MM-dd')
              return (client.log?.[d] || []).length > 0
            })
            const streak = days7.findIndex((logged) => !logged)
            const streakDays = streak === -1 ? 7 : streak

            return (
              <button
                key={client.id}
                onClick={() => { setInitialTab('overview'); setSelectedId(client.id) }}
                style={{ animationDelay: `${i * 45}ms` }}
                className="anim-fade-in-up w-full flex items-center gap-4 px-4 py-4 bg-card border border-border rounded-2xl text-left hover:border-brown/30 transition-colors active:bg-surface"
              >
                <div className="w-11 h-11 rounded-full bg-brown/20 border border-brown/30 flex items-center justify-center flex-shrink-0">
                  <span className="font-display font-black text-lg text-brown-light">
                    {client.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-mono text-sm text-cream truncate">{client.name}</p>
                    <span className="font-display font-bold text-xs text-muted ml-2 flex-shrink-0">{calPct}%</span>
                  </div>
                  <div className="w-full bg-dim rounded-full h-1.5 mb-1.5">
                    <div
                      className={`h-1.5 rounded-full bar-fill ${calPct >= 100 ? 'bg-red-400' : 'bg-brown'}`}
                      style={{ width: `${calPct}%` }}
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
                <ChevronRight size={14} className="text-dim flex-shrink-0" />
              </button>
            )
          })}

          {filteredClients.length === 0 && search && (
            <div className="text-center py-10">
              <p className="font-display text-lg text-muted tracking-widest">NO RESULTS</p>
            </div>
          )}
        </div>
      )}

      {/* Add client screen */}
      {showAddScreen && <AddClientScreen onClose={() => setShowAddScreen(false)} />}

      {/* Client detail screen */}
      {selectedClient && (
        <ClientDetailScreen
          key={selectedClient.id}
          client={selectedClient}
          initialTab={initialTab}
          onBack={() => { setSelectedId(null); setInitialTab('overview') }}
        />
      )}
    </div>
  )
}
