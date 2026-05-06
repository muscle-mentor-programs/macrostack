import { useState } from 'react'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Search, X, Trash2, Scan } from 'lucide-react'
import useStore from '../../store'
import { FOODS, CATEGORIES, MEALS } from '../../data/foods'
import ScrambleText from '../../components/ScrambleText'
import BarcodeScanner from '../../components/BarcodeScanner'
import ScannedFoodModal from '../../components/ScannedFoodModal'

// Meals always shown even when empty
const PRIMARY_MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

const WEIGHT_UNITS = ['g', 'ml', 'oz', 'fl oz', 'L']

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

function AddFoodModal({ onClose, clientId, logDate, defaultMeal }) {
  const { addClientEntry, customFoods, scannedFoods } = useStore()

  const [query,       setQuery]       = useState('')
  const [category,    setCategory]    = useState('All')
  const [selected,    setSelected]    = useState(null)
  const [quantity,    setQuantity]    = useState(1)
  const [meal,        setMeal]        = useState(defaultMeal || 'Breakfast')
  const [showScanner, setShowScanner] = useState(false)
  const [scannedUPC,  setScannedUPC]  = useState(null)

  const allFoods = [...FOODS, ...customFoods, ...scannedFoods]
  const filtered = allFoods.filter((f) => {
    const q = query.toLowerCase()
    return (
      (f.name.toLowerCase().includes(q) || (f.brand && f.brand.toLowerCase().includes(q))) &&
      (category === 'All' || f.category === category)
    )
  })

  const scaled = selected
    ? {
        calories: selected.calories * quantity,
        protein:  selected.protein  * quantity,
        carbs:    selected.carbs    * quantity,
        fat:      selected.fat      * quantity,
      }
    : null

  const handleAdd = () => {
    if (!selected) return
    addClientEntry(clientId, {
      name:        selected.name,
      brand:       selected.brand || '',
      foodId:      selected.id,
      quantity,
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

  const handleScan = (upc) => {
    setShowScanner(false)
    setScannedUPC(upc)
  }

  // After a scanned food is saved or an existing one is chosen,
  // auto-select it in the food list so the user can immediately log it.
  const handleAfterSave = (food) => {
    setScannedUPC(null)
    setSelected(food)
    setQuantity(1)
  }

  return (
    <div className="fixed inset-0 bg-bg/90 backdrop-blur-sm flex flex-col z-50 anim-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
        <h3 className="font-display font-black text-xl tracking-widest text-cream">ADD FOOD</h3>
        <button onClick={onClose} className="text-muted p-1"><X size={22} /></button>
      </div>

      {/* Search + scan button + category filter */}
      <div className="px-4 py-3 border-b border-border bg-card space-y-3">
        <div className="flex items-center gap-2">
          {/* Search input */}
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
          {/* Scan barcode button */}
          <button
            onClick={() => setShowScanner(true)}
            title="Scan a barcode"
            className="flex-shrink-0 w-12 h-12 bg-surface border border-border rounded-xl flex items-center justify-center text-muted hover:text-brown-light hover:border-brown transition-colors"
          >
            <Scan size={20} />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`font-display font-semibold text-xs tracking-widest px-3 py-1.5 rounded-full whitespace-nowrap transition-colors flex-shrink-0 ${
                category === cat
                  ? 'bg-brown text-bg'
                  : 'bg-surface border border-border text-muted'
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Food list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((food) => (
          <button
            key={food.id}
            onClick={() => { setSelected(food); setQuantity(1) }}
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

      {/* Config + Add */}
      {selected && (
        <div className="bg-card border-t border-border px-5 py-5 space-y-4 anim-sheet">
          <div className="flex items-center gap-3">
            <p className="font-mono text-sm text-cream flex-1 truncate">{selected.name}</p>
            <span className="font-mono text-xs text-muted">{servingLabel(selected)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-display text-xs text-muted tracking-widest block mb-2">QUANTITY</label>
              <input
                type="number"
                min="0.25"
                step="0.25"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 font-mono text-base text-cream focus:outline-none focus:border-brown"
              />
            </div>
            <div>
              <label className="font-display text-xs text-muted tracking-widest block mb-2">MEAL</label>
              <select
                value={meal}
                onChange={(e) => setMeal(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 font-mono text-sm text-cream focus:outline-none focus:border-brown"
              >
                {MEALS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          {scaled && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'KCAL', val: scaled.calories, color: 'text-cream' },
                { label: 'PRO',  val: scaled.protein,  color: 'text-olive-light' },
                { label: 'CARB', val: scaled.carbs,    color: 'text-brown-light' },
                { label: 'FAT',  val: scaled.fat,       color: 'text-slategray-light' },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-surface border border-border rounded-xl p-3 text-center">
                  <p className={`font-display font-black text-lg ${color}`}>{val.toFixed(0)}</p>
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

      {/* Barcode scanner overlay */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Post-scan product modal */}
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

export default function ClientLog() {
  const { activeClientId, clients, removeClientEntry, getClientTotalsForDate, logDate, setLogDate } = useStore()

  // null = modal closed; string = open with that meal pre-selected
  const [modalMeal, setModalMeal] = useState(null)

  const client  = clients.find((c) => c.id === activeClientId)
  const entries = client?.log?.[logDate] || []
  const totals  = getClientTotalsForDate(activeClientId, logDate)

  const parsedDate = parseISO(logDate)
  const prev = () => setLogDate(format(subDays(parsedDate, 1), 'yyyy-MM-dd'))
  const next = () => setLogDate(format(addDays(parsedDate, 1), 'yyyy-MM-dd'))

  // Group entries by meal
  const mealGroups = entries.reduce((acc, e) => {
    const m = e.meal || 'Other'
    if (!acc[m]) acc[m] = []
    acc[m].push(e)
    return acc
  }, {})

  // Always show primary meals; append any extra meal types that have entries
  const extraMeals = [...new Set(
    entries.map((e) => e.meal || 'Other').filter((m) => !PRIMARY_MEALS.includes(m))
  )]
  const allSections = [...PRIMARY_MEALS, ...extraMeals]

  return (
    <div className="flex flex-col min-h-full">
      {/* Date nav */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 anim-fade-in-down">
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
          { label: 'FAT',  val: totals.fat,       color: 'text-slategray-light' },
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
            <div key={meal} className="bg-card border border-border rounded-xl overflow-hidden anim-fade-in-up" style={{ animationDelay: `${sectionIdx * 65 + 80}ms` }}>
              {/* Section header */}
              <div className="flex items-center justify-between px-4 py-3 bg-surface">
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
                  {items.map((entry) => (
                    <div key={entry.id} className="flex items-center px-4 py-3 gap-3 group">
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
                      <button
                        onClick={() => removeClientEntry(activeClientId, logDate, entry.id)}
                        className="text-dim hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1 flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* FAB — opens Breakfast by default */}
      <button
        onClick={() => setModalMeal('Breakfast')}
        className="fixed bottom-20 right-5 w-14 h-14 bg-brown hover:bg-brown-light rounded-full flex items-center justify-center shadow-lg transition-colors z-40"
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
