import { useState, useMemo } from 'react'
import { format, addDays, subDays, parseISO } from 'date-fns'
import {
  ChevronLeft, ChevronRight, Plus, Search, X, Trash2,
  Scan, Check, ChevronDown,
} from 'lucide-react'
import useStore from '../../store'
import { FOODS, MEALS } from '../../data/foods'
import ScrambleText from '../../components/ScrambleText'
import BarcodeScanner from '../../components/BarcodeScanner'
import ScannedFoodModal from '../../components/ScannedFoodModal'
import { rankFoods, getRecentFoodIds } from '../../utils/foodSearch'

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

// ─── Add Food Modal ──────────────────────────────────────────────────────────
function AddFoodModal({ onClose, clientId, logDate, defaultMeal }) {
  const { addClientEntry, customFoods, scannedFoods, overrideFoods, clients } = useStore()

  const [query,       setQuery]       = useState('')
  const [selected,    setSelected]    = useState(null)
  const [quantity,    setQuantity]    = useState('1')
  const [grams,       setGrams]       = useState('')
  const [meal,        setMeal]        = useState(defaultMeal || 'Breakfast')
  const [showScanner, setShowScanner] = useState(false)
  const [scannedUPC,  setScannedUPC]  = useState(null)

  const overrideIds = useMemo(() => new Set(overrideFoods.map((f) => f.id)), [overrideFoods])

  const allFoods = useMemo(() => [
    ...FOODS.filter((f) => !overrideIds.has(f.id)),
    ...overrideFoods,
    ...customFoods,
    ...scannedFoods,
  ], [overrideIds, overrideFoods, customFoods, scannedFoods])

  // Recently-used food IDs for this client (last 30 days)
  const recentFoodIds = useMemo(() => {
    const client = clients.find((c) => c.id === clientId)
    return getRecentFoodIds(client?.log || {})
  }, [clients, clientId])

  // Ranked list: relevance + recency sort across all foods
  const filtered = useMemo(() => rankFoods(allFoods, query, recentFoodIds),
    [allFoods, query, recentFoodIds])

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

  const handleSelectFood = (food) => {
    setSelected(food)
    setQuantity('1')
    setGrams(food.servingSize ? String(food.servingSize) : '')
  }

  // Keep values as strings so the field can be fully cleared while typing.
  // Numeric conversion only happens when syncing the linked field or on save.
  const handleQtyChange = (val) => {
    setQuantity(val)
    if (selected?.servingSize && val !== '') {
      setGrams(String(Math.round(Math.max(0, Number(val)) * selected.servingSize)))
    }
  }

  const handleGramsChange = (val) => {
    setGrams(val)
    if (selected?.servingSize && val !== '') {
      setQuantity(String(+(Math.max(0, Number(val)) / selected.servingSize).toFixed(3)))
    }
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
    onClose()
  }

  const handleScan      = (upc) => { setShowScanner(false); setScannedUPC(upc) }
  const handleAfterSave = (food) => {
    setScannedUPC(null)
    handleSelectFood(food)
  }

  const inputCls = 'w-full bg-surface border border-border rounded-xl px-4 py-3 font-mono text-base text-cream focus:outline-none focus:border-brown'

  return (
    <div className="fixed inset-0 bg-bg/90 backdrop-blur-sm flex flex-col z-50 anim-fade-in">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 pb-4 border-b border-border bg-card flex-shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <h3 className="font-display font-black text-xl tracking-widest text-cream">ADD FOOD</h3>
        <button onClick={onClose} className="text-muted p-1"><X size={22} /></button>
      </div>

      {/* Search + scan */}
      <div className="px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              autoFocus
              type="text"
              placeholder="Search foods or brands..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-3 font-mono text-sm text-cream placeholder-muted focus:outline-none focus:border-brown"
            />
          </div>
          <button
            onClick={() => setShowScanner(true)}
            title="Scan a barcode"
            className="flex-shrink-0 w-12 h-12 bg-surface border border-border rounded-xl flex items-center justify-center text-muted hover:text-brown-light hover:border-brown transition-colors"
          >
            <Scan size={20} />
          </button>
        </div>
      </div>

      {/* Food list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((food) => (
          <button
            key={food.id}
            onClick={() => handleSelectFood(food)}
            className={`w-full flex items-center justify-between px-5 py-4 border-b border-border/50 text-left ${
              selected?.id === food.id ? 'bg-brown/10 border-l-2 border-l-brown' : ''
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <p className="font-mono text-sm text-cream truncate">{food.name}</p>
                {food.id.startsWith('scanned_') && (
                  <span className="font-display text-[9px] text-olive-light bg-olive/10 border border-olive/20 px-1.5 py-0.5 rounded flex-shrink-0">
                    SCANNED
                  </span>
                )}
              </div>
              <p className="font-mono text-xs text-muted">
                {food.brand ? `${food.brand} · ` : ''}{servingLabel(food)}
              </p>
            </div>
            <div className="text-right font-mono text-xs text-muted ml-3 flex-shrink-0">
              <p className="text-cream">{food.calories} kcal</p>
              <p className="text-olive-light">
                {food.protein}p <span className="text-brown-light">{food.carbs}c</span>{' '}
                <span className="text-slategray-light">{food.fat}f</span>
              </p>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="font-display text-lg text-muted tracking-widest">NO RESULTS</p>
            <p className="font-mono text-xs text-dim mt-2">Try scanning a barcode to add new foods</p>
          </div>
        )}
      </div>

      {/* Config + Add panel */}
      {selected && (
        <div className="bg-card border-t border-border px-5 py-5 space-y-4 anim-sheet">
          {/* Food name + serving ref */}
          <div className="flex items-center gap-3">
            <p className="font-mono text-sm text-cream flex-1 truncate">{selected.name}</p>
            <span className="font-mono text-xs text-muted">{servingLabel(selected)}</span>
          </div>

          {hasGrams ? (
            /* ── gram-aware layout: SERVINGS | GRAMS then MEAL full-width ── */
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-display text-xs text-muted tracking-widest block mb-2">SERVINGS</label>
                  <input
                    type="text" inputMode="decimal"
                    value={quantity}
                    onChange={(e) => handleQtyChange(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="font-display text-xs text-muted tracking-widest block mb-2">GRAMS</label>
                  <input
                    type="text" inputMode="decimal"
                    value={grams}
                    onChange={(e) => handleGramsChange(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="font-display text-xs text-muted tracking-widest block mb-2">MEAL</label>
                <select
                  value={meal}
                  onChange={(e) => setMeal(e.target.value)}
                  className={inputCls}
                >
                  {MEALS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
            </>
          ) : (
            /* ── no gram data: original QUANTITY | MEAL ── */
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-display text-xs text-muted tracking-widest block mb-2">QUANTITY</label>
                <input
                  type="text" inputMode="decimal"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="font-display text-xs text-muted tracking-widest block mb-2">MEAL</label>
                <select
                  value={meal}
                  onChange={(e) => setMeal(e.target.value)}
                  className={inputCls}
                >
                  {MEALS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Live macro preview */}
          {scaled && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'KCAL', val: scaled.calories, color: 'text-cream' },
                { label: 'PRO',  val: scaled.protein,  color: 'text-olive-light' },
                { label: 'CARB', val: scaled.carbs,    color: 'text-brown-light' },
                { label: 'FAT',  val: scaled.fat,      color: 'text-slategray-light' },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-surface border border-border rounded-xl p-3 text-center">
                  <p className={`font-display font-black text-lg ${color}`}>{Number(val).toFixed(0)}</p>
                  <p className="font-mono text-xs text-muted">{label}</p>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleAdd}
            className="w-full bg-brown hover:bg-brown-light text-bg font-display font-bold text-sm tracking-widest py-4 rounded-xl transition-colors"
          >
            ADD TO LOG
          </button>
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
    removeClientEntry, updateClientEntry,
    getClientTotalsForDate, logDate, setLogDate,
  } = useStore()

  const [modalMeal, setModalMeal] = useState(null)
  // editState: { id, qty, grams, servingSize, perQty: { cal, pro, carb, fat } }
  const [editState, setEditState] = useState(null)

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
  const openEdit = (entry) => {
    if (editState?.id === entry.id) { setEditState(null); return }
    const q = entry.quantity || 1
    setEditState({
      id:          entry.id,
      qty:         q,
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
    const q = Math.max(0, Number(val) || 0)
    setEditState((s) => ({
      ...s,
      qty:   q,
      grams: s.servingSize ? String(Math.round(q * s.servingSize)) : s.grams,
    }))
  }

  const editGramsChange = (val) => {
    const g = Math.max(0, Number(val) || 0)
    setEditState((s) => ({
      ...s,
      grams: String(g),
      qty:   s.servingSize ? +(g / s.servingSize).toFixed(3) : s.qty,
    }))
  }

  const saveEdit = () => {
    if (!editState) return
    const { id, qty, perQty } = editState
    updateClientEntry(activeClientId, logDate, id, {
      quantity: qty,
      calories: Math.round(perQty.cal  * qty * 10) / 10,
      protein:  Math.round(perQty.pro  * qty * 10) / 10,
      carbs:    Math.round(perQty.carb * qty * 10) / 10,
      fat:      Math.round(perQty.fat  * qty * 10) / 10,
    })
    setEditState(null)
  }

  const editPreview = editState ? {
    cal:  Math.round(editState.perQty.cal  * editState.qty),
    pro:  Math.round(editState.perQty.pro  * editState.qty),
    carb: Math.round(editState.perQty.carb * editState.qty),
    fat:  Math.round(editState.perQty.fat  * editState.qty),
  } : null

  const inpCls = 'w-full bg-bg border border-border rounded-lg px-3 py-2 font-mono text-sm text-cream focus:outline-none focus:border-brown'

  return (
    <div className="flex flex-col min-h-full">
      {/* Date nav */}
      <div className="relative flex items-center justify-between px-5 pt-mobile-header pb-4 anim-fade-in-down glass-panel accent-line">
        <button onClick={prev} className="w-10 h-10 flex items-center justify-center text-muted hover:text-cream">
          <ChevronLeft size={22} />
        </button>
        <div className="text-center">
          <h2 className="font-display font-black text-2xl tracking-wider text-cream">
            <ScrambleText key={logDate} text={format(parsedDate, 'EEEE').toUpperCase()} duration={600} />
          </h2>
          <p className="font-mono text-xs text-muted">{format(parsedDate, 'MMMM d, yyyy')}</p>
        </div>
        <button onClick={next} className="w-10 h-10 flex items-center justify-center text-muted hover:text-cream">
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Daily totals bar */}
      <div className="grid grid-cols-4 mx-5 mb-5 bg-card border border-border rounded-xl overflow-hidden anim-fade-in" style={{ animationDelay: '60ms' }}>
        {[
          { label: 'KCAL', val: totals.calories, color: 'text-cream' },
          { label: 'PRO',  val: totals.protein,  color: 'text-olive-light' },
          { label: 'CARB', val: totals.carbs,    color: 'text-brown-light' },
          { label: 'FAT',  val: totals.fat,      color: 'text-slategray-light' },
        ].map(({ label, val, color }, i) => (
          <div key={label} className={`py-3 text-center ${i < 3 ? 'border-r border-border' : ''}`}>
            <p className={`font-display font-black text-xl ${color}`}>{val.toFixed(0)}</p>
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
              className="glass-card border border-border/60 rounded-xl overflow-hidden anim-fade-in-up card-hover"
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
                <button
                  onClick={() => setModalMeal(meal)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-brown/15 text-brown-light hover:bg-brown hover:text-bg transition-colors flex-shrink-0"
                >
                  <Plus size={14} strokeWidth={2.5} />
                </button>
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
                                  <div key={l} className="bg-card border border-border rounded-lg p-2 text-center">
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
                                className="flex-1 flex items-center justify-center gap-1.5 bg-brown hover:bg-brown-light text-bg font-display font-bold text-xs tracking-widest py-2.5 rounded-lg transition-colors"
                              >
                                <Check size={13} />
                                SAVE
                              </button>
                              <button
                                onClick={() => {
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

      {/* FAB — opens Breakfast by default */}
      <button
        onClick={() => setModalMeal('Breakfast')}
        className="fixed bottom-20 right-5 w-14 h-14 bg-brown hover:bg-brown-light rounded-full flex items-center justify-center shadow-lg transition-colors z-40 glow-hover"
      >
        <Plus size={24} className="text-bg" strokeWidth={2.5} />
      </button>

      {modalMeal && (
        <AddFoodModal
          onClose={() => setModalMeal(null)}
          clientId={activeClientId}
          logDate={logDate}
          defaultMeal={modalMeal}
        />
      )}
    </div>
  )
}
