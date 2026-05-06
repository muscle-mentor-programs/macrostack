import { useState, useEffect } from 'react'
import { Check, X, AlertCircle, Loader2 } from 'lucide-react'
import useStore from '../store'

const SERVING_UNITS = [
  'g', 'oz', 'ml', 'fl oz', 'bar', 'scoop', 'cup',
  'tbsp', 'tsp', 'piece', 'slice', 'packet', 'bottle', 'can', 'bag',
]

const EMPTY = {
  name: '', brand: '',
  servingSize: '100', servingUnit: 'g',
  calories: '', protein: '', carbs: '', fat: '',
  fiber: '', sugar: '', sodium: '',
}

// ── Open Food Facts nutriment helpers ─────────────────────────────
function buildFormFromProduct(product, scannedFoods) {
  const n     = product.nutriments || {}
  const servG = parseFloat(product.serving_quantity) || 100

  // Prefer per-serving value; fall back to per-100g × (servG / 100)
  const getN = (k100, kServ) => {
    const sv = parseFloat(n[kServ])
    if (Number.isFinite(sv) && sv >= 0) return sv
    const v100 = parseFloat(n[k100])
    return Number.isFinite(v100) ? +(v100 * servG / 100).toFixed(1) : 0
  }

  const getKcal = () => {
    const sv = parseFloat(n['energy-kcal_serving'])
    if (Number.isFinite(sv) && sv > 0) return Math.round(sv)
    const v100 = parseFloat(n['energy-kcal_100g'])
    if (Number.isFinite(v100)) return Math.round(v100 * servG / 100)
    // kJ fallback
    const kj  = parseFloat(n['energy_serving'])
    if (Number.isFinite(kj) && kj > 0) return Math.round(kj / 4.184)
    const kj100 = parseFloat(n['energy_100g'])
    return Number.isFinite(kj100) ? Math.round(kj100 * servG / 100 / 4.184) : 0
  }

  const parsedName  = (product.product_name || '').trim()
  const parsedBrand = (product.brands        || '').split(',')[0].trim()

  // Name + brand duplicate check
  const dupName = scannedFoods.find(
    (x) =>
      x.name.toLowerCase()           === parsedName.toLowerCase() &&
      (x.brand || '').toLowerCase()  === parsedBrand.toLowerCase()
  )
  if (dupName) return { duplicate: dupName }

  return {
    form: {
      name:        parsedName,
      brand:       parsedBrand,
      servingSize: String(servG),
      servingUnit: 'g',
      calories:    String(getKcal()),
      protein:     String(+(getN('proteins_100g',      'proteins_serving'     )).toFixed(1)),
      carbs:       String(+(getN('carbohydrates_100g', 'carbohydrates_serving')).toFixed(1)),
      fat:         String(+(getN('fat_100g',           'fat_serving'          )).toFixed(1)),
      fiber:       String(+(getN('fiber_100g',         'fiber_serving'        )).toFixed(1)),
      sugar:       String(+(getN('sugars_100g',        'sugars_serving'       )).toFixed(1)),
      // Sodium in OFF is grams; ×1000 → mg
      sodium:      String(Math.round(getN('sodium_100g', 'sodium_serving') * 1000)),
    },
  }
}

// ─────────────────────────────────────────────────────────────────
export default function ScannedFoodModal({ upc, onClose, onAfterSave }) {
  const { addScannedFood } = useStore()

  // 'loading' | 'found' | 'notfound' | 'duplicate'
  const [status,    setStatus]    = useState('loading')
  const [duplicate, setDuplicate] = useState(null)
  const [form,      setForm]      = useState(EMPTY)

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  useEffect(() => {
    const { scannedFoods } = useStore.getState()

    // Immediate UPC duplicate check (before network call)
    if (upc) {
      const dupUPC = scannedFoods.find((x) => x.upc === upc)
      if (dupUPC) { setDuplicate(dupUPC); setStatus('duplicate'); return }
    }

    // Fetch Open Food Facts (free, no API key)
    fetch(`https://world.openfoodfacts.org/api/v0/product/${upc}.json`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status !== 1 || !data.product) {
          setStatus('notfound')
          return
        }
        const parsed = buildFormFromProduct(data.product, scannedFoods)
        if (parsed.duplicate) {
          setDuplicate(parsed.duplicate)
          setStatus('duplicate')
        } else {
          setForm(parsed.form)
          setStatus('found')
        }
      })
      .catch(() => setStatus('notfound'))
  }, [upc])

  const canSave = form.name.trim() && form.calories && form.servingSize

  const handleSave = () => {
    if (!canSave) return
    const food = {
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
      upc,
      category: 'Scanned',
    }
    const result = addScannedFood(food)
    if (result.ok) {
      onAfterSave?.(result.food)
      onClose()
    } else {
      // Race condition — show duplicate UI
      setDuplicate(result.existing)
      setStatus('duplicate')
    }
  }

  const useExisting = () => {
    onAfterSave?.(duplicate)
    onClose()
  }

  const inputCls =
    'w-full bg-surface border border-border rounded-lg px-3 py-2.5 font-mono text-sm text-cream placeholder-dim focus:outline-none focus:border-brown transition-colors'
  const lbl = 'font-display text-xs text-muted tracking-widest block mb-1.5'

  return (
    <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-[65] anim-fade-in px-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-[580px] max-h-[92vh] overflow-y-auto shadow-2xl anim-fade-in-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h3 className="font-display font-black text-xl tracking-widest text-cream">
              {status === 'loading'   ? 'LOOKING UP PRODUCT…' :
               status === 'duplicate' ? 'ALREADY IN DATABASE'  :
               status === 'notfound'  ? 'PRODUCT NOT FOUND'    :
               'SCANNED PRODUCT'}
            </h3>
            <p className="font-mono text-xs text-dim mt-0.5">UPC: {upc}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-cream transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* ── Loading ── */}
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={30} className="text-brown animate-spin" />
            <p className="font-mono text-sm text-muted">Fetching product info…</p>
          </div>
        )}

        {/* ── Duplicate ── */}
        {status === 'duplicate' && duplicate && (
          <div className="px-6 py-6">
            <div className="bg-brown/10 border border-brown/25 rounded-xl p-4 mb-5">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-brown-light flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-display font-bold text-sm tracking-widest text-cream mb-1">
                    ALREADY IN DATABASE
                  </p>
                  <p className="font-mono text-sm text-cream">{duplicate.name}</p>
                  {duplicate.brand && (
                    <p className="font-mono text-xs text-muted">{duplicate.brand}</p>
                  )}
                  <p className="font-mono text-xs text-dim mt-1">
                    {duplicate.calories} kcal · {duplicate.protein}g protein ·{' '}
                    {duplicate.carbs}g carbs · {duplicate.fat}g fat
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={useExisting}
                className="flex-1 bg-brown hover:bg-brown-light text-bg font-display font-bold text-sm tracking-widest py-3 rounded-lg transition-colors"
              >
                USE EXISTING
              </button>
              <button
                onClick={onClose}
                className="bg-surface border border-border text-muted hover:text-cream font-display font-bold text-sm tracking-widest px-5 py-3 rounded-lg transition-colors"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}

        {/* ── Form (found or not-found manual entry) ── */}
        {(status === 'found' || status === 'notfound') && (
          <>
            {status === 'notfound' && (
              <div className="px-6 pt-5 pb-0">
                <div className="flex items-center gap-3 bg-surface border border-border rounded-lg px-4 py-3">
                  <AlertCircle size={15} className="text-muted flex-shrink-0" />
                  <p className="font-mono text-xs text-muted">
                    Product not found in Open Food Facts — fill in the details manually.
                  </p>
                </div>
              </div>
            )}

            <div className="px-6 py-5 space-y-5">
              {/* Name + Brand */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>FOOD NAME *</label>
                  <input
                    autoFocus
                    type="text"
                    placeholder="e.g. Protein Bar"
                    value={form.name}
                    onChange={set('name')}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={lbl}>BRAND</label>
                  <input
                    type="text"
                    placeholder="e.g. Quest"
                    value={form.brand}
                    onChange={set('brand')}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Serving */}
              <div>
                <label className={lbl}>SERVING SIZE *</label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="100"
                    value={form.servingSize}
                    onChange={set('servingSize')}
                    className={`${inputCls} flex-1`}
                  />
                  <select
                    value={form.servingUnit}
                    onChange={set('servingUnit')}
                    className={`${inputCls} w-32`}
                  >
                    {SERVING_UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Required macros */}
              <div>
                <p className={lbl}>MACROS PER SERVING *</p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { key: 'calories', label: 'CALORIES', unit: 'kcal', color: 'text-cream'          },
                    { key: 'protein',  label: 'PROTEIN',  unit: 'g',    color: 'text-olive-light'     },
                    { key: 'carbs',    label: 'CARBS',    unit: 'g',    color: 'text-brown-light'     },
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
                          onChange={set(key)}
                          className={`${inputCls} pr-10`}
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-dim">
                          {unit}
                        </span>
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
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="0"
                          value={form[key]}
                          onChange={set(key)}
                          className={`${inputCls} pr-9`}
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-dim">
                          {unit}
                        </span>
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
                className="flex-1 flex items-center justify-center gap-2 bg-brown hover:bg-brown-light disabled:opacity-40 text-bg font-display font-bold text-sm tracking-widest py-3 rounded-lg transition-colors glow-hover"
              >
                <Check size={15} />
                ADD TO DATABASE
              </button>
              <button
                onClick={onClose}
                className="bg-surface border border-border text-muted hover:text-cream font-display font-bold text-sm tracking-widest px-5 py-3 rounded-lg transition-colors"
              >
                CANCEL
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
