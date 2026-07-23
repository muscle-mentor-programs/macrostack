import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { format, addDays, subDays, parseISO } from 'date-fns'
import {
  ChevronLeft, ChevronRight, Plus, Search, ArrowLeft, Trash2,
  Scan, Check, ChevronDown, Lock, Zap, BookmarkPlus, UtensilsCrossed,
} from 'lucide-react'
import useStore from '../../store'
import { FOODS, MEALS } from '../../data/foods'
import ScrambleText from '../../components/ScrambleText'
import BarcodeScanner from '../../components/BarcodeScanner'
import ScannedFoodModal from '../../components/ScannedFoodModal'
import { rankFoods, getRecentFoodIds } from '../../utils/foodSearch'
import { successHaptic, deleteHaptic } from '../../utils/haptics'
import AnimatedNumber from '../../components/AnimatedNumber'
import useSubscription from '../../hooks/useSubscription'

// Meals always shown even when empty
const PRIMARY_MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const WEIGHT_UNITS  = ['g', 'ml', 'oz', 'fl oz', 'L']

function servingLabel(food) {
  if (!food.servingUnit) return `${food.servingSize}g`
  if (WEIGHT_UNITS.includes(food.servingUnit)) return `${food.servingSize} ${food.servingUnit} per serving`
  return `1 ${food.servingUnit} · ${food.servingSize}g`
}

function entryServingLabel(entry) {
  if (!entry.servingUnit || entry.quantity == null) return entry.amount ? `${entry.amount}g` : '1 serving'
  if (WEIGHT_UNITS.includes(entry.servingUnit)) return `${Math.round(entry.quantity * entry.servingSize)} ${entry.servingUnit}`
  return entry.quantity === 1 ? `1 ${entry.servingUnit}` : `${entry.quantity} × ${entry.servingUnit}`
}

// ─── Full-screen food selector (replaces modal) ──────────────────────────────
function FoodSelectorPage({ onClose, clientId, logDate, defaultMeal }) {
  const {
    addClientEntry, customFoods, scannedFoods, overrideFoods, hiddenFoodIds,
    clients, currentUser, setActivePage,
    myMeals, fetchMyMeals, deleteMeal,
  } = useStore()
  // Effective access via the hook — includes Pro-included-with-a-coach
  const { hasAccess: canScan } = useSubscription()

  const [query,       setQuery]       = useState('')
  const [selected,    setSelected]    = useState(null)
  const [quantity,    setQuantity]    = useState('1')
  const [grams,       setGrams]       = useState('')
  const [meal,        setMeal]        = useState(defaultMeal || 'Breakfast')
  const [showScanner, setShowScanner] = useState(false)
  const [scannedUPC,  setScannedUPC]  = useState(null)
  // Quick add — log raw calories/macros without a database food
  const [quickAdd, setQuickAdd] = useState(null) // { name, cal, pro, carb, fat }

  useEffect(() => { fetchMyMeals() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Saved meals matching the search (all of them when the query is empty)
  const mealMatches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return myMeals
    return myMeals.filter((m) => (m.name || '').toLowerCase().includes(q))
  }, [myMeals, query])

  // One tap re-logs every item in the meal — exact portions, current meal slot
  const handleLogMeal = (m) => {
    for (const it of (m.items || [])) {
      addClientEntry(clientId, { ...it, meal, date: logDate })
    }
    successHaptic()
    onClose()
  }

  const overrideIds = useMemo(() => new Set(overrideFoods.map((f) => f.id)), [overrideFoods])
  const hiddenIds   = useMemo(() => new Set(hiddenFoodIds || []), [hiddenFoodIds])

  const allFoods = useMemo(() => [
    ...FOODS.filter((f) => !overrideIds.has(f.id) && !hiddenIds.has(f.id)),
    ...overrideFoods.filter((f) => !hiddenIds.has(f.id)),
    ...customFoods,
    ...scannedFoods,
  ], [overrideIds, hiddenIds, overrideFoods, customFoods, scannedFoods])

  const recentFoodIds = useMemo(() => {
    const client = clients.find((c) => c.id === clientId)
    return getRecentFoodIds(client?.log || {})
  }, [clients, clientId])

  const filtered = useMemo(() => rankFoods(allFoods, query, recentFoodIds),
    [allFoods, query, recentFoodIds])

  // Top recently-logged foods — one-tap chips above the list (empty query only)
  const recentChips = useMemo(() => {
    if (!recentFoodIds?.size) return []
    return [...recentFoodIds.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id]) => allFoods.find((f) => f.id === id))
      .filter(Boolean)
  }, [recentFoodIds, allFoods])

  const hasGrams = !!(selected?.servingSize)
  const perG = hasGrams ? {
    cal:  selected.calories / selected.servingSize,
    pro:  selected.protein  / selected.servingSize,
    carb: selected.carbs    / selected.servingSize,
    fat:  selected.fat      / selected.servingSize,
  } : null

  const scaled = selected ? (hasGrams ? {
    calories: perG.cal  * Number(grams  || 0),
    protein:  perG.pro  * Number(grams  || 0),
    carbs:    perG.carb * Number(grams  || 0),
    fat:      perG.fat  * Number(grams  || 0),
  } : {
    calories: selected.calories * (Number(quantity) || 0),
    protein:  selected.protein  * (Number(quantity) || 0),
    carbs:    selected.carbs    * (Number(quantity) || 0),
    fat:      selected.fat      * (Number(quantity) || 0),
  }) : null

  // With the 'last' serving preference, foods open at the amount they were
  // last logged at — repeat eaters skip re-entering their usual portions.
  const servingPref = clients.find((c) => c.id === clientId)?.servingPref || 'default'
  const lastLoggedQty = (foodId) => {
    if (!foodId) return null
    const log = clients.find((c) => c.id === clientId)?.log || {}
    for (const d of Object.keys(log).sort().reverse()) {
      const entries = log[d]
      for (let i = entries.length - 1; i >= 0; i--) {
        const e = entries[i]
        if (e.foodId === foodId && Number(e.quantity) > 0) return Number(e.quantity)
      }
    }
    return null
  }

  const handleSelectFood = (food) => {
    setSelected(food)
    const last = servingPref === 'last' ? lastLoggedQty(food.id) : null
    const q = last ?? 1
    setQuantity(String(q))
    setGrams(food.servingSize ? String(Math.round(q * food.servingSize)) : '')
  }

  const handleQtyChange = (val) => {
    setQuantity(val)
    if (selected?.servingSize && val !== '')
      setGrams(String(Math.round(Math.max(0, Number(val)) * selected.servingSize)))
  }

  const handleGramsChange = (val) => {
    setGrams(val)
    if (selected?.servingSize && val !== '')
      setQuantity(String(+(Math.max(0, Number(val)) / selected.servingSize).toFixed(3)))
  }

  const handleAdd = () => {
    if (!selected) return
    const qty = hasGrams
      ? +(Number(grams || 0) / selected.servingSize).toFixed(3)
      : Number(quantity) || 1
    addClientEntry(clientId, {
      name:        selected.name,
      brand:       selected.brand || '',
      foodId:      selected.id,
      quantity:    qty,
      servingSize: selected.servingSize,
      servingUnit: selected.servingUnit,
      meal,
      calories:    scaled.calories,
      protein:     scaled.protein,
      carbs:       scaled.carbs,
      fat:         scaled.fat,
      date:        logDate,
    })
    successHaptic()
    onClose()
  }

  const handleScan      = (upc) => { setShowScanner(false); setScannedUPC(upc) }
  const handleAfterSave = (food) => { setScannedUPC(null); handleSelectFood(food) }

  // ── Quick add — raw strings while typing (allows blank + decimals) ──
  const qaClean = (v) => {
    const s = String(v).replace(/[^0-9.]/g, '')
    const i = s.indexOf('.')
    return i === -1 ? s : s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '')
  }
  const qaSet = (field) => (e) =>
    setQuickAdd((q) => ({ ...q, [field]: field === 'name' ? e.target.value : qaClean(e.target.value) }))

  const qaNum  = (v) => parseFloat(v) || 0
  const qaPro  = quickAdd ? qaNum(quickAdd.pro)  : 0
  const qaCarb = quickAdd ? qaNum(quickAdd.carb) : 0
  const qaFat  = quickAdd ? qaNum(quickAdd.fat)  : 0
  // Calories left blank → derive from macros (4/4/9)
  const qaCal  = quickAdd
    ? (quickAdd.cal !== '' ? qaNum(quickAdd.cal) : Math.round(qaPro * 4 + qaCarb * 4 + qaFat * 9))
    : 0
  const qaValid = qaCal > 0 || qaPro > 0 || qaCarb > 0 || qaFat > 0

  const handleQuickAdd = () => {
    if (!qaValid) return
    addClientEntry(clientId, {
      name:        quickAdd.name.trim() || 'Quick Add',
      brand:       '',
      foodId:      null,
      quantity:    1,
      servingSize: null,
      servingUnit: null,
      meal,
      calories:    qaCal,
      protein:     qaPro,
      carbs:       qaCarb,
      fat:         qaFat,
      date:        logDate,
    })
    successHaptic()
    onClose()
  }

  const inpCls   = 'w-full bg-surface border border-border rounded-xl px-3 py-2 font-mono text-sm text-cream focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/30 transition-colors'
  const labelCls = 'font-display text-xs tracking-widest text-muted block mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg anim-page-slide-up">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 pt-mobile-header pb-4 border-b border-border glass-panel accent-line flex-shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-cream hover:bg-surface transition-colors flex-shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-black text-xl tracking-wide text-cream">ADD FOOD</h2>
          <p className="font-mono text-xs text-muted">{meal.toUpperCase()}</p>
        </div>
        <button
          onClick={() => { if (canScan) { setShowScanner(true) } else { onClose(); setActivePage('upgrade') } }}
          title={canScan ? 'Scan barcode' : 'Premium — scan barcodes'}
          className="relative w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-cream hover:bg-surface transition-colors flex-shrink-0"
        >
          <Scan size={20} />
          {!canScan && (
            <span
              className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-accent)' }}
            >
              <Lock size={8} className="text-bg" />
            </span>
          )}
        </button>
      </div>

      {/* ── Search bar ── */}
      <div className="px-4 py-3 border-b border-border flex-shrink-0">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            autoFocus
            type="text"
            placeholder="Search foods or brands…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 font-mono text-sm text-cream placeholder:text-dim focus:outline-none focus:border-brown transition-colors"
          />
        </div>
      </div>

      {/* ── Food list — capped to avoid freezing on 15,000+ items ── */}
      {(() => {
        const limit    = query.trim() ? 100 : 40
        const visible  = filtered.slice(0, limit)
        const overflow = filtered.length - limit
        return (
      <div className="flex-1 overflow-y-auto">
        {/* Quick add — log calories/macros directly, no database food needed */}
        <div className="px-4 pt-3">
          <button
            onClick={() => setQuickAdd({ name: '', cal: '', pro: '', carb: '', fat: '' })}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-border bg-surface text-left transition-colors hover:border-muted press"
          >
            <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)' }}>
              <Zap size={14} style={{ color: 'var(--color-accent)' }} />
            </span>
            <span className="min-w-0">
              <span className="block font-display font-bold text-xs tracking-widest text-cream">QUICK ADD</span>
              <span className="block font-mono text-[10px] text-muted">Log calories & macros directly</span>
            </span>
          </button>
        </div>
        {/* My meals — private saved bundles, one tap logs every item */}
        {mealMatches.length > 0 && (
          <div className="px-4 pt-3 anim-fade-in">
            <p className="font-mono text-[9px] tracking-[0.3em] text-dim mb-2">MY MEALS</p>
            <div className="space-y-2">
              {mealMatches.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2.5 rounded-xl border border-olive/25 bg-olive/[0.07] px-3 py-2.5"
                >
                  <button
                    onClick={() => handleLogMeal(m)}
                    className="flex-1 flex items-center gap-2.5 text-left min-w-0 press"
                  >
                    <span className="w-7 h-7 rounded-lg bg-olive/15 flex items-center justify-center flex-shrink-0">
                      <UtensilsCrossed size={13} className="text-olive-light" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-mono text-sm text-cream truncate">{m.name}</span>
                      <span className="block font-mono text-[10px] text-muted">
                        {(m.items || []).length} item{(m.items || []).length === 1 ? '' : 's'} · {Math.round(m.calories)} kcal · {Math.round(m.protein)}p
                      </span>
                    </span>
                  </button>
                  <button
                    onClick={() => deleteMeal(m.id)}
                    title="Delete this saved meal"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-dim hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Quick-add chips — most-logged foods, one tap to open serving popup */}
        {!query.trim() && recentChips.length > 0 && (
          <div className="px-4 pt-3 pb-1 anim-fade-in">
            <p className="font-mono text-[9px] tracking-[0.3em] text-dim mb-2">FREQUENT</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
              {recentChips.map((food) => (
                <button
                  key={food.id}
                  onClick={() => handleSelectFood(food)}
                  className="flex-shrink-0 max-w-[150px] px-3 py-2 rounded-xl border border-brown/25 bg-brown/[0.08] text-left transition-colors press"
                >
                  <p className="font-mono text-xs text-cream truncate">{food.name}</p>
                  <p className="font-mono text-[10px] text-muted">{food.calories} kcal</p>
                </button>
              ))}
            </div>
          </div>
        )}
        {visible.map((food) => (
          <button
            key={food.id}
            onClick={() => handleSelectFood(food)}
            className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/[0.04] press-row"
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              borderLeft: selected?.id === food.id ? '2px solid #9A7B55' : '2px solid transparent',
              background: selected?.id === food.id ? 'rgba(154,123,85,0.08)' : undefined,
            }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <p className="font-mono text-sm text-cream truncate">{food.name}</p>
                {food.id.startsWith('scanned_') && (
                  <span className="font-display text-[9px] px-1.5 py-0.5 rounded flex-shrink-0 text-olive-light bg-olive/10 border border-olive/20">
                    SCANNED
                  </span>
                )}
              </div>
              <p className="font-mono text-xs text-muted">
                {food.brand ? `${food.brand} · ` : ''}{servingLabel(food)}
              </p>
            </div>
            <div className="text-right font-mono text-xs ml-3 flex-shrink-0">
              <p className="text-cream">{food.calories} kcal</p>
              <p>
                <span className="text-olive-light">{food.protein}p </span>
                <span className="text-brown-light">{food.carbs}c </span>
                <span className="text-slategray-light">{food.fat}f</span>
              </p>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="font-display text-lg tracking-widest text-muted">NO RESULTS</p>
            <p className="font-mono text-xs text-dim mt-2">Try scanning a barcode to add new foods</p>
          </div>
        )}
        {overflow > 0 && (
          <p className="text-center py-5 font-mono text-xs text-dim">
            +{overflow} more — type to refine
          </p>
        )}
      </div>
        )
      })()}

      {/* ── Serving popup — centered modal overlay ── */}
      {selected && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-5"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-sm bg-surface border border-border rounded-2xl p-4 space-y-3 anim-spring-in shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Food name + dismiss */}
            <div className="flex items-start justify-between gap-2">
              <p className="font-mono text-sm text-cream leading-snug">{selected.name}</p>
              <button
                onClick={() => setSelected(null)}
                className="flex-shrink-0 text-muted hover:text-cream transition-colors mt-0.5"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Serving inputs */}
            {hasGrams ? (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={labelCls}>SERVINGS</label>
                  <input type="text" inputMode="decimal" value={quantity} onChange={(e) => handleQtyChange(e.target.value)} className={inpCls} />
                </div>
                <div>
                  <label className={labelCls}>GRAMS</label>
                  <input type="text" inputMode="decimal" value={grams} onChange={(e) => handleGramsChange(e.target.value)} className={inpCls} />
                </div>
                <div>
                  <label className={labelCls}>MEAL</label>
                  <select value={meal} onChange={(e) => setMeal(e.target.value)} className={inpCls}>
                    {MEALS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>QUANTITY</label>
                  <input type="text" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inpCls} />
                </div>
                <div>
                  <label className={labelCls}>MEAL</label>
                  <select value={meal} onChange={(e) => setMeal(e.target.value)} className={inpCls}>
                    {MEALS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Macro preview */}
            {scaled && (
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: 'KCAL', val: scaled.calories, cls: 'text-cream' },
                  { label: 'PRO',  val: scaled.protein,  cls: 'text-olive-light' },
                  { label: 'CARB', val: scaled.carbs,    cls: 'text-brown-light' },
                  { label: 'FAT',  val: scaled.fat,      cls: 'text-slategray-light' },
                ].map(({ label, val, cls }) => (
                  <div key={label} className="border border-border/50 rounded-lg p-1.5 text-center card-inset">
                    <p className={`font-display font-black text-sm ${cls}`}>{Number(val).toFixed(0)}</p>
                    <p className="font-mono text-[9px] text-muted">{label}</p>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleAdd}
              className="w-full btn-accent text-bg font-display font-bold text-sm tracking-widest py-3 rounded-xl transition-colors glow-hover"
            >
              ADD TO LOG
            </button>
          </div>
        </div>
      )}

      {/* ── Quick-add popup — same centered overlay as the serving popup ── */}
      {quickAdd && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-5"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={() => setQuickAdd(null)}
        >
          <div
            className="w-full max-w-sm bg-surface border border-border rounded-2xl p-4 space-y-3 anim-spring-in shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Zap size={14} style={{ color: 'var(--color-accent)' }} />
                <p className="font-display font-bold text-sm tracking-widest text-cream">QUICK ADD</p>
              </div>
              <button
                onClick={() => setQuickAdd(null)}
                className="flex-shrink-0 text-muted hover:text-cream transition-colors mt-0.5"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>NAME (OPTIONAL)</label>
                <input type="text" placeholder="Quick Add" value={quickAdd.name}
                  onChange={qaSet('name')} className={inpCls} />
              </div>
              <div>
                <label className={labelCls}>MEAL</label>
                <select value={meal} onChange={(e) => setMeal(e.target.value)} className={inpCls}>
                  {MEALS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { field: 'cal',  label: 'KCAL', ph: quickAdd.cal === '' && (qaPro || qaCarb || qaFat) ? String(qaCal) : '0' },
                { field: 'pro',  label: 'PRO',  ph: '0' },
                { field: 'carb', label: 'CARB', ph: '0' },
                { field: 'fat',  label: 'FAT',  ph: '0' },
              ].map(({ field, label, ph }) => (
                <div key={field}>
                  <label className={labelCls}>{label}</label>
                  <input type="text" inputMode="decimal" placeholder={ph}
                    value={quickAdd[field]} onChange={qaSet(field)} className={inpCls} />
                </div>
              ))}
            </div>

            <p className="font-mono text-[10px] text-dim leading-relaxed">
              Only know calories? That's enough. Leave KCAL blank and it's calculated
              from your macros automatically.
            </p>

            <button
              onClick={handleQuickAdd}
              disabled={!qaValid}
              className="w-full btn-accent text-bg font-display font-bold text-sm tracking-widest py-3 rounded-xl transition-colors glow-hover disabled:opacity-40"
            >
              ADD TO LOG{qaValid ? ` — ${Math.round(qaCal)} KCAL` : ''}
            </button>
          </div>
        </div>
      )}

      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
      {scannedUPC && (
        <ScannedFoodModal
          upc={scannedUPC}
          onClose={() => setScannedUPC(null)}
          onAfterSave={handleAfterSave}
        />
      )}
    </div>
  )
}

// ─── Main Log Page ───────────────────────────────────────────────────────────
export default function ClientLog() {
  const {
    activeClientId, clients,
    removeClientEntry, updateClientEntry, saveMeal,
    getClientTotalsForDate, logDate, setLogDate, setNavHidden,
  } = useStore()

  const [modalMeal, setModalMeal] = useState(null)
  // editState: { id, qty, grams, servingSize, perQty: { cal, pro, carb, fat } }
  const [editState, setEditState] = useState(null)
  // "Make this a meal" — { meal, items, name, saving, done }
  const [mealSave, setMealSave] = useState(null)

  // Hide BottomNav while food selector is open — prevents accidental HOME taps
  // on iOS Safari where fixed children are trapped inside overflow-y-auto containers
  useEffect(() => {
    setNavHidden(!!modalMeal)
    return () => setNavHidden(false)
  }, [modalMeal])

  const client  = clients.find((c) => c.id === activeClientId)
  const entries = client?.log?.[logDate] || []
  const totals  = getClientTotalsForDate(activeClientId, logDate)

  const parsedDate = parseISO(logDate)
  const prev = () => setLogDate(format(subDays(parsedDate, 1), 'yyyy-MM-dd'))
  const next = () => setLogDate(format(addDays(parsedDate, 1), 'yyyy-MM-dd'))

  const mealGroups = entries.reduce((acc, e) => {
    const m = e.meal || 'Other'
    if (!acc[m]) acc[m] = []
    acc[m].push(e)
    return acc
  }, {})

  const extraMeals = [...new Set(
    entries.map((e) => e.meal || 'Other').filter((m) => !PRIMARY_MEALS.includes(m))
  )]
  const allSections = [...PRIMARY_MEALS, ...extraMeals]

  // ── Edit handlers ──────────────────────────────────────────────────────────
  // Keep qty/grams as RAW STRINGS while editing so the field can be cleared
  // to blank and intermediate decimals ("1.", "0.7") survive typing. Numbers
  // are only parsed for the preview/save.
  const cleanDecimal = (v) => {
    const s = String(v).replace(/[^0-9.]/g, '')
    const i = s.indexOf('.')
    return i === -1 ? s : s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '')
  }

  const openEdit = (entry) => {
    if (editState?.id === entry.id) { setEditState(null); return }
    const q = entry.quantity || 1
    setEditState({
      id:          entry.id,
      qty:         String(q),
      grams:       entry.servingSize ? String(Math.round(q * entry.servingSize)) : '',
      servingSize: entry.servingSize || null,
      perQty: {
        cal:  (entry.calories || 0) / q,
        pro:  (entry.protein  || 0) / q,
        carb: (entry.carbs    || 0) / q,
        fat:  (entry.fat      || 0) / q,
      },
    })
  }

  const editQtyChange = (val) => {
    const str = cleanDecimal(val)
    const q   = parseFloat(str)
    setEditState((s) => ({
      ...s,
      qty:   str,
      grams: s.servingSize ? (q > 0 ? String(Math.round(q * s.servingSize)) : '') : s.grams,
    }))
  }

  const editGramsChange = (val) => {
    const str = cleanDecimal(val)
    const g   = parseFloat(str)
    setEditState((s) => ({
      ...s,
      grams: str,
      qty:   s.servingSize ? (g > 0 ? String(+(g / s.servingSize).toFixed(3)) : '') : s.qty,
    }))
  }

  const editQtyNum = editState ? parseFloat(editState.qty) || 0 : 0

  const saveEdit = () => {
    if (!editState || editQtyNum <= 0) return
    const { id, perQty } = editState
    const qty = editQtyNum
    updateClientEntry(activeClientId, logDate, id, {
      quantity: qty,
      calories: Math.round(perQty.cal  * qty * 10) / 10,
      protein:  Math.round(perQty.pro  * qty * 10) / 10,
      carbs:    Math.round(perQty.carb * qty * 10) / 10,
      fat:      Math.round(perQty.fat  * qty * 10) / 10,
    })
    successHaptic()
    setEditState(null)
  }

  const editPreview = editState ? {
    cal:  Math.round(editState.perQty.cal  * editQtyNum),
    pro:  Math.round(editState.perQty.pro  * editQtyNum),
    carb: Math.round(editState.perQty.carb * editQtyNum),
    fat:  Math.round(editState.perQty.fat  * editQtyNum),
  } : null

  const inpCls = 'w-full bg-bg border border-border rounded-lg px-3 py-2 font-mono text-sm text-cream focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/30'

  return (
    <div className="relative" style={{ minHeight: '100%' }}>
      <div className="flex flex-col min-h-full">
      {/* Date nav */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-5 pt-mobile-header pb-4 border-b border-border anim-fade-in-down glass-panel accent-line">
        <button onClick={prev} className="w-10 h-10 flex items-center justify-center text-muted hover:text-cream">
          <ChevronLeft size={22} />
        </button>
        <div className="text-center">
          <h2 className="font-display font-black text-2xl tracking-wide text-cream">
            <ScrambleText key={logDate} text={format(parsedDate, 'EEEE').toUpperCase()} duration={600} />
          </h2>
          <p className="font-mono text-xs text-muted">{format(parsedDate, 'MMMM d, yyyy')}</p>
          {logDate !== format(new Date(), 'yyyy-MM-dd') && (
            <button
              onClick={() => setLogDate(format(new Date(), 'yyyy-MM-dd'))}
              className="mt-1.5 px-3 py-1 rounded-full border border-brown/30 bg-brown/10 font-mono text-[10px] tracking-[0.18em] text-brown-light anim-pop press"
            >
              ↩ TODAY
            </button>
          )}
        </div>
        <button onClick={next} className="w-10 h-10 flex items-center justify-center text-muted hover:text-cream">
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Daily totals bar */}
      <div className="grid grid-cols-4 mx-5 mt-5 mb-5 glass-card border border-border rounded-2xl overflow-hidden anim-fade-in card-dim" style={{ animationDelay: '60ms' }}>
        {[
          { label: 'KCAL', val: totals.calories, color: 'text-cream' },
          { label: 'PRO',  val: totals.protein,  color: 'text-olive-light' },
          { label: 'CARB', val: totals.carbs,    color: 'text-brown-light' },
          { label: 'FAT',  val: totals.fat,      color: 'text-slategray-light' },
        ].map(({ label, val, color }, i) => (
          <div key={label} className={`py-3 text-center ${i < 3 ? 'border-r border-border' : ''}`}>
            <p className={`font-display font-black text-xl ${color}`}>
              <AnimatedNumber value={Math.round(val)} duration={700} />
            </p>
            <p className="font-mono text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Meal sections */}
      <div className="flex-1 px-5 pb-6 space-y-3">
        {allSections.map((meal, sectionIdx) => {
          const items  = mealGroups[meal] || []
          const mTotal = items.reduce(
            (a, e) => ({ cal: a.cal + e.calories, pro: a.pro + e.protein }),
            { cal: 0, pro: 0 }
          )
          return (
            <div
              key={meal}
              className="glass-card border border-border rounded-2xl overflow-hidden anim-fade-in-up card-hover"
              style={{ animationDelay: `${sectionIdx * 65 + 80}ms` }}
            >
              {/* Section header */}
              <div className="flex items-center justify-between px-4 py-3 bg-white/[0.04]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-display font-bold text-sm tracking-widest text-cream">
                    {meal.toUpperCase()}
                  </span>
                  {items.length > 0 && (
                    <span className="font-mono text-xs text-muted">
                      {mTotal.cal.toFixed(0)} kcal · {mTotal.pro.toFixed(0)}p
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {items.length > 0 && (
                    <button
                      onClick={() => setMealSave({ meal, items, name: '', saving: false, done: false })}
                      title="Make this a meal — save these exact portions to reuse"
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-olive/15 text-olive-light hover:bg-olive hover:text-bg transition-colors"
                    >
                      <BookmarkPlus size={14} strokeWidth={2.5} />
                    </button>
                  )}
                  <button
                    onClick={() => setModalMeal(meal)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-brown/15 text-brown-light hover:bg-brown hover:text-bg transition-colors"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Items or empty placeholder */}
              {items.length === 0 ? (
                <button
                  onClick={() => setModalMeal(meal)}
                  className="w-full px-4 py-4 text-center group"
                >
                  <p className="font-mono text-xs text-dim group-hover:text-muted transition-colors">
                    Nothing logged — tap to add
                  </p>
                </button>
              ) : (
                <div className="divide-y divide-border">
                  {items.map((entry) => {
                    const isEditing = editState?.id === entry.id
                    return (
                      <div key={entry.id}>
                        {/* Entry row — tap to expand / collapse edit */}
                        <button
                          onClick={() => openEdit(entry)}
                          className={`w-full flex items-center px-4 py-3 gap-3 text-left transition-colors ${
                            isEditing ? 'bg-brown/5' : 'hover:bg-surface/40'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-sm text-cream truncate">{entry.name}</p>
                            <p className="font-mono text-xs text-muted">{entryServingLabel(entry)}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-display font-bold text-sm text-cream">
                              {entry.calories.toFixed(0)} kcal
                            </p>
                            <p className="font-mono text-xs text-olive-light">
                              {entry.protein.toFixed(0)}p{' '}
                              <span className="text-brown-light">{entry.carbs.toFixed(0)}c</span>{' '}
                              <span className="text-slategray-light">{entry.fat.toFixed(0)}f</span>
                            </p>
                          </div>
                          <ChevronDown
                            size={14}
                            className={`text-dim flex-shrink-0 transition-transform duration-200 ${
                              isEditing ? 'rotate-180 text-brown-light' : ''
                            }`}
                          />
                        </button>

                        {/* Inline edit panel */}
                        {isEditing && editState && (
                          <div className="px-4 pb-4 pt-3 bg-white/[0.04] border-t border-border/40 space-y-3 anim-fade-in-up">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="font-display text-xs text-muted tracking-widest block mb-1.5">
                                  SERVINGS
                                </label>
                                <input
                                  type="text" inputMode="decimal"
                                  value={editState.qty}
                                  onChange={(e) => editQtyChange(e.target.value)}
                                  className={inpCls}
                                />
                              </div>
                              {editState.servingSize ? (
                                <div>
                                  <label className="font-display text-xs text-muted tracking-widest block mb-1.5">
                                    GRAMS
                                  </label>
                                  <input
                                    type="text" inputMode="decimal"
                                    value={editState.grams}
                                    onChange={(e) => editGramsChange(e.target.value)}
                                    className={inpCls}
                                  />
                                </div>
                              ) : (
                                <div className="flex items-end pb-2">
                                  <p className="font-mono text-xs text-dim">
                                    {entry.servingUnit || 'serving'}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Live macro preview */}
                            {editPreview && (
                              <div className="grid grid-cols-4 gap-1.5">
                                {[
                                  { l: 'KCAL', v: editPreview.cal,  c: 'text-cream' },
                                  { l: 'PRO',  v: editPreview.pro,  c: 'text-olive-light' },
                                  { l: 'CARB', v: editPreview.carb, c: 'text-brown-light' },
                                  { l: 'FAT',  v: editPreview.fat,  c: 'text-slategray-light' },
                                ].map(({ l, v, c }) => (
                                  <div key={l} className="border border-border/50 rounded-lg p-2 text-center card-inset">
                                    <p className={`font-display font-bold text-sm ${c}`}>{v}</p>
                                    <p className="font-mono text-[10px] text-dim">{l}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Save + Delete */}
                            <div className="flex gap-2">
                              <button
                                onClick={saveEdit}
                                disabled={editQtyNum <= 0}
                                className="flex-1 flex items-center justify-center gap-1.5 btn-accent text-bg font-display font-bold text-xs tracking-widest py-2.5 rounded-lg transition-colors disabled:opacity-40"
                              >
                                <Check size={13} />
                                SAVE
                              </button>
                              <button
                                onClick={() => {
                                  deleteHaptic()
                                  removeClientEntry(activeClientId, logDate, entry.id)
                                  setEditState(null)
                                }}
                                className="flex items-center justify-center px-4 border border-red-900/40 text-red-400 hover:text-red-300 hover:border-red-400/60 py-2.5 rounded-lg transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      </div>{/* end page content wrapper */}

      {/* ── Full-screen food selector — rendered via portal to document.body
           so that fixed inset-0 is relative to the viewport (not the
           overflow-y-auto <main> container), covering BottomNav on iOS ── */}
      {modalMeal && createPortal(
        <FoodSelectorPage
          onClose={() => setModalMeal(null)}
          clientId={activeClientId}
          logDate={logDate}
          defaultMeal={modalMeal}
        />,
        document.body
      )}

      {/* ── Make this a meal — snapshot the card's exact portions ── */}
      {mealSave && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-5"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={() => !mealSave.saving && setMealSave(null)}
        >
          <div
            className="w-full max-w-sm bg-surface border border-border rounded-2xl p-4 space-y-3 anim-spring-in shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {mealSave.done ? (
              <div className="text-center py-4">
                <div className="w-11 h-11 rounded-full bg-olive/20 border border-olive/30 flex items-center justify-center mx-auto mb-3 anim-pop">
                  <Check size={20} className="text-olive-light" />
                </div>
                <p className="font-display font-bold text-sm tracking-widest text-cream">MEAL SAVED</p>
                <p className="font-mono text-xs text-muted mt-1.5 leading-relaxed">
                  Find it under MY MEALS when adding food — one tap logs all {mealSave.items.length} item{mealSave.items.length === 1 ? '' : 's'}.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BookmarkPlus size={14} className="text-olive-light" />
                    <p className="font-display font-bold text-sm tracking-widest text-cream">MAKE THIS A MEAL</p>
                  </div>
                  <button
                    onClick={() => setMealSave(null)}
                    className="flex-shrink-0 text-muted hover:text-cream transition-colors mt-0.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

                <div>
                  <label className="font-display text-xs tracking-widest text-muted block mb-1.5">MEAL NAME</label>
                  <input
                    type="text" autoFocus
                    placeholder={`My ${mealSave.meal}`}
                    value={mealSave.name}
                    onChange={(e) => setMealSave((s) => ({ ...s, name: e.target.value }))}
                    className={inpCls}
                  />
                </div>

                {/* What's going in — exact portions */}
                <div className="max-h-36 overflow-y-auto space-y-1.5 border border-border/50 rounded-xl p-2.5 card-inset">
                  {mealSave.items.map((e) => (
                    <div key={e.id} className="flex items-center justify-between gap-2">
                      <p className="font-mono text-xs text-cream truncate">{e.name}</p>
                      <p className="font-mono text-[10px] text-muted flex-shrink-0">
                        {entryServingLabel(e)} · {Math.round(e.calories)} kcal
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: 'KCAL', val: mealSave.items.reduce((a, e) => a + e.calories, 0), cls: 'text-cream' },
                    { label: 'PRO',  val: mealSave.items.reduce((a, e) => a + e.protein,  0), cls: 'text-olive-light' },
                    { label: 'CARB', val: mealSave.items.reduce((a, e) => a + e.carbs,    0), cls: 'text-brown-light' },
                    { label: 'FAT',  val: mealSave.items.reduce((a, e) => a + e.fat,      0), cls: 'text-slategray-light' },
                  ].map(({ label, val, cls }) => (
                    <div key={label} className="border border-border/50 rounded-lg p-1.5 text-center card-inset">
                      <p className={`font-display font-black text-sm ${cls}`}>{Math.round(val)}</p>
                      <p className="font-mono text-[9px] text-muted">{label}</p>
                    </div>
                  ))}
                </div>

                <p className="font-mono text-[10px] text-dim leading-relaxed">
                  Saved privately to your account only — exact portions included.
                </p>

                <button
                  onClick={async () => {
                    setMealSave((s) => ({ ...s, saving: true }))
                    const res = await saveMeal(
                      mealSave.name.trim() || `My ${mealSave.meal}`,
                      mealSave.items
                    )
                    if (res.ok) {
                      successHaptic()
                      setMealSave((s) => ({ ...s, saving: false, done: true }))
                      setTimeout(() => setMealSave(null), 1800)
                    } else {
                      setMealSave((s) => ({ ...s, saving: false }))
                    }
                  }}
                  disabled={mealSave.saving}
                  className="w-full btn-accent text-bg font-display font-bold text-sm tracking-widest py-3 rounded-xl transition-colors glow-hover disabled:opacity-50"
                >
                  {mealSave.saving ? 'SAVING…' : 'SAVE MEAL'}
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
