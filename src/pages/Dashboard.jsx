import { useMemo } from 'react'
import { format } from 'date-fns'
import { PlusCircle, Flame } from 'lucide-react'
import useStore from '../store'
import MacroBar from '../components/MacroBar'
import AnimatedNumber from '../components/AnimatedNumber'
import ScrambleText from '../components/ScrambleText'
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from 'recharts'

const WEIGHT_UNITS = ['g', 'ml', 'oz', 'fl oz', 'L']
function entryServingLabel(entry) {
  if (!entry.servingUnit || entry.quantity == null) return entry.amount ? `${entry.amount}g` : '1 serving'
  if (WEIGHT_UNITS.includes(entry.servingUnit)) {
    return `${Math.round(entry.quantity * entry.servingSize)} ${entry.servingUnit}`
  }
  return entry.quantity === 1 ? `1 ${entry.servingUnit}` : `${entry.quantity} × ${entry.servingUnit}`
}

function CalorieRing({ current, goal }) {
  const theme = useStore((s) => s.theme)

  const accentColor = useMemo(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim()
    return v || '#9A7B55'
  }, [theme])

  const trackColor = useMemo(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--color-dim').trim()
    return v || '#3A3733'
  }, [theme])

  const pct  = Math.min((current / (goal || 1)) * 100, 100)
  const data = [{ value: pct, fill: accentColor }]

  return (
    <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="75%"
          outerRadius="100%"
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: trackColor }}
            dataKey="value"
            angleAxisId={0}
            cornerRadius={6}
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-out"
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-black text-4xl text-cream leading-none data-flicker">
          <AnimatedNumber value={current} duration={900} />
        </span>
        <span className="font-mono text-xs text-muted mt-1">KCAL</span>
        <span className="font-mono text-xs text-muted">/ {goal}</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { goals, getTotalsForDate, logDate, setActivePage, log } = useStore()
  const totals = getTotalsForDate(logDate)
  const entries = log[logDate] || []
  const remaining = goals.calories - totals.calories

  const mealGroups = entries.reduce((acc, e) => {
    const m = e.meal || 'Other'
    if (!acc[m]) acc[m] = []
    acc[m].push(e)
    return acc
  }, {})

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-border flex-shrink-0 anim-fade-in-down glass-panel accent-line">
        <div>
          <h2 className="font-display font-black text-4xl tracking-wider text-cream uppercase">
            <ScrambleText text={format(new Date(), 'EEEE').toUpperCase()} duration={800} delay={0} />
          </h2>
          <p className="font-mono text-sm text-muted">{format(new Date(), 'MMMM d, yyyy')}</p>
        </div>
        <button
          onClick={() => setActivePage('log')}
          className="flex items-center gap-2 btn-accent text-bg font-display font-bold text-sm tracking-widest px-5 py-2.5 rounded transition-colors glow-hover"
        >
          <PlusCircle size={16} />
          LOG FOOD
        </button>
      </div>

      <div className="flex-1 p-8 space-y-6">
        {/* Top row: calorie ring + macro bars */}
        <div className="grid grid-cols-12 gap-4 anim-stagger">
          {/* Calorie ring */}
          <div className="col-span-4 glass-card border border-border rounded-2xl flex flex-col items-center justify-center p-6 gap-3 card-dim">
            <CalorieRing current={totals.calories} goal={goals.calories} />
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 w-full">
              <div className="flex items-center gap-2">
                <Flame size={12} className="text-brown" />
                <span className="font-mono text-xs text-muted">CONSUMED</span>
              </div>
              <span className="font-display font-bold text-sm text-cream text-right">
                <AnimatedNumber value={totals.calories} duration={800} />
              </span>
              <div className="flex items-center gap-2">
                <Flame size={12} className="text-olive" />
                <span className="font-mono text-xs text-muted">REMAINING</span>
              </div>
              <span className={`font-display font-bold text-sm text-right ${remaining < 0 ? 'text-red-400' : 'text-olive-light'}`}>
                <AnimatedNumber value={remaining} duration={800} />
              </span>
            </div>
          </div>

          {/* Macro bars */}
          <div className="col-span-8 grid grid-rows-3 gap-3">
            <MacroBar label="PROTEIN" current={totals.protein} goal={goals.protein} color="olive" />
            <MacroBar label="CARBOHYDRATES" current={totals.carbs} goal={goals.carbs} color="brown" />
            <MacroBar label="FAT" current={totals.fat} goal={goals.fat} color="slate" />
          </div>
        </div>

        {/* Meal breakdown */}
        <div className="anim-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-black text-lg tracking-[0.15em] text-muted uppercase">Today's Meals</h3>
            <button
              onClick={() => setActivePage('log')}
              className="font-display text-sm text-brown hover:text-brown-light tracking-widest transition-colors"
            >
              VIEW ALL →
            </button>
          </div>

          {entries.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center anim-fade-in card-dim">
              <p className="font-display font-bold text-xl text-muted tracking-widest">NO ENTRIES YET</p>
              <p className="font-mono text-sm text-dim mt-2">Start logging to track your macros</p>
              <button
                onClick={() => setActivePage('log')}
                className="mt-6 bg-brown/20 border border-brown/30 text-brown-light font-display font-bold text-sm tracking-widest px-6 py-2.5 rounded hover:bg-brown/30 transition-colors"
              >
                + ADD FIRST MEAL
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(mealGroups).map(([meal, items], gi) => {
                const mTotal = items.reduce((a, e) => ({
                  cal: a.cal + e.calories,
                  pro: a.pro + e.protein,
                  carb: a.carb + e.carbs,
                  fat: a.fat + e.fat,
                }), { cal: 0, pro: 0, carb: 0, fat: 0 })

                return (
                  <div
                    key={meal}
                    className="glass-card border border-border rounded-2xl overflow-hidden anim-fade-in-up card-dim"
                    style={{ animationDelay: `${gi * 60}ms` }}
                  >
                    <div className="flex items-center justify-between px-5 py-3 bg-surface">
                      <span className="font-display font-bold text-sm tracking-widest text-cream">{meal.toUpperCase()}</span>
                      <span className="font-mono text-xs text-muted">{mTotal.cal.toFixed(0)} kcal</span>
                    </div>
                    <div className="divide-y divide-border">
                      {items.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between px-5 py-2.5 hover:bg-white/[0.04] transition-colors">
                          <div>
                            <p className="font-mono text-sm text-cream">{entry.name}</p>
                            <p className="font-mono text-xs text-muted">{entryServingLabel(entry)}</p>
                          </div>
                          <div className="flex gap-4 text-right">
                            <div>
                              <p className="font-display font-bold text-sm text-cream">{entry.calories.toFixed(0)}</p>
                              <p className="font-mono text-xs text-muted">kcal</p>
                            </div>
                            <div>
                              <p className="font-display font-bold text-sm text-olive-light">{entry.protein.toFixed(0)}</p>
                              <p className="font-mono text-xs text-muted">pro</p>
                            </div>
                            <div>
                              <p className="font-display font-bold text-sm text-brown-light">{entry.carbs.toFixed(0)}</p>
                              <p className="font-mono text-xs text-muted">carb</p>
                            </div>
                            <div>
                              <p className="font-display font-bold text-sm text-slategray-light">{entry.fat.toFixed(0)}</p>
                              <p className="font-mono text-xs text-muted">fat</p>
                            </div>
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
      </div>
    </div>
  )
}
