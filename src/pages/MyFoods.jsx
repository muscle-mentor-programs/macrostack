import { useState, useMemo } from 'react'
import { Plus, Trash2, Search, X, Pencil, Check, Database, Scan, Sparkles, Loader2 } from 'lucide-react'
import useStore from '../store'
import { FOODS } from '../data/foods'
import ScrambleText from '../components/ScrambleText'
import BarcodeScanner from '../components/BarcodeScanner'
import ScannedFoodModal from '../components/ScannedFoodModal'
import { rankFoods } from '../utils/foodSearch'

const SERVING_UNITS = ['g', 'oz', 'ml', 'fl oz', 'bar', 'scoop', 'cup', 'tbsp', 'tsp', 'piece', 'slice', 'packet', 'bottle', 'can', 'bag']
const WEIGHT_UNITS  = ['g', 'ml', 'oz', 'fl oz']

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

function FoodModal({ initial = null, onSave, onClose }) {
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
  const isEdit  = !!initial
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

  const inputCls = 'w-full bg-surface border border-border rounded-xl px-3 py-2.5 font-mono text-sm text-cream placeholder-dim focus:outline-none focus:border-brown transition-colors'
  const lbl      = 'font-display text-xs text-muted tracking-widest block mb-1.5'

  return (
    <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-50 anim-fade-in">
      <div className="bg-card border border-border rounded-2xl w-[580px] max-h-[90vh] overflow-y-auto shadow-2xl anim-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="font-display font-black text-xl tracking-widest text-cream">
            {isEdit ? 'EDIT FOOD' : 'ADD CUSTOM FOOD'}
          </h3>
          <button onClick={onClose} className="text-muted hover:text-cream transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Name + Brand */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>FOOD NAME *</label>
              <input
                autoFocus
                type="text"
                placeholder="e.g. Chicken Breast"
                value={form.name}
                onChange={f('name')}
                className={inputCls}
              />
            </div>
            <div>
              <label className={lbl}>BRAND <span className="text-dim font-mono normal-case tracking-normal">(optional)</span></label>
              <input
                type="text"
                placeholder="e.g. Tyson"
                value={form.brand}
                onChange={f('brand')}
                className={inputCls}
              />
            </div>
          </div>

          {/* Serving — number input grows, unit stays a fixed width */}
          <div>
            <label className={lbl}>SERVING SIZE *</label>
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="100"
                value={form.servingSize}
                onChange={f('servingSize')}
                className="flex-1 min-w-0 bg-surface border border-border rounded-xl px-3 py-2.5 font-mono text-sm text-cream placeholder-dim focus:outline-none focus:border-brown transition-colors"
              />
              <select
                value={form.servingUnit}
                onChange={f('servingUnit')}
                className="w-28 flex-shrink-0 bg-surface border border-border rounded-xl px-3 py-2.5 font-mono text-sm text-cream focus:outline-none focus:border-brown transition-colors"
              >
                {SERVING_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <p className="font-mono text-[10px] text-dim mt-1.5">
              All macros below are for <strong className="text-muted">one serving</strong> at this size.
            </p>
          </div>

          {/* Required macros */}
          <div>
            <p className={lbl}>MACROS PER SERVING *</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { key: 'calories', label: 'CALORIES', unit: 'kcal', color: 'text-cream' },
                { key: 'protein',  label: 'PROTEIN',  unit: 'g',    color: 'text-olive-light' },
                { key: 'carbs',    label: 'CARBS',    unit: 'g',    color: 'text-brown-light' },
                { key: 'fat',      label: 'FAT',      unit: 'g',    color: 'text-slategray-light' },
              ].map(({ key, label, unit, color }) => (
                <div key={key}>
                  <label className={`${lbl} ${color}`}>{label}</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="0"
                      value={form[key]}
                      onChange={f(key)}
                      className={`${inputCls} pr-10`}
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-dim">{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional extras */}
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
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="0"
                      value={form[key]}
                      onChange={f(key)}
                      className={`${inputCls} pr-9`}
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-dim">{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6 pt-2">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 flex items-center justify-center gap-2 bg-brown hover:bg-brown-light disabled:opacity-40 text-bg font-display font-bold text-sm tracking-widest py-3 rounded-xl transition-colors glow-hover"
          >
            <Check size={15} />
            {isEdit ? 'SAVE CHANGES' : 'ADD TO DATABASE'}
          </button>
          <button
            onClick={onClose}
            className="bg-surface border border-border text-muted hover:text-cream font-display font-bold text-sm tracking-widest px-5 py-3 rounded-xl transition-colors"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Superadmin AI Food Search Panel ──────────────────────────────────────────

function servingLabelAI(food) {
  const wt = ['g', 'ml', 'oz', 'fl oz']
  if (!food.servingUnit || wt.includes(food.servingUnit)) return `${food.servingSize} ${food.servingUnit || 'g'}`
  return `1 ${food.servingUnit} · ${food.servingSize}g`
}

function AISearchPanel({ onAdded }) {
  const { addAIFood, customFoods } = useStore()
  const [aiQuery,   setAiQuery]   = useState('')
  const [results,   setResults]   = useState([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [added,     setAdded]     = useState({}) // { [idx]: true } — tracks which results were added

  const existingNames = useMemo(
    () => new Set(customFoods.map((f) => f.name.toLowerCase().trim())),
    [customFoods]
  )

  const handleSearch = async () => {
    if (!aiQuery.trim()) return
    setLoading(true)
    setError(null)
    setResults([])
    setAdded({})
    try {
      const res = await fetch('/api/ai/food-search', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query: aiQuery.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setResults(data.foods || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (food, idx) => {
    const result = await addAIFood(food)
    if (result.ok) {
      setAdded((p) => ({ ...p, [idx]: true }))
      onAdded?.()
    }
  }

  return (
    <div className="border-t border-border" style={{ background: 'rgba(42,39,36,0.98)' }}>
      {/* Panel header */}
      <div className="px-8 py-4 flex items-center gap-3 border-b border-border/80" style={{ background: 'rgba(58,55,51,0.6)' }}>
        <Sparkles size={15} className="text-brown-light flex-shrink-0" />
        <div className="flex-1">
          <p className="font-display font-bold text-sm tracking-widest text-cream">AI FOOD SEARCH</p>
          <p className="font-mono text-xs text-muted">Superadmin — search &amp; add foods to the shared database</p>
        </div>
      </div>

      {/* Search input */}
      <div className="px-8 py-4 flex gap-3 border-b border-border/80">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="e.g. Greek yogurt, almond butter, protein bars…"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full border border-border/80 rounded-lg pl-9 pr-4 py-2 font-mono text-sm text-cream placeholder-muted focus:outline-none focus:border-brown transition-colors"
            style={{ background: 'rgba(58,55,51,0.7)' }}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !aiQuery.trim()}
          className="flex items-center gap-2 bg-brown hover:bg-brown-light disabled:opacity-40 text-bg font-display font-bold text-sm tracking-widest px-5 py-2 rounded-xl transition-colors glow-hover"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {loading ? 'SEARCHING…' : 'SEARCH'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-8 py-3 bg-red-500/10 border-b border-red-500/20">
          <p className="font-mono text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="max-h-72 overflow-y-auto divide-y divide-border/40">
          {results.map((food, idx) => {
            const alreadyExists = existingNames.has(food.name.toLowerCase().trim())
            const wasAdded      = added[idx]
            return (
              <div
                key={idx}
                className="grid grid-cols-9 px-8 py-3 items-center transition-colors"
                style={{ background: 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(154,123,85,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Name + brand */}
                <div className="col-span-3 min-w-0 pr-4">
                  <p className="font-mono text-sm text-cream truncate">{food.name}</p>
                  {food.brand && <p className="font-mono text-xs text-muted truncate">{food.brand}</p>}
                  <p className="font-mono text-[10px] text-muted">{servingLabelAI(food)}</p>
                </div>
                {/* Serving */}
                <div className="col-span-2 font-mono text-xs text-muted">{servingLabelAI(food)}</div>
                {/* Macros */}
                <div className="font-display font-bold text-sm text-cream text-right">{food.calories.toFixed(0)}</div>
                <div className="font-display font-bold text-sm text-olive-light text-right">{food.protein.toFixed(1)}g</div>
                <div className="font-display font-bold text-sm text-brown-light text-right">{food.carbs.toFixed(1)}g</div>
                {/* Add button */}
                <div className="flex items-center justify-end gap-2">
                  <span className="font-display font-bold text-sm text-slategray-light">{food.fat.toFixed(1)}g</span>
                  {wasAdded ? (
                    <span className="font-display text-[10px] text-olive-light bg-olive/15 border border-olive/30 px-2 py-1 rounded flex-shrink-0">
                      ADDED
                    </span>
                  ) : alreadyExists ? (
                    <span className="font-display text-[10px] text-muted border border-border px-2 py-1 rounded flex-shrink-0" style={{ background: 'rgba(58,55,51,0.6)' }}>
                      EXISTS
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAdd(food, idx)}
                      className="font-display text-[10px] text-bg bg-brown hover:bg-brown-light px-2 py-1 rounded flex-shrink-0 transition-colors tracking-widest"
                    >
                      + ADD
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state after search */}
      {!loading && results.length === 0 && aiQuery && !error && (
        <div className="px-8 py-6 text-center">
          <p className="font-mono text-sm text-muted">No results returned. Try a more specific query.</p>
        </div>
      )}
    </div>
  )
}

export default function MyFoods() {
  const {
    currentUser,
    customFoods, addCustomFood, removeCustomFood, updateCustomFood,
    scannedFoods, removeScannedFood, updateScannedFood,
    overrideFoods, upsertFoodOverride, removeFoodOverride,
  } = useStore()

  const isSuperadmin = currentUser?.role === 'superadmin'

  const [query,        setQuery]       = useState('')
  const [filter,       setFilter]      = useState('all')   // 'all' | 'builtin' | 'custom' | 'scanned'
  const [showModal,    setShowModal]   = useState(false)
  const [editTarget,   setEditTarget]  = useState(null)
  const [showScanner,  setShowScanner] = useState(false)
  const [scannedUPC,   setScannedUPC]  = useState(null)
  const [showAISearch, setShowAISearch] = useState(false)

  const overrideIds = useMemo(() => new Set(overrideFoods.map((f) => f.id)), [overrideFoods])

  const allFoods = useMemo(
    () => [
      ...FOODS.filter((f) => !overrideIds.has(f.id)),
      ...overrideFoods,
      ...customFoods,
      ...scannedFoods,
    ],
    [customFoods, scannedFoods, overrideFoods, overrideIds]
  )

  const filtered = useMemo(() => {
    // Apply type filter first, then relevance-rank the subset
    const base = allFoods.filter((f) => {
      const isCustom  = f.id.startsWith('custom_')
      const isScanned = f.id.startsWith('scanned_')
      return filter === 'all'     ? true      :
             filter === 'custom'  ? isCustom  :
             filter === 'scanned' ? isScanned :
             /* builtin */         (!isCustom && !isScanned)
    })
    return rankFoods(base, query)
  }, [allFoods, query, filter])

  const openAdd   = () => { setEditTarget(null); setShowModal(true) }
  const openEdit  = (food) => { setEditTarget(food); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditTarget(null) }

  const handleSave = (data) => {
    if (editTarget) {
      const isOverride = overrideFoods.some((f) => f.id === editTarget.id)
      const isBuiltIn  = !editTarget.id.startsWith('custom_') && !editTarget.id.startsWith('scanned_') && !isOverride
      if (isBuiltIn || isOverride) {
        upsertFoodOverride(editTarget.id, { ...data, category: editTarget.category || 'Custom' })
      } else if (editTarget.id.startsWith('custom_')) {
        updateCustomFood(editTarget.id, data)
      } else {
        updateScannedFood(editTarget.id, data)
      }
    } else {
      addCustomFood(data)
    }
    closeModal()
  }

  const handleScan = (upc) => {
    setShowScanner(false)
    setScannedUPC(upc)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="relative flex items-center justify-between px-8 py-6 border-b border-border flex-shrink-0 anim-fade-in-down glass-panel accent-line">
        <div>
          <h2 className="font-display font-black text-4xl tracking-wider text-cream">
            <ScrambleText text="FOOD DATABASE" duration={950} />
          </h2>
          <p className="font-mono text-sm text-muted mt-1">
            {allFoods.length} total · {FOODS.length} built-in · {customFoods.length} custom · {scannedFoods.length} scanned
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {isSuperadmin && (
            <button
              onClick={() => setShowAISearch((v) => !v)}
              className={`flex items-center gap-2 font-display font-bold text-sm tracking-widest px-4 py-2.5 rounded-lg transition-colors ${
                showAISearch
                  ? 'bg-brown/20 border border-brown/40 text-brown-light'
                  : 'bg-surface border border-border text-muted hover:text-cream hover:border-brown'
              }`}
              title="AI Food Search"
            >
              <Sparkles size={15} />
              AI SEARCH
            </button>
          )}
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-2 bg-surface border border-border text-muted hover:text-cream hover:border-brown font-display font-bold text-sm tracking-widest px-4 py-2.5 rounded-xl transition-colors"
            title="Scan a barcode"
          >
            <Scan size={15} />
            SCAN
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-brown hover:bg-brown-light text-bg font-display font-bold text-sm tracking-widest px-5 py-2.5 rounded-xl transition-colors glow-hover"
          >
            <Plus size={16} />
            ADD FOOD
          </button>
        </div>
      </div>

      {/* Superadmin AI search panel (collapsible) */}
      {isSuperadmin && showAISearch && (
        <AISearchPanel onAdded={() => {}} />
      )}

      {/* Search + source filter */}
      <div className="px-8 py-4 border-b border-border flex-shrink-0 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search name or brand…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 font-mono text-sm text-cream placeholder-muted focus:outline-none focus:border-brown transition-colors"
          />
        </div>

        {/* Source pills */}
        <div className="flex gap-1.5">
          {[
            { id: 'all',     label: 'ALL'      },
            { id: 'builtin', label: 'BUILT-IN' },
            { id: 'custom',  label: 'CUSTOM'   },
            { id: 'scanned', label: 'SCANNED'  },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`font-display font-bold text-xs tracking-widest px-4 py-1.5 rounded-lg transition-colors ${
                filter === id
                  ? 'bg-brown text-bg'
                  : 'bg-card border border-border text-muted hover:text-cream'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="font-mono text-xs text-muted ml-auto">{filtered.length} results</p>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {/* Column headers */}
        <div className="grid grid-cols-9 px-8 py-2.5 border-b border-border bg-surface sticky top-0 z-10">
          <div className="col-span-3 font-display text-xs text-muted tracking-widest">FOOD</div>
          <div className="col-span-2 font-display text-xs text-muted tracking-widest">SERVING</div>
          <div className="font-display text-xs text-muted tracking-widest text-right">KCAL</div>
          <div className="font-display text-xs text-olive-light tracking-widest text-right">PROTEIN</div>
          <div className="font-display text-xs text-brown-light tracking-widest text-right">CARBS</div>
          <div className="font-display text-xs text-slategray-light tracking-widest text-right">FAT</div>
        </div>

        <div className="divide-y divide-border/50 anim-fade-in">
          {filtered.map((food, foodIdx) => {
            const isCustom  = food.id.startsWith('custom_')
            const isScanned = food.id.startsWith('scanned_')
            const isOverride = overrideIds.has(food.id)
            const isBuiltIn  = !isCustom && !isScanned && !isOverride
            return (
              <div
                key={food.id}
                className="grid grid-cols-9 px-8 py-3 hover:bg-card transition-colors group anim-row"
                style={{ animationDelay: `${Math.min(foodIdx, 18) * 22}ms` }}
              >
                {/* Name + brand */}
                <div className="col-span-3 self-center min-w-0 pr-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="font-mono text-sm text-cream truncate">{food.name}</p>
                    {isCustom && (
                      <span className="font-display text-[10px] text-brown-light bg-brown/10 border border-brown/20 px-1.5 py-0.5 rounded flex-shrink-0">
                        CUSTOM
                      </span>
                    )}
                    {isScanned && (
                      <span className="font-display text-[10px] text-olive-light bg-olive/10 border border-olive/20 px-1.5 py-0.5 rounded flex-shrink-0">
                        SCANNED
                      </span>
                    )}
                    {isOverride && (
                      <span className="font-display text-[10px] text-slategray-light bg-slategray/10 border border-slategray/20 px-1.5 py-0.5 rounded flex-shrink-0">
                        EDITED
                      </span>
                    )}
                  </div>
                  {food.brand && (
                    <p className="font-mono text-xs text-muted truncate">{food.brand}</p>
                  )}
                </div>

                {/* Serving */}
                <div className="col-span-2 font-mono text-xs text-muted self-center">
                  {servingLabel(food)}
                </div>

                {/* Macros */}
                <div className="font-display font-bold text-sm text-cream text-right self-center">{food.calories.toFixed(0)}</div>
                <div className="font-display font-bold text-sm text-olive-light text-right self-center">{food.protein.toFixed(1)}g</div>
                <div className="font-display font-bold text-sm text-brown-light text-right self-center">{food.carbs.toFixed(1)}g</div>

                {/* Fat + actions */}
                <div className="flex items-center justify-end gap-1.5 self-center">
                  <span className="font-display font-bold text-sm text-slategray-light">{food.fat.toFixed(1)}g</span>
                  {/* Edit button: custom foods always; superadmin gets all types */}
                  {(isCustom || (isSuperadmin && !isBuiltIn) || (isSuperadmin && isBuiltIn)) && (
                    <button onClick={() => openEdit(food)} title="Edit"
                      className="text-dim hover:text-brown-light transition-colors opacity-0 group-hover:opacity-100 p-1">
                      <Pencil size={12} />
                    </button>
                  )}
                  {/* Delete / revert */}
                  {(isCustom || (isSuperadmin && isScanned)) && (
                    <button onClick={() => isCustom ? removeCustomFood(food.id) : removeScannedFood(food.id)}
                      title="Delete"
                      className="text-dim hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1">
                      <Trash2 size={12} />
                    </button>
                  )}
                  {/* Revert override back to original built-in values */}
                  {isSuperadmin && isOverride && (
                    <button onClick={() => removeFoodOverride(food.id)} title="Revert to original"
                      className="text-dim hover:text-olive-light transition-colors opacity-0 group-hover:opacity-100 p-1 font-display text-[9px] tracking-widest">
                      REVERT
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center anim-fade-in">
              <Database size={32} className="text-dim mb-3" />
              <p className="font-display text-xl text-muted tracking-widest">NO RESULTS</p>
              <p className="font-mono text-sm text-dim mt-1">
                {filter === 'custom' && customFoods.length === 0
                  ? "You haven't added any custom foods yet"
                  : filter === 'scanned' && scannedFoods.length === 0
                  ? 'No barcodes scanned yet'
                  : 'Try a different search'}
              </p>
              {filter === 'custom' && customFoods.length === 0 && (
                <button
                  onClick={openAdd}
                  className="mt-5 bg-brown/20 border border-brown/30 text-brown-light font-display font-bold text-sm tracking-widest px-5 py-2.5 rounded-lg hover:bg-brown/30 transition-colors"
                >
                  + ADD YOUR FIRST FOOD
                </button>
              )}
              {filter === 'scanned' && scannedFoods.length === 0 && (
                <button
                  onClick={() => setShowScanner(true)}
                  className="mt-5 bg-brown/20 border border-brown/30 text-brown-light font-display font-bold text-sm tracking-widest px-5 py-2.5 rounded-lg hover:bg-brown/30 transition-colors flex items-center gap-2"
                >
                  <Scan size={14} />
                  SCAN YOUR FIRST BARCODE
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <FoodModal
          initial={editTarget}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {scannedUPC && (
        <ScannedFoodModal
          upc={scannedUPC}
          onClose={() => setScannedUPC(null)}
          onAfterSave={() => {
            setScannedUPC(null)
            setFilter('scanned')   // switch to scanned tab to highlight the new entry
          }}
        />
      )}
    </div>
  )
}
