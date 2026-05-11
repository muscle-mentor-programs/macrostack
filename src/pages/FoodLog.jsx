import { useState } from 'react'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Search, X, Plus, Trash2 } from 'lucide-react'
import useStore from '../store'
import { FOODS, CATEGORIES, MEALS } from '../data/foods'
import ScrambleText from '../components/ScrambleText'

const WEIGHT_UNITS = ['g', 'ml', 'oz', 'fl oz', 'L']

// For food list: "1 bar · 60g" or "170 g serving"
function servingLabel(food) {
  if (!food.servingUnit) return `${food.servingSize}g`
  if (WEIGHT_UNITS.includes(food.servingUnit)) return `${food.servingSize} ${food.servingUnit} per serving`
  return `1 ${food.servingUnit} · ${food.servingSize}g`
}

// For log entries: "2 bars" or "340g"
function entryServingLabel(entry) {
  if (!entry.servingUnit || !entry.quantity) return entry.amount ? `${entry.amount}g` : '1 serving'
  if (WEIGHT_UNITS.includes(entry.servingUnit)) {
    const total = Math.round(entry.quantity * entry.servingSize)
    return `${total} ${entry.servingUnit}`
  }
  const qty = entry.quantity === 1 ? `1 ${entry.servingUnit}` : `${entry.quantity} × ${entry.servingUnit}`
  return qty
}

function AddFoodModal({ onClose }) {
  const { addEntry, logDate, customFoods } = useStore()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [selected, setSelected] = useState(null)
  const [quantity, setQuantity] = useState('1')
  const [meal, setMeal] = useState('Breakfast')

  const allFoods = [...FOODS, ...customFoods]
  const filtered = allFoods.filter((f) => {
    const matchQ = f.name.toLowerCase().includes(query.toLowerCase()) ||
      (f.brand && f.brand.toLowerCase().includes(query.toLowerCase()))
    const matchC = category === 'All' || f.category === category
    return matchQ && matchC
  })

  const qtyNum = Number(quantity) || 0

  const scaled = selected
    ? {
        calories: selected.calories * qtyNum,
        protein: selected.protein * qtyNum,
        carbs: selected.carbs * qtyNum,
        fat: selected.fat * qtyNum,
      }
    : null

  const handleAdd = () => {
    if (!selected) return
    addEntry({
      name: selected.name,
      brand: selected.brand || '',
      foodId: selected.id,
      quantity: qtyNum || 1,
      servingSize: selected.servingSize,
      servingUnit: selected.servingUnit,
      meal,
      calories: scaled.calories,
      protein: scaled.protein,
      carbs: scaled.carbs,
      fat: scaled.fat,
      date: logDate,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-50 anim-fade-in">
      <div className="bg-card border border-border rounded-2xl w-[640px] max-h-[80vh] flex flex-col shadow-2xl anim-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h3 className="font-display font-black text-2xl tracking-widest text-cream">ADD FOOD</h3>
          <button onClick={onClose} className="text-muted hover:text-cream transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-border space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              autoFocus
              type="text"
              placeholder="Search foods..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2.5 font-mono text-sm text-cream placeholder-muted focus:outline-none focus:border-brown transition-colors"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`font-display font-semibold text-xs tracking-widest px-3 py-1 rounded transition-colors ${
                  category === cat
                    ? 'bg-brown text-bg'
                    : 'bg-surface border border-border text-muted hover:text-cream'
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
              onClick={() => setSelected(food)}
              className={`w-full flex items-center justify-between px-6 py-3 border-b border-border/50 hover:bg-surface transition-colors text-left ${
                selected?.id === food.id ? 'bg-brown/10 border-l-2 border-l-brown' : ''
              }`}
            >
              <div>
                <p className="font-mono text-sm text-cream">{food.name}</p>
                <p className="font-mono text-xs text-muted">
                  {food.brand ? `${food.brand} · ` : ''}{servingLabel(food)}
                </p>
              </div>
              <div className="flex gap-4 text-right text-xs font-mono text-muted">
                <span>{food.calories.toFixed(0)} kcal</span>
                <span className="text-olive-light">{food.protein.toFixed(0)}p</span>
                <span className="text-brown-light">{food.carbs.toFixed(0)}c</span>
                <span className="text-slategray-light">{food.fat.toFixed(0)}f</span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="font-display text-lg text-muted tracking-widest">NO RESULTS</p>
              <p className="font-mono text-xs text-dim mt-1">Try adding a custom food</p>
            </div>
          )}
        </div>

        {/* Config + Add */}
        {selected && (
          <div className="px-6 py-5 border-t border-border bg-surface space-y-4 anim-sheet">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-display text-xs text-muted tracking-widest block mb-2">
                  QTY · <span className="text-brown-light">{selected ? servingLabel(selected) : ''}</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 font-mono text-sm text-cream focus:outline-none focus:border-brown transition-colors"
                />
              </div>
              <div>
                <label className="font-display text-xs text-muted tracking-widest block mb-2">MEAL</label>
                <select
                  value={meal}
                  onChange={(e) => setMeal(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 font-mono text-sm text-cream focus:outline-none focus:border-brown transition-colors"
                >
                  {MEALS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {scaled && (
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'KCAL', val: scaled.calories, color: 'text-cream' },
                  { label: 'PROTEIN', val: scaled.protein, color: 'text-olive-light' },
                  { label: 'CARBS', val: scaled.carbs, color: 'text-brown-light' },
                  { label: 'FAT', val: scaled.fat, color: 'text-slategray-light' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="bg-card border border-border rounded-lg p-3 text-center">
                    <p className={`font-display font-black text-xl ${color}`}>{val.toFixed(1)}</p>
                    <p className="font-mono text-xs text-muted">{label}</p>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleAdd}
              className="w-full bg-brown hover:bg-brown-light text-bg font-display font-bold text-sm tracking-widest py-3 rounded-lg transition-colors"
            >
              ADD TO LOG
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function FoodLog() {
  const { logDate, setLogDate, log, removeEntry, getTotalsForDate } = useStore()
  const [showModal, setShowModal] = useState(false)

  const entries = log[logDate] || []
  const totals = getTotalsForDate(logDate)

  const parsedDate = parseISO(logDate)
  const prev = () => setLogDate(format(subDays(parsedDate, 1), 'yyyy-MM-dd'))
  const next = () => setLogDate(format(addDays(parsedDate, 1), 'yyyy-MM-dd'))

  const mealGroups = entries.reduce((acc, e) => {
    const m = e.meal || 'Other'
    if (!acc[m]) acc[m] = []
    acc[m].push(e)
    return acc
  }, {})

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="relative flex items-center justify-between px-8 py-6 border-b border-border flex-shrink-0 anim-fade-in-down glass-panel accent-line">
        <div className="flex items-center gap-4">
          <button onClick={prev} className="text-muted hover:text-cream transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <h2 className="font-display font-black text-3xl tracking-wider text-cream">
              <ScrambleText
                key={logDate}
                text={format(parsedDate, 'EEEE').toUpperCase()}
                duration={700}
              />
            </h2>
            <p className="font-mono text-sm text-muted">{format(parsedDate, 'MMMM d, yyyy')}</p>
          </div>
          <button onClick={next} className="text-muted hover:text-cream transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brown hover:bg-brown-light text-bg font-display font-bold text-sm tracking-widest px-5 py-2.5 rounded transition-colors glow-hover"
        >
          <Plus size={16} />
          ADD FOOD
        </button>
      </div>

      {/* Daily totals bar */}
      <div className="grid grid-cols-4 border-b border-border flex-shrink-0 anim-fade-in glass-panel" style={{ animationDelay: '80ms' }}>
        {[
          { label: 'CALORIES', val: totals.calories, unit: 'kcal', color: 'text-cream' },
          { label: 'PROTEIN', val: totals.protein, unit: 'g', color: 'text-olive-light' },
          { label: 'CARBS', val: totals.carbs, unit: 'g', color: 'text-brown-light' },
          { label: 'FAT', val: totals.fat, unit: 'g', color: 'text-slategray-light' },
        ].map(({ label, val, unit, color }, i) => (
          <div key={label} className={`px-8 py-4 ${i < 3 ? 'border-r border-border' : ''}`}>
            <p className="font-mono text-xs text-muted tracking-widest">{label}</p>
            <p className={`font-display font-black text-3xl ${color} mt-1 data-flicker`}>
              {val.toFixed(0)}<span className="text-muted font-normal text-lg ml-1">{unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Entries */}
      <div className="flex-1 p-8">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 anim-fade-in">
            <p className="font-display font-bold text-2xl text-muted tracking-widest">EMPTY LOG</p>
            <p className="font-mono text-sm text-dim mt-2">Nothing logged for this day</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-6 bg-brown/20 border border-brown/30 text-brown-light font-display font-bold text-sm tracking-widest px-6 py-2.5 rounded hover:bg-brown/30 transition-colors"
            >
              + LOG YOUR FIRST MEAL
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(mealGroups).map(([meal, items], gi) => {
              const mTotal = items.reduce(
                (a, e) => ({ cal: a.cal + e.calories, pro: a.pro + e.protein, carb: a.carb + e.carbs, fat: a.fat + e.fat }),
                { cal: 0, pro: 0, carb: 0, fat: 0 }
              )
              return (
                <div key={meal} className="bg-card border border-border rounded-xl overflow-hidden anim-fade-in-up card-hover" style={{ animationDelay: `${gi * 70 + 120}ms` }}>
                  <div className="flex items-center justify-between px-5 py-3 bg-surface">
                    <span className="font-display font-bold text-sm tracking-widest text-cream">{meal.toUpperCase()}</span>
                    <div className="flex gap-4 font-mono text-xs text-muted">
                      <span>{mTotal.cal.toFixed(0)} kcal</span>
                      <span className="text-olive-light">{mTotal.pro.toFixed(0)}p</span>
                      <span className="text-brown-light">{mTotal.carb.toFixed(0)}c</span>
                      <span className="text-slategray-light">{mTotal.fat.toFixed(0)}f</span>
                    </div>
                  </div>
                  <div className="divide-y divide-border">
                    {items.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between px-5 py-3 group">
                        <div>
                          <p className="font-mono text-sm text-cream">{entry.name}</p>
                          <p className="font-mono text-xs text-muted">{entryServingLabel(entry)}</p>
                        </div>
                        <div className="flex items-center gap-5">
                          <div className="flex gap-4 font-mono text-sm">
                            <span className="text-cream">{entry.calories.toFixed(0)} <span className="text-muted text-xs">kcal</span></span>
                            <span className="text-olive-light">{entry.protein.toFixed(1)}<span className="text-muted text-xs">p</span></span>
                            <span className="text-brown-light">{entry.carbs.toFixed(1)}<span className="text-muted text-xs">c</span></span>
                            <span className="text-slategray-light">{entry.fat.toFixed(1)}<span className="text-muted text-xs">f</span></span>
                          </div>
                          <button
                            onClick={() => removeEntry(logDate, entry.id)}
                            className="text-dim hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && <AddFoodModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
