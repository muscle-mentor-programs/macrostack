import { useState, useMemo } from 'react'
import { Plus, Trash2, Search, X, Pencil, Check, Database, Scan } from 'lucide-react'
import useStore from '../../../store'
import { FOODS } from '../../../data/foods'
import ScrambleText from '../../../components/ScrambleText'
import BarcodeScanner from '../../../components/BarcodeScanner'
import ScannedFoodModal from '../../../components/ScannedFoodModal'

const SERVING_UNITS = [
  'g', 'oz', 'ml', 'fl oz', 'bar', 'scoop', 'cup',
  'tbsp', 'tsp', 'piece', 'slice', 'packet', 'bottle', 'can', 'bag',
]
const WEIGHT_UNITS = ['g', 'ml', 'oz', 'fl oz']

function servingLabel(food) {
  if (!food.servingUnit) return `${food.servingSize}g`
  if (WEIGHT_UNITS.includes(food.servingUnit)) return `${food.servingSize} ${food.servingUnit}`
  return `1 ${food.servingUnit} · ${food.servingSize}g`
}

const EMPTY_FORM = {
  name: '', brand: '',
  servingSize: '', servingUnit: 'g',
  calories: '', protein: '', carbs: '', fat: '',
  fiber: '', sugar: '', sodium: '',
}

// ── Full-screen food form ─────────────────────────────────────────────────────
function FoodForm({ initial = null, onSave, onClose }) {
  const [form, setForm] = useState(
    initial
      ? {
          name:        initial.name        || '',
          brand:       initial.brand       || '',
          servingSize: String(initial.servingSize || ''),
          servingUnit: initial.servingUnit || 'g',
          calories:    String(initial.calories    || ''),
          protein:     String(initial.protein     || ''),
          carbs:       String(initial.carbs       || ''),
          fat:         String(initial.fat         || ''),
          fiber:       String(initial.fiber       || ''),
          sugar:       String(initial.sugar       || ''),
          sodium:      String(initial.sodium      || ''),
        }
      : { ...EMPTY_FORM }
  )

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))
  const canSave = form.name.trim() && form.calories && form.servingSize

  const handleSave = () => {
    if (!canSave) return
    onSave({
      name:        form.name.trim(),
      brand:       form.brand.trim(),
      servingSize: Number(form.servingSize),
      servingUnit: form.servingUnit,
      calories:    Number(form.calories)  || 0,
      protein:     Number(form.protein)   || 0,
      carbs:       Number(form.carbs)     || 0,
      fat:         Number(form.fat)       || 0,
      fiber:       Number(form.fiber)     || 0,
      sugar:       Number(form.sugar)     || 0,
      sodium:      Number(form.sodium)    || 0,
      category:    initial?.category || 'Custom',
    })
  }

  const inputCls = 'w-full bg-surface border border-border rounded-xl px-4 py-3 font-mono text-sm text-cream placeholder-dim focus:outline-none focus:border-brown transition-colors'
  const lbl      = 'font-display text-xs text-muted tracking-widest block mb-1.5'

  return (
    <div className="fixed inset-0 bg-bg z-50 flex flex-col anim-fade-in">
      {/* Sticky header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-4 border-b border-border bg-surface flex-shrink-0">
        <h3 className="font-display font-black text-xl tracking-widest text-cream">
          {initial ? 'EDIT FOOD' : 'ADD CUSTOM FOOD'}
        </h3>
        <button onClick={onClose} className="text-muted hover:text-cream transition-colors p-1">
          <X size={20} />
        </button>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Name + Brand */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>FOOD NAME *</label>
            <input autoFocus type="text" placeholder="Chicken Breast" value={form.name} onChange={f('name')} className={inputCls} />
          </div>
          <div>
            <label className={lbl}>BRAND</label>
            <input type="text" placeholder="Tyson" value={form.brand} onChange={f('brand')} className={inputCls} />
          </div>
        </div>

        {/* Serving */}
        <div>
          <label className={lbl}>SERVING SIZE *</label>
          <div className="flex gap-2">
            <input type="number" placeholder="100" value={form.servingSize} onChange={f('servingSize')} className={`${inputCls} flex-1`} />
            <select value={form.servingUnit} onChange={f('servingUnit')} className={`${inputCls} w-28`}>
              {SERVING_UNITS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* Main macros */}
        <div>
          <p className={lbl}>MACROS PER SERVING *</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'calories', label: 'CALORIES', unit: 'kcal', color: 'text-cream'          },
              { key: 'protein',  label: 'PROTEIN',  unit: 'g',    color: 'text-olive-light'    },
              { key: 'carbs',    label: 'CARBS',    unit: 'g',    color: 'text-brown-light'    },
              { key: 'fat',      label: 'FAT',      unit: 'g',    color: 'text-slategray-light' },
            ].map(({ key, label, unit, color }) => (
              <div key={key}>
                <label className={`${lbl} ${color}`}>{label}</label>
                <div className="relative">
                  <input type="number" min="0" step="0.1" placeholder="0" value={form[key]} onChange={f(key)} className={`${inputCls} pr-12`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-dim">{unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Optional details */}
        <div>
          <p className="font-display text-xs text-dim tracking-widest mb-3">OPTIONAL DETAILS</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'fiber',  label: 'FIBER',  unit: 'g'  },
              { key: 'sugar',  label: 'SUGAR',  unit: 'g'  },
              { key: 'sodium', label: 'SODIUM', unit: 'mg' },
            ].map(({ key, label, unit }) => (
              <div key={key}>
                <label className={lbl}>{label}</label>
                <div className="relative">
                  <input type="number" min="0" step="0.1" placeholder="0" value={form[key]} onChange={f(key)} className={`${inputCls} pr-9`} />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-dim">{unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-6 pt-3 border-t border-border bg-surface">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full flex items-center justify-center gap-2 bg-brown hover:bg-brown-light disabled:opacity-40 text-bg font-display font-bold text-sm tracking-widest py-4 rounded-xl transition-colors"
        >
          <Check size={16} />
          {initial ? 'SAVE CHANGES' : 'ADD TO DATABASE'}
        </button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MobileMyFoods() {
  const {
    customFoods, addCustomFood, removeCustomFood, updateCustomFood,
    scannedFoods, removeScannedFood,
  } = useStore()

  const [query,       setQuery]       = useState('')
  const [filter,      setFilter]      = useState('all')
  const [showForm,    setShowForm]    = useState(false)
  const [editTarget,  setEditTarget]  = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scannedUPC,  setScannedUPC]  = useState(null)

  const allFoods = useMemo(
    () => [...FOODS, ...customFoods, ...scannedFoods],
    [customFoods, scannedFoods]
  )

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return allFoods.filter((f) => {
      const matchQ    = f.name.toLowerCase().includes(q) || (f.brand && f.brand.toLowerCase().includes(q))
      const isCustom  = f.id.startsWith('custom_')
      const isScanned = f.id.startsWith('scanned_')
      const matchF =
        filter === 'all'     ? true      :
        filter === 'custom'  ? isCustom  :
        filter === 'scanned' ? isScanned :
        /* builtin */          (!isCustom && !isScanned)
      return matchQ && matchF
    })
  }, [allFoods, query, filter])

  const openAdd  = () => { setEditTarget(null); setShowForm(true) }
  const openEdit = (food) => { setEditTarget(food); setShowForm(true) }

  const handleSave = (data) => {
    if (editTarget) {
      updateCustomFood(editTarget.id, data)
    } else {
      addCustomFood(data)
    }
    setShowForm(false)
    setEditTarget(null)
  }

  const handleScan = (upc) => {
    setShowScanner(false)
    setScannedUPC(upc)
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-4 pt-14 pb-4 anim-fade-in-down">
        <h2 className="font-display font-black text-3xl tracking-wider text-cream">
          <ScrambleText text="FOOD DATABASE" duration={900} />
        </h2>
        <p className="font-mono text-xs text-muted mt-1">
          {allFoods.length} total · {FOODS.length} built-in · {customFoods.length} custom · {scannedFoods.length} scanned
        </p>
      </div>

      {/* Sticky search + filter bar */}
      <div className="sticky top-0 z-10 bg-bg px-4 pt-2 pb-3 border-y border-border space-y-3">
        {/* Search */}
        <div className="flex items-center gap-3 bg-bg border border-border rounded-xl px-4 py-2.5 focus-within:border-brown transition-colors">
          <Search size={14} className="text-muted flex-shrink-0" />
          <input
            type="text"
            placeholder="Search name or brand…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent font-mono text-sm text-cream placeholder-muted focus:outline-none"
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
            {[
              { id: 'all',     label: 'ALL'      },
              { id: 'builtin', label: 'BUILT-IN' },
              { id: 'custom',  label: 'CUSTOM'   },
              { id: 'scanned', label: 'SCANNED'  },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`font-display font-bold text-xs tracking-widest px-4 py-1.5 rounded-lg whitespace-nowrap flex-shrink-0 transition-colors ${
                  filter === id
                    ? 'bg-brown text-bg'
                    : 'bg-surface border border-border text-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="font-mono text-xs text-dim flex-shrink-0 pl-1">
            {filtered.length}
          </span>
        </div>
      </div>

      {/* Food list */}
      <div className="flex-1 divide-y divide-border/50 pb-28">
        {filtered.map((food, idx) => {
          const isCustom  = food.id.startsWith('custom_')
          const isScanned = food.id.startsWith('scanned_')
          return (
            <div
              key={food.id}
              className="flex items-center px-4 py-3.5 anim-row group"
              style={{ animationDelay: `${Math.min(idx, 12) * 25}ms` }}
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="font-mono text-sm text-cream truncate">{food.name}</p>
                  {isCustom && (
                    <span className="font-display text-[9px] text-brown-light bg-brown/10 border border-brown/20 px-1.5 py-0.5 rounded flex-shrink-0">
                      CUSTOM
                    </span>
                  )}
                  {isScanned && (
                    <span className="font-display text-[9px] text-olive-light bg-olive/10 border border-olive/20 px-1.5 py-0.5 rounded flex-shrink-0">
                      SCANNED
                    </span>
                  )}
                </div>
                <p className="font-mono text-xs text-muted mt-0.5">
                  {food.brand ? `${food.brand} · ` : ''}{servingLabel(food)}
                </p>
                <div className="flex gap-3 mt-1.5 font-mono text-xs">
                  <span className="text-cream">{food.calories.toFixed(0)} kcal</span>
                  <span className="text-olive-light">{food.protein.toFixed(1)}p</span>
                  <span className="text-brown-light">{food.carbs.toFixed(1)}c</span>
                  <span className="text-slategray-light">{food.fat.toFixed(1)}f</span>
                </div>
              </div>

              {/* Actions — visible on custom/scanned */}
              {(isCustom || isScanned) && (
                <div className="flex gap-1 ml-2 flex-shrink-0">
                  {isCustom && (
                    <button
                      onClick={() => openEdit(food)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-dim hover:text-brown-light hover:bg-brown/10 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => isCustom ? removeCustomFood(food.id) : removeScannedFood(food.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-dim hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center px-8">
            <Database size={30} className="text-dim mb-3" />
            <p className="font-display text-xl text-muted tracking-widest">NO RESULTS</p>
            <p className="font-mono text-sm text-dim mt-1">
              {filter === 'custom' && customFoods.length === 0
                ? "You haven't added any custom foods yet"
                : filter === 'scanned' && scannedFoods.length === 0
                ? 'No barcodes scanned yet'
                : 'Try a different search'}
            </p>
          </div>
        )}
      </div>

      {/* FABs */}
      <div className="fixed bottom-20 right-4 flex flex-col gap-3 z-30">
        {/* Scan (secondary) */}
        <button
          onClick={() => setShowScanner(true)}
          className="w-13 h-13 flex items-center justify-center rounded-full bg-surface border border-border text-muted shadow-lg hover:border-brown/50 hover:text-brown-light transition-colors"
          style={{ width: 52, height: 52 }}
        >
          <Scan size={20} />
        </button>
        {/* Add (primary) */}
        <button
          onClick={openAdd}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-brown hover:bg-brown-light text-bg shadow-lg transition-colors"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Full-screen food form */}
      {showForm && (
        <FoodForm
          initial={editTarget}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
        />
      )}

      {/* Barcode scanner */}
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
          onAfterSave={() => {
            setScannedUPC(null)
            setFilter('scanned')
          }}
        />
      )}
    </div>
  )
}
