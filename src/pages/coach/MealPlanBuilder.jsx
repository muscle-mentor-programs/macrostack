import apiFetch from '../../lib/apiFetch'
import { useState, useMemo, useEffect, useDeferredValue } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Trash2, Search, Check, Mail, Download, ArrowLeft } from 'lucide-react'
import './MealPlanBuilder.css'
import useStore from '../../store'
import useIsMobile from '../../hooks/useIsMobile'
import { FOODS } from '../../data/foods'
import { mealPlanPDFBase64, downloadMealPlanPDF } from '../../lib/generateMealPlanPDF'
import { rankFoods, getRecentFoodIdsFromClients } from '../../utils/foodSearch'

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const WEIGHT_UNITS = ['g', 'ml', 'oz', 'fl oz', 'L']

// "1 bar" / "2 × bar" / "150 g" / "6 oz", for food picker info rows
function servingLabel(food) {
  if (!food.servingUnit) return `${food.servingSize}g`
  if (WEIGHT_UNITS.includes(food.servingUnit)) return `${food.servingSize} ${food.servingUnit} per serving`
  return `1 ${food.servingUnit} · ${food.servingSize}g`
}

// For items already in the plan: show realistic quantity (total grams for ingredients, count for packaged)
function entryServingLabel(entry) {
  if (!entry.servingUnit || entry.quantity == null) return '1 serving'
  if (WEIGHT_UNITS.includes(entry.servingUnit))
    return `${Math.round(entry.quantity * entry.servingSize)} ${entry.servingUnit}`
  return entry.quantity === 1 ? `1 ${entry.servingUnit}` : `${entry.quantity} × ${entry.servingUnit}`
}

function dayTotals(day) {
  if (!day) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
  return MEALS.reduce(
    (acc, m) => {
      const items = day.meals[m] || []
      return {
        calories: acc.calories + items.reduce((s, e) => s + e.calories, 0),
        protein:  acc.protein  + items.reduce((s, e) => s + e.protein,  0),
        carbs:    acc.carbs    + items.reduce((s, e) => s + e.carbs,    0),
        fat:      acc.fat      + items.reduce((s, e) => s + e.fat,      0),
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

function makeEmptyDay(label) {
  return {
    id:    'day_' + Math.random().toString(36).slice(2),
    label,
    meals: { Breakfast: [], Lunch: [], Dinner: [], Snack: [] },
  }
}

export default function MealPlanBuilder({ client, initialPlan = null, onSave, onClose }) {
  const { customFoods, clients, setNavHidden, hiddenFoodIds } = useStore()
  const isMobile = useIsMobile()

  // Hide the bottom nav while this full-screen overlay is open
  useEffect(() => {
    setNavHidden(true)
    return () => setNavHidden(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const allFoods = useMemo(
    () => [...FOODS.filter((f) => !(hiddenFoodIds || []).includes(f.id)), ...(customFoods || [])],
    [customFoods, hiddenFoodIds]
  )

  // Foods used by any client in the last 30 days float to the top
  const recentFoodIds = useMemo(() => getRecentFoodIdsFromClients(clients), [clients])

  // ── Plan meta ─────────────────────────────────────────────────
  const [planName, setPlanName] = useState(initialPlan?.planName || '')
  const [days, setDays]         = useState(() =>
    initialPlan?.days?.length
      ? initialPlan.days
      : Array.from({ length: 7 }, (_, i) => makeEmptyDay(`Day ${i + 1}`))
  )
  const [activeDayIdx, setActiveDayIdx] = useState(0)
  const activeDay = days[activeDayIdx]

  // ── Food search panel ─────────────────────────────────────────
  const [query, setQuery]         = useState('')
  const [targetMeal, setTargetMeal] = useState('Breakfast')
  const [selectedFood, setSelectedFood] = useState(null)
  const [quantity, setQuantity]   = useState('1')
  const [saved, setSaved]         = useState(false)
  const [emailStatus, setEmailStatus] = useState('idle') // 'idle' | 'sending' | 'sent' | 'error'
  const [downloading, setDownloading] = useState(false)
  const [showFoodPanel, setShowFoodPanel] = useState(false) // mobile: toggle food search panel
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [visibleCount, setVisibleCount] = useState(50)
  const deferredQuery = useDeferredValue(query)
  const validQuantity = Number.isFinite(Number(quantity)) && Number(quantity) > 0
  const dirty = planName !== (initialPlan?.planName || '') || JSON.stringify(days) !== JSON.stringify(initialPlan?.days || [])
  const closeEditor = () => {
    if (!saving && (!dirty || window.confirm('Discard your unsaved meal plan changes?'))) onClose()
  }

  const filtered = useMemo(() => rankFoods(allFoods, deferredQuery, recentFoodIds),
    [allFoods, deferredQuery, recentFoodIds])

  const scaledPreview = selectedFood
    ? {
        calories: parseFloat((selectedFood.calories * (Number(quantity) || 0)).toFixed(1)),
        protein:  parseFloat((selectedFood.protein  * (Number(quantity) || 0)).toFixed(1)),
        carbs:    parseFloat((selectedFood.carbs    * (Number(quantity) || 0)).toFixed(1)),
        fat:      parseFloat((selectedFood.fat      * (Number(quantity) || 0)).toFixed(1)),
      }
    : null

  // ── Mutations ─────────────────────────────────────────────────
  const addItem = () => {
    if (!selectedFood || !validQuantity) return
    const entry = {
      id:          crypto.randomUUID(),
      foodId:      selectedFood.id,
      name:        selectedFood.name,
      brand:       selectedFood.brand || '',
      quantity:    Number(quantity) || 1,
      servingSize: selectedFood.servingSize,
      servingUnit: selectedFood.servingUnit || 'g',
      calories:    scaledPreview.calories,
      protein:     scaledPreview.protein,
      carbs:       scaledPreview.carbs,
      fat:         scaledPreview.fat,
    }
    setDays((prev) =>
      prev.map((d, i) =>
        i !== activeDayIdx
          ? d
          : {
              ...d,
              meals: {
                ...d.meals,
                [targetMeal]: [...(d.meals[targetMeal] || []), entry],
              },
            }
      )
    )
    setSelectedFood(null)
    setQuantity('1')
    if (isMobile) setShowFoodPanel(false)
  }

  const removeItem = (mealName, itemId) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i !== activeDayIdx
          ? d
          : {
              ...d,
              meals: {
                ...d.meals,
                [mealName]: d.meals[mealName].filter((e) => e.id !== itemId),
              },
            }
      )
    )
  }

  const addDay = () => {
    const newDay = makeEmptyDay(`Day ${days.length + 1}`)
    setDays((prev) => [...prev, newDay])
    setActiveDayIdx(days.length)
  }

  const removeDay = (idx) => {
    if (days.length <= 1) return
    if (!window.confirm(`Delete ${days[idx].label} and its meals from this draft?`)) return
    setDays((prev) => prev.filter((_, i) => i !== idx))
    setActiveDayIdx((prev) => Math.min(prev, days.length - 2))
  }

  const handleSave = async () => {
    if (!planName.trim() || saving) return
    setSaving(true)
    setSaveError('')
    try {
      await onSave({ planName: planName.trim(), days, aiGenerated: initialPlan?.aiGenerated || false })
      setSaved(true)
      onClose()
    } catch (error) {
      setSaveError(error.message || 'Could not save. Your draft is still here; please retry.')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!planName.trim()) return
    setDownloading(true)
    try {
      downloadMealPlanPDF(
        { planName: planName.trim(), days },
        client ? { name: client.name, goals: client.goals } : null
      )
    } finally {
      setTimeout(() => setDownloading(false), 600)
    }
  }

  const handleEmailPDF = async () => {
    if (!planName.trim() || !client?.email) return
    setEmailStatus('sending')
    try {
      const pdfBase64 = mealPlanPDFBase64(
        { planName: planName.trim(), days },
        { name: client.name, goals: client.goals }
      )
      const res = await apiFetch('/api/email/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to:         client.email,
          clientName: client.name,
          planName:   planName.trim(),
          pdfBase64,
          days:       days.map((d) => d.label),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setEmailStatus('sent')
      setTimeout(() => setEmailStatus('idle'), 3000)
    } catch (err) {
      console.error('[EmailPDF]', err)
      setEmailStatus('error')
      setTimeout(() => setEmailStatus('idle'), 3000)
    }
  }

  const totals  = dayTotals(activeDay)
  const goals   = client?.goals || { calories: 2000, protein: 150, carbs: 200, fat: 65 }

  return createPortal(
    <div className="mp-editor bg-bg anim-fade-in" role="dialog" aria-modal="true" aria-label="Meal plan editor" aria-busy={saving}>
      <fieldset disabled={saving} className="mp-fieldset">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div
        className="mp-toolbar border-b border-border/50 glass-panel"
      >
        <button onClick={closeEditor} aria-label="Close meal plan editor" className="text-muted hover:text-cream transition-colors">
          <X size={18} />
        </button>
        <div className="mp-title min-w-0">
          <label htmlFor="meal-plan-name" className="block text-xs text-muted mb-1">MEAL PLAN · {client?.name}</label>
          <input
            id="meal-plan-name"
            type="text"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="Plan name (e.g. Week 1 Cut)"
            className="w-full bg-transparent font-display font-black text-xl text-cream tracking-wide focus:outline-none placeholder-dim"
          />
        </div>
        {/* Download PDF */}
        <button
          onClick={handleDownloadPDF}
          disabled={!planName.trim() || downloading}
          title="Download as PDF"
          className="flex items-center gap-2 font-display font-bold text-sm tracking-widest px-4 py-2 rounded-lg transition-all disabled:opacity-40 bg-surface border border-border text-muted hover:text-cream hover:border-cream/40"
        >
          <Download size={14} />
          <span className="hidden sm:inline">{downloading ? 'SAVING…' : 'PDF'}</span>
        </button>

        {/* Email PDF */}
        {client?.email && (
          <button
            onClick={handleEmailPDF}
            disabled={!planName.trim() || emailStatus === 'sending'}
            title={`Email PDF to ${client.email}`}
            className={`flex items-center gap-2 font-display font-bold text-sm tracking-widest px-4 py-2 rounded-lg transition-all disabled:opacity-40 ${
              emailStatus === 'sent'
                ? 'bg-olive text-bg'
                : emailStatus === 'error'
                ? 'bg-red-900/50 text-red-300 border border-red-700'
                : 'bg-surface border border-border text-muted hover:text-cream hover:border-brown/60'
            }`}
          >
            <Mail size={14} />
            <span className="hidden sm:inline">
              {emailStatus === 'sending' ? 'SENDING…' : emailStatus === 'sent' ? 'SENT ✓' : emailStatus === 'error' ? 'ERROR' : 'EMAIL'}
            </span>
          </button>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!planName.trim() || saving}
          className={`flex items-center gap-2 font-display font-bold text-sm tracking-widest px-5 py-2 rounded-lg transition-all disabled:opacity-40 ${
            saved
              ? 'bg-olive text-bg'
              : 'bg-brown hover:bg-brown-light text-bg glow-hover'
          }`}
        >
          {saving ? 'SAVING…' : saved ? <><Check size={14} /> SAVED</> : 'SAVE PLAN'}
        </button>
      </div>
      {saveError && <p className="px-4 py-3 text-red-400" role="alert">{saveError}</p>}

      <div className="mp-body">
        {/* ── Left: day tabs + meal sections ──────────────── */}
        <div className={`mp-plan flex flex-col border-r border-border overflow-hidden ${
          isMobile
            ? showFoodPanel ? 'hidden' : 'flex w-full'
            : ''
        }`}>
          {/* Day tabs, fixed 7 days, distributed evenly */}
          <div className="mp-days border-b border-border">
            <div className="mp-day-scroll" aria-label="Plan days">
            {days.map((d, i) => (
              <button
                key={d.id}
                onClick={() => setActiveDayIdx(i)}
                aria-pressed={i === activeDayIdx}
                className={`shrink-0 px-3 font-display font-bold text-xs tracking-widest py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  i === activeDayIdx
                    ? 'bg-brown text-bg'
                    : 'bg-surface border border-border text-muted hover:text-cream'
                }`}
              >
                {d.label}
              </button>
            ))}
            </div>
            <button onClick={addDay} aria-label="Add day" className="text-brown-light"><Plus size={18} /></button>
            {days.length > 1 && (
              <button
                onClick={() => removeDay(activeDayIdx)}
                aria-label="Delete selected day"
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-dim hover:text-red-400 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>

          {/* Daily totals vs goals */}
          <div className="grid grid-cols-4 border-b border-border flex-shrink-0">
            {[
              { label: 'KCAL', val: totals.calories, goal: goals.calories, color: 'text-cream' },
              { label: 'PRO',  val: totals.protein,  goal: goals.protein,  color: 'text-olive-light' },
              { label: 'CARB', val: totals.carbs,    goal: goals.carbs,    color: 'text-brown-light' },
              { label: 'FAT',  val: totals.fat,      goal: goals.fat,      color: 'text-slategray-light' },
            ].map(({ label, val, goal, color }, i) => {
              const pct = goal ? Math.min(Math.round((val / goal) * 100), 999) : 0
              const over = pct > 110
              return (
                <div key={label} className={`py-3 text-center ${i < 3 ? 'border-r border-border' : ''}`}>
                  <p className={`font-display font-black text-base ${over ? 'text-red-400' : color}`}>
                    {Math.round(val)}
                  </p>
                  <p className="font-mono text-[9px] text-muted">{label} / {goal}</p>
                  <p className={`font-mono text-[9px] ${over ? 'text-red-400' : 'text-dim'}`}>{pct}%</p>
                </div>
              )
            })}
          </div>

          {/* Meal sections */}
          <div className="mp-meals flex-1 overflow-y-auto p-4 space-y-3">
            {MEALS.map((meal) => {
              const items = activeDay?.meals[meal] || []
              const mTotal = items.reduce(
                (a, e) => ({ cal: a.cal + e.calories, pro: a.pro + e.protein }),
                { cal: 0, pro: 0 }
              )
              return (
                <div key={meal} className="glass-card border border-border rounded-2xl overflow-hidden">
                  {/* Meal header */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-xs tracking-widest text-cream">
                        {meal.toUpperCase()}
                      </span>
                      {items.length > 0 && (
                        <span className="font-mono text-xs text-muted">
                          {mTotal.cal.toFixed(0)} kcal · {mTotal.pro.toFixed(0)}p
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => { setTargetMeal(meal); if (isMobile) setShowFoodPanel(true) }}
                      aria-label={`Add food to ${meal}`}
                      className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                        targetMeal === meal
                          ? 'bg-brown text-bg'
                          : 'bg-brown/15 text-brown-light hover:bg-brown hover:text-bg'
                      }`}
                    >
                      <Plus size={12} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Items */}
                  {items.length === 0 ? (
                    <div className="px-4 py-3 text-center">
                      <p className="font-mono text-xs text-dim">
                        {isMobile ? 'Tap + to add foods' : 'Empty, select a food on the right →'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {items.map((entry) => (
                        <div key={entry.id} className="flex items-center px-4 py-2.5 gap-2 group">
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-xs text-cream truncate">{entry.name}</p>
                            <p className="font-mono text-[10px] text-muted">
                              {entryServingLabel(entry)}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-display font-bold text-xs text-cream">{entry.calories.toFixed(0)} kcal</p>
                            <p className="font-mono text-[10px] text-olive-light">
                              {entry.protein.toFixed(0)}p{' '}
                              <span className="text-brown-light">{entry.carbs.toFixed(0)}c</span>{' '}
                              <span className="text-slategray-light">{entry.fat.toFixed(0)}f</span>
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(meal, entry.id)}
                            aria-label={`Remove ${entry.name}`}
                            className="text-muted hover:text-red-400 transition-colors p-1 flex-shrink-0"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Right: food search ───────────────────────────── */}
        <div className={`mp-foods flex-1 flex-col overflow-hidden ${
          isMobile ? (showFoodPanel ? 'flex' : 'hidden') : 'flex'
        }`}>
          {/* Search + filter */}
          <div className="px-4 py-3 border-b border-border space-y-3 flex-shrink-0 bg-card">
            <div className="flex items-center flex-wrap gap-2">
              {isMobile && (
                <button
                  onClick={() => setShowFoodPanel(false)}
                  aria-label="Back to plan"
                  className="text-muted hover:text-cream transition-colors mr-1"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <p className="font-display font-bold text-xs text-muted tracking-widest">{activeDay?.label} · ADD TO:</p>
              {MEALS.map((m) => (
                <button
                  key={m}
                  onClick={() => setTargetMeal(m)}
                  className={`font-display font-bold text-xs tracking-widest px-2.5 py-1 rounded transition-colors ${
                    targetMeal === m
                      ? 'bg-brown text-bg'
                      : 'bg-surface border border-border text-muted hover:text-cream'
                  }`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search foods or brands..."
                aria-label="Search foods or brands"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setVisibleCount(50) }}
                className="w-full bg-surface border border-border rounded-lg pl-8 pr-3 py-2 font-mono text-sm text-cream placeholder-muted focus:outline-none focus:border-brown"
              />
            </div>
          </div>

          {/* Food list */}
          <div className="mp-results flex-1 overflow-y-auto" aria-busy={query !== deferredQuery}>
            {filtered.slice(0, visibleCount).map((food) => (
              <button
                key={food.id}
                onClick={() => { setSelectedFood(food); setQuantity('1') }}
                className={`w-full flex items-center justify-between px-5 py-3 border-b border-border/50 text-left transition-colors ${
                  selectedFood?.id === food.id ? 'bg-brown/10 border-l-2 border-l-brown' : 'hover:bg-card'
                }`}
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm text-cream truncate">{food.name}</p>
                  <p className="font-mono text-xs text-muted">
                    {food.brand ? `${food.brand} · ` : ''}{servingLabel(food)}
                  </p>
                </div>
                <div className="text-right font-mono text-xs text-muted ml-3 flex-shrink-0">
                  <p className="text-cream">{food.calories} kcal</p>
                  <p className="text-olive-light">
                    {food.protein}p{' '}
                    <span className="text-brown-light">{food.carbs}c</span>{' '}
                    <span className="text-slategray-light">{food.fat}f</span>
                  </p>
                </div>
              </button>
            ))}
            {filtered.length > visibleCount && <button className="w-full p-4 text-brown-light" onClick={() => setVisibleCount(n => n + 50)}>Show more foods ({filtered.length - visibleCount} remaining)</button>}
            {filtered.length === 0 && (
              <div className="flex items-center justify-center h-40">
                <p className="font-display text-lg text-muted tracking-widest">NO RESULTS</p>
              </div>
            )}
          </div>

          {/* Selected food config */}
          {selectedFood && (
            <div className="mp-portion border-t border-border/50 bg-card px-4 py-4 space-y-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm text-cream truncate flex-1">{selectedFood.name}</p>
                <span className="font-mono text-xs text-muted ml-2">{servingLabel(selectedFood)}</span>
              </div>
              <div className="mp-portion-controls">
                <div className="flex-1">
                  <label htmlFor="meal-food-quantity" className="font-display text-xs text-muted tracking-widest block mb-1.5">SERVINGS</label>
                  <input
                    id="meal-food-quantity"
                    type="text"
                    inputMode="decimal"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 font-mono text-base text-cream focus:outline-none focus:border-brown"
                  />
                </div>
                {scaledPreview && (
                  <div className="flex gap-2 flex-shrink-0">
                    {[
                      { label: 'KCAL', val: scaledPreview.calories, color: 'text-cream' },
                      { label: 'PRO',  val: scaledPreview.protein,  color: 'text-olive-light' },
                      { label: 'CARB', val: scaledPreview.carbs,    color: 'text-brown-light' },
                      { label: 'FAT',  val: scaledPreview.fat,      color: 'text-slategray-light' },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="border border-border/50 rounded-lg px-2.5 py-1.5 text-center card-inset">
                        <p className={`font-display font-bold text-sm ${color}`}>{val.toFixed(0)}</p>
                        <p className="font-mono text-[9px] text-muted">{label}</p>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={addItem}
                  disabled={!validQuantity}
                  className="bg-brown hover:bg-brown-light text-bg font-display font-bold text-sm tracking-widest px-4 py-2.5 rounded-lg transition-colors glow-hover flex-shrink-0"
                >
                  ADD TO {targetMeal.toUpperCase()}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </fieldset>
    </div>, document.body
  )
}
