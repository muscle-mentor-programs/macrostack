import { useState } from 'react'
import useStore from '../store'
import ScrambleText from '../components/ScrambleText'

const ACTIVITY = [
  { label: 'Sedentary', desc: 'Little or no exercise', factor: 1.2 },
  { label: 'Light', desc: '1-3 days/week', factor: 1.375 },
  { label: 'Moderate', desc: '3-5 days/week', factor: 1.55 },
  { label: 'Active', desc: '6-7 days/week', factor: 1.725 },
  { label: 'Very Active', desc: 'Hard daily training', factor: 1.9 },
]

const GOALS_MAP = [
  { label: 'Aggressive Cut', desc: '-500 kcal/day', mod: -500 },
  { label: 'Cut', desc: '-250 kcal/day', mod: -250 },
  { label: 'Maintain', desc: 'TDEE = calories', mod: 0 },
  { label: 'Lean Bulk', desc: '+250 kcal/day', mod: 250 },
  { label: 'Bulk', desc: '+500 kcal/day', mod: 500 },
]

export default function Goals() {
  const { goals, setGoals } = useStore()
  const [local, setLocal] = useState({ ...goals })

  // Calculator state
  const [sex, setSex] = useState('male')
  const [age, setAge] = useState(28)
  const [weight, setWeight] = useState(185)
  const [height, setHeight] = useState(71)
  const [activity, setActivity] = useState(1.55)
  const [goalMod, setGoalMod] = useState(0)
  const [proteinPct, setProteinPct] = useState(35)
  const [carbPct, setCarbPct] = useState(40)
  const [fatPct, setFatPct] = useState(25)
  const [unit, setUnit] = useState('imperial')
  const [calculated, setCalculated] = useState(null)

  const pctSum = proteinPct + carbPct + fatPct

  const calculate = () => {
    const weightKg = unit === 'imperial' ? weight * 0.453592 : weight
    const heightCm = unit === 'imperial' ? height * 2.54 : height
    const bmr =
      sex === 'male'
        ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
        : 10 * weightKg + 6.25 * heightCm - 5 * age - 161
    const tdee = bmr * activity
    const target = tdee + goalMod
    const protein = Math.round((target * (proteinPct / 100)) / 4)
    const carbs = Math.round((target * (carbPct / 100)) / 4)
    const fat = Math.round((target * (fatPct / 100)) / 9)
    setCalculated({ calories: Math.round(target), protein, carbs, fat, tdee: Math.round(tdee) })
  }

  const applyCalculated = () => {
    if (!calculated) return
    const updated = { calories: calculated.calories, protein: calculated.protein, carbs: calculated.carbs, fat: calculated.fat }
    setLocal(updated)
    setGoals(updated)
  }

  const saveManual = () => setGoals(local)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-8 py-6 border-b border-border flex-shrink-0 anim-fade-in-down">
        <h2 className="font-display font-black text-4xl tracking-wider text-cream">
          <ScrambleText text="MACRO GOALS" duration={900} />
        </h2>
        <p className="font-mono text-sm text-muted mt-1">Set your daily targets or use the calculator</p>
      </div>

      <div className="flex-1 p-8 grid grid-cols-2 gap-8">
        {/* Left: Manual targets */}
        <div className="space-y-6 anim-fade-in-up" style={{ animationDelay: '60ms' }}>
          <div className="bg-card border border-border rounded-xl p-6 card-dim">
            <h3 className="font-display font-bold text-lg tracking-widest text-cream mb-5">CURRENT TARGETS</h3>
            <div className="space-y-5">
              {[
                { key: 'calories', label: 'CALORIES', unit: 'kcal', color: 'text-cream' },
                { key: 'protein', label: 'PROTEIN', unit: 'g', color: 'text-olive-light' },
                { key: 'carbs', label: 'CARBOHYDRATES', unit: 'g', color: 'text-brown-light' },
                { key: 'fat', label: 'FAT', unit: 'g', color: 'text-slategray-light' },
              ].map(({ key, label, unit, color }, i) => (
                <div key={key} className="anim-fade-in-up" style={{ animationDelay: `${i * 55 + 120}ms` }}>
                  <div className="flex justify-between mb-2">
                    <label className="font-display text-xs tracking-widest text-muted">{label}</label>
                    <span className="font-mono text-xs text-muted">{unit}</span>
                  </div>
                  <input
                    type="number"
                    value={local[key]}
                    onChange={(e) => setLocal((p) => ({ ...p, [key]: Number(e.target.value) }))}
                    className={`w-full bg-surface border border-border rounded-lg px-4 py-3 font-display font-black text-2xl ${color} focus:outline-none focus:border-brown transition-colors`}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={saveManual}
              className="w-full mt-6 bg-brown hover:bg-brown-light text-bg font-display font-bold text-sm tracking-widest py-3 rounded-lg transition-colors glow-hover"
            >
              SAVE TARGETS
            </button>
          </div>
        </div>

        {/* Right: TDEE Calculator */}
        <div className="space-y-4 anim-slide-right" style={{ animationDelay: '100ms' }}>
          <div className="bg-card border border-border rounded-xl p-6 card-dim">
            <h3 className="font-display font-bold text-lg tracking-widest text-cream mb-5">TDEE CALCULATOR</h3>

            {/* Unit toggle */}
            <div className="flex gap-2 mb-5">
              {['imperial', 'metric'].map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`flex-1 font-display font-semibold text-xs tracking-widest py-2 rounded transition-colors ${
                    unit === u ? 'bg-brown text-bg' : 'bg-surface border border-border text-muted hover:text-cream'
                  }`}
                >
                  {u.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {/* Sex */}
              <div>
                <label className="font-display text-xs text-muted tracking-widest block mb-2">SEX</label>
                <div className="flex gap-2">
                  {['male', 'female'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSex(s)}
                      className={`flex-1 font-display font-semibold text-xs tracking-widest py-2 rounded transition-colors ${
                        sex === s ? 'bg-olive text-bg' : 'bg-surface border border-border text-muted hover:text-cream'
                      }`}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age, Weight, Height */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'AGE', val: age, set: setAge, unit: 'yr' },
                  { label: `WEIGHT`, val: weight, set: setWeight, unit: unit === 'imperial' ? 'lbs' : 'kg' },
                  { label: `HEIGHT`, val: height, set: setHeight, unit: unit === 'imperial' ? 'in' : 'cm' },
                ].map(({ label, val, set, unit: u }) => (
                  <div key={label}>
                    <label className="font-display text-xs text-muted tracking-widest block mb-1.5">{label} ({u})</label>
                    <input
                      type="number"
                      value={val}
                      onChange={(e) => set(Number(e.target.value))}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 font-mono text-sm text-cream focus:outline-none focus:border-brown transition-colors"
                    />
                  </div>
                ))}
              </div>

              {/* Activity */}
              <div>
                <label className="font-display text-xs text-muted tracking-widest block mb-2">ACTIVITY LEVEL</label>
                <div className="space-y-1.5">
                  {ACTIVITY.map((a) => (
                    <button
                      key={a.factor}
                      onClick={() => setActivity(a.factor)}
                      className={`w-full flex justify-between items-center px-3 py-2 rounded text-left transition-colors ${
                        activity === a.factor
                          ? 'bg-brown/20 border border-brown/30 text-cream'
                          : 'bg-surface border border-border text-muted hover:text-cream'
                      }`}
                    >
                      <span className="font-display font-semibold text-xs tracking-widest">{a.label.toUpperCase()}</span>
                      <span className="font-mono text-xs text-muted">{a.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal */}
              <div>
                <label className="font-display text-xs text-muted tracking-widest block mb-2">GOAL</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {GOALS_MAP.map((g) => (
                    <button
                      key={g.mod}
                      onClick={() => setGoalMod(g.mod)}
                      className={`flex flex-col px-3 py-2 rounded text-left transition-colors ${
                        goalMod === g.mod
                          ? 'bg-olive/20 border border-olive/30 text-cream'
                          : 'bg-surface border border-border text-muted hover:text-cream'
                      }`}
                    >
                      <span className="font-display font-semibold text-xs tracking-widest">{g.label.toUpperCase()}</span>
                      <span className="font-mono text-xs text-dim">{g.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Macro split */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="font-display text-xs text-muted tracking-widest">MACRO SPLIT %</label>
                  <span className={`font-mono text-xs ${pctSum !== 100 ? 'text-red-400' : 'text-olive-light'}`}>{pctSum}%</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'PRO', val: proteinPct, set: setProteinPct, color: 'text-olive-light' },
                    { label: 'CARB', val: carbPct, set: setCarbPct, color: 'text-brown-light' },
                    { label: 'FAT', val: fatPct, set: setFatPct, color: 'text-slategray-light' },
                  ].map(({ label, val, set, color }) => (
                    <div key={label}>
                      <p className={`font-mono text-xs ${color} mb-1`}>{label}</p>
                      <input
                        type="number"
                        value={val}
                        onChange={(e) => set(Number(e.target.value))}
                        className="w-full bg-surface border border-border rounded px-2 py-1.5 font-mono text-sm text-cream focus:outline-none focus:border-brown transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={calculate}
                disabled={pctSum !== 100}
                className="w-full bg-olive hover:bg-olive-light disabled:opacity-40 text-bg font-display font-bold text-sm tracking-widest py-3 rounded-lg transition-colors"
              >
                CALCULATE TDEE
              </button>
            </div>
          </div>

          {/* Result */}
          {calculated && (
            <div className="bg-card border border-brown/30 rounded-xl p-6 anim-scale-in card-dim">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-display font-bold text-sm tracking-widest text-brown-light">CALCULATED TARGETS</h4>
                <span className="font-mono text-xs text-muted">TDEE: {calculated.tdee} kcal</span>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'KCAL', val: calculated.calories, color: 'text-cream' },
                  { label: 'PROTEIN', val: calculated.protein, color: 'text-olive-light' },
                  { label: 'CARBS', val: calculated.carbs, color: 'text-brown-light' },
                  { label: 'FAT', val: calculated.fat, color: 'text-slategray-light' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="bg-surface border border-border rounded-lg p-3 text-center card-dim">
                    <p className={`font-display font-black text-2xl ${color}`}>{val}</p>
                    <p className="font-mono text-xs text-muted">{label}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={applyCalculated}
                className="w-full bg-brown hover:bg-brown-light text-bg font-display font-bold text-sm tracking-widest py-2.5 rounded-lg transition-colors glow-hover"
              >
                APPLY THESE TARGETS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
