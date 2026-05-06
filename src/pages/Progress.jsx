import { useState } from 'react'
import { format, subDays, parseISO, eachDayOfInterval } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import ScrambleText from '../components/ScrambleText'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, ReferenceLine
} from 'recharts'
import useStore from '../store'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2">
      <p className="font-mono text-xs text-muted mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-display font-bold text-sm" style={{ color: p.color }}>
          {p.value?.toFixed(1)} <span className="font-mono font-normal text-xs text-muted">{p.name}</span>
        </p>
      ))}
    </div>
  )
}

export default function Progress() {
  const { weightLog, addWeight, removeWeight, log, goals } = useStore()
  const [newWeight, setNewWeight] = useState('')
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [unit, setUnit] = useState('lbs')

  const handleAdd = () => {
    if (!newWeight) return
    addWeight({ date: newDate, weight: Number(newWeight), unit })
    setNewWeight('')
  }

  // Build last 30 days macro data
  const last30 = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  }).map((d) => {
    const key = format(d, 'yyyy-MM-dd')
    const entries = log[key] || []
    const totals = entries.reduce(
      (a, e) => ({ cal: a.cal + e.calories, pro: a.pro + e.protein, carb: a.carb + e.carbs, fat: a.fat + e.fat }),
      { cal: 0, pro: 0, carb: 0, fat: 0 }
    )
    return {
      date: format(d, 'MMM d'),
      calories: totals.cal || null,
      protein: totals.pro || null,
      carbs: totals.carb || null,
      fat: totals.fat || null,
    }
  })

  const weightData = weightLog.map((w) => ({
    date: format(parseISO(w.date), 'MMM d'),
    weight: w.weight,
    id: w.id,
    unit: w.unit,
  }))

  const latestWeight = weightLog[weightLog.length - 1]
  const firstWeight = weightLog[0]
  const delta = latestWeight && firstWeight ? latestWeight.weight - firstWeight.weight : null

  // Logged days count
  const loggedDays = last30.filter((d) => d.calories && d.calories > 0).length
  const avgCal = loggedDays > 0
    ? last30.reduce((a, d) => a + (d.calories || 0), 0) / loggedDays
    : 0
  const avgPro = loggedDays > 0
    ? last30.reduce((a, d) => a + (d.protein || 0), 0) / loggedDays
    : 0

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-8 py-6 border-b border-border flex-shrink-0 anim-fade-in-down">
        <h2 className="font-display font-black text-4xl tracking-wider text-cream">
          <ScrambleText text="PROGRESS" duration={800} />
        </h2>
        <p className="font-mono text-sm text-muted mt-1">Weight trends and macro consistency</p>
      </div>

      <div className="flex-1 p-8 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: 'CURRENT WEIGHT',
              val: latestWeight ? `${latestWeight.weight} ${latestWeight.unit}` : '—',
              color: 'text-cream',
            },
            {
              label: 'TOTAL CHANGE',
              val: delta !== null ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}` : '—',
              color: delta === null ? 'text-muted' : delta < 0 ? 'text-olive-light' : 'text-brown-light',
            },
            {
              label: '30D AVG CALORIES',
              val: loggedDays > 0 ? `${avgCal.toFixed(0)}` : '—',
              color: 'text-cream',
              sub: `goal: ${goals.calories}`,
            },
            {
              label: '30D AVG PROTEIN',
              val: loggedDays > 0 ? `${avgPro.toFixed(0)}g` : '—',
              color: 'text-olive-light',
              sub: `goal: ${goals.protein}g`,
            },
          ].map(({ label, val, color, sub }, i) => (
            <div key={label} className="bg-card border border-border rounded-xl px-5 py-4 anim-fade-in-up" style={{ animationDelay: `${i * 60 + 50}ms` }}>
              <p className="font-mono text-xs text-muted tracking-widest">{label}</p>
              <p className={`font-display font-black text-3xl ${color} mt-1 data-flicker`}>{val}</p>
              {sub && <p className="font-mono text-xs text-dim mt-1">{sub}</p>}
            </div>
          ))}
        </div>

        {/* Weight chart + log */}
        <div className="grid grid-cols-3 gap-4 anim-fade-in-up" style={{ animationDelay: '290ms' }}>
          <div className="col-span-2 bg-card border border-border rounded-xl p-6">
            <h3 className="font-display font-bold text-sm tracking-widest text-muted mb-5">WEIGHT OVER TIME</h3>
            {weightData.length < 2 ? (
              <div className="flex items-center justify-center h-40">
                <p className="font-display text-muted tracking-widest text-sm">LOG AT LEAST 2 ENTRIES TO SEE TREND</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={weightData}>
                  <defs>
                    <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9A7B55" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#9A7B55" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2724" />
                  <XAxis dataKey="date" tick={{ fill: '#7A756E', fontSize: 10, fontFamily: 'Space Mono' }} />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: '#7A756E', fontSize: 10, fontFamily: 'Space Mono' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="weight" name="lbs" stroke="#9A7B55" fill="url(#wGrad)" strokeWidth={2} dot={{ fill: '#9A7B55', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Weight log */}
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col">
            <h3 className="font-display font-bold text-sm tracking-widest text-muted mb-4">LOG WEIGHT</h3>
            <div className="space-y-2 mb-4">
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 font-mono text-sm text-cream focus:outline-none focus:border-brown transition-colors"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Weight"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 font-mono text-sm text-cream focus:outline-none focus:border-brown transition-colors"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="bg-surface border border-border rounded-lg px-2 py-2 font-mono text-sm text-cream focus:outline-none focus:border-brown transition-colors"
                >
                  <option>lbs</option>
                  <option>kg</option>
                </select>
              </div>
              <button
                onClick={handleAdd}
                className="w-full flex items-center justify-center gap-2 bg-brown hover:bg-brown-light text-bg font-display font-bold text-xs tracking-widest py-2.5 rounded-lg transition-colors"
              >
                <Plus size={14} /> LOG WEIGHT
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5">
              {[...weightLog].reverse().slice(0, 10).map((w) => (
                <div key={w.id} className="flex justify-between items-center bg-surface border border-border rounded-lg px-3 py-2 group">
                  <span className="font-mono text-xs text-muted">{format(parseISO(w.date), 'MMM d')}</span>
                  <span className="font-display font-bold text-sm text-cream">{w.weight} {w.unit}</span>
                  <button
                    onClick={() => removeWeight(w.id)}
                    className="text-dim hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {weightLog.length === 0 && (
                <p className="font-mono text-xs text-dim text-center py-4">No weight entries yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Macro consistency chart */}
        <div className="bg-card border border-border rounded-xl p-6 anim-fade-in-up" style={{ animationDelay: '380ms' }}>
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-display font-bold text-sm tracking-widest text-muted">30-DAY CALORIE TREND</h3>
            <div className="flex gap-4 font-mono text-xs text-muted">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cream inline-block" /> Calories</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-olive inline-block" /> Protein</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={last30}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2724" />
              <XAxis dataKey="date" tick={{ fill: '#7A756E', fontSize: 10, fontFamily: 'Space Mono' }} interval={4} />
              <YAxis tick={{ fill: '#7A756E', fontSize: 10, fontFamily: 'Space Mono' }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={goals.calories} stroke="#9A7B55" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Line type="monotone" dataKey="calories" name="kcal" stroke="#E8E4DC" strokeWidth={2} dot={false} connectNulls={false} />
              <Line type="monotone" dataKey="protein" name="g protein" stroke="#6B7A52" strokeWidth={2} dot={false} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Consistency heatmap-style */}
        <div className="bg-card border border-border rounded-xl p-6 anim-fade-in-up" style={{ animationDelay: '460ms' }}>
          <h3 className="font-display font-bold text-sm tracking-widest text-muted mb-4">30-DAY LOG CONSISTENCY</h3>
          <div className="flex gap-1.5 flex-wrap">
            {last30.map((d, i) => {
              const hasData = d.calories && d.calories > 0
              const pct = hasData ? Math.min(d.calories / goals.calories, 1) : 0
              return (
                <div
                  key={i}
                  title={`${d.date}: ${hasData ? d.calories.toFixed(0) + ' kcal' : 'not logged'}`}
                  className="w-8 h-8 rounded flex items-center justify-center anim-heat"
                  style={{
                    backgroundColor: hasData
                      ? `rgba(154, 123, 85, ${0.2 + pct * 0.8})`
                      : '#2A2724',
                    border: '1px solid rgba(42,39,36,0.8)',
                    animationDelay: `${460 + i * 18}ms`,
                  }}
                >
                  <span className="font-display font-bold text-xs text-cream/60">{d.date.split(' ')[1]}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="font-mono text-xs text-muted">Less</span>
            {[0.2, 0.4, 0.6, 0.8, 1].map((o) => (
              <div key={o} className="w-4 h-4 rounded" style={{ backgroundColor: `rgba(154, 123, 85, ${o})` }} />
            ))}
            <span className="font-mono text-xs text-muted">More</span>
            <span className="font-mono text-xs text-muted ml-4">{loggedDays}/30 days logged</span>
          </div>
        </div>
      </div>
    </div>
  )
}
