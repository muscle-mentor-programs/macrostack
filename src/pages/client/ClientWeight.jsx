import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Scale, TrendingDown, TrendingUp, Minus, Trash2, Calendar } from 'lucide-react'
import { ComposedChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import useStore from '../../store'
import ScrambleText from '../../components/ScrambleText'

// Compute 7-day moving average keyed by calendar date so backfilled entries
// slot into the correct window automatically.
function movingAvg(sortedWeights, n = 7) {
  return sortedWeights.map((w, i) => {
    const slice = sortedWeights.slice(Math.max(0, i - n + 1), i + 1)
    const avg = slice.reduce((s, e) => s + e.value, 0) / slice.length
    return { ...w, ma: parseFloat(avg.toFixed(1)) }
  })
}

export default function ClientWeight() {
  const { activeClientId, clients, addClientWeight, removeClientWeight } = useStore()
  const client = clients.find((c) => c.id === activeClientId)
  const weightLog = client?.weightLog || []

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const [input, setInput]     = useState('')
  const [unit, setUnit]       = useState('lbs')
  const [logDate, setLogDate] = useState(todayStr)
  const [showDate, setShowDate] = useState(false)

  const handleLog = () => {
    const val = parseFloat(input)
    if (!val) return
    addClientWeight(activeClientId, { value: val, unit, date: logDate })
    setInput('')
    // Reset date back to today after logging
    setLogDate(todayStr)
    setShowDate(false)
  }

  // Sort oldest → newest so moving average is correct for any backfilled dates
  const sorted = [...weightLog].sort((a, b) => a.date.localeCompare(b.date))
  const withMA = movingAvg(sorted)

  const latest      = sorted[sorted.length - 1]
  const currentWeight = latest?.value
  const currentUnit   = latest?.unit || unit
  const currentMA     = withMA[withMA.length - 1]?.ma

  // 30-day change: first vs last entry in last 30 days
  const thirtyAgo = format(new Date(Date.now() - 30 * 86400000), 'yyyy-MM-dd')
  const last30    = sorted.filter((w) => w.date >= thirtyAgo)
  const change30  =
    last30.length > 1
      ? +(last30[last30.length - 1].value - last30[0].value).toFixed(1)
      : null

  // Chart data: up to last 60 entries
  const chartData = withMA.slice(-60).map((w) => ({
    date:   format(parseISO(w.date), 'M/d'),
    weight: w.value,
    avg:    w.ma,
  }))

  const ChangeIcon  = change30 === null ? Minus : change30 < 0 ? TrendingDown : TrendingUp
  const changeColor = change30 === null
    ? 'text-muted'
    : change30 < 0
    ? 'text-olive-light'
    : 'text-red-400'

  const isBackfill = logDate !== todayStr

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="relative px-5 pt-mobile-header pb-4 border-b border-border anim-fade-in-down glass-panel accent-line">
        <h1 className="font-display font-black text-3xl tracking-[0.15em] text-cream">
          <ScrambleText text="WEIGHT" duration={750} />
        </h1>
        <p className="font-mono text-xs text-muted mt-1">7-day moving average</p>
      </div>

      {/* Log input */}
      <div className="mx-5 mt-5 mb-5 bg-card border border-border rounded-xl p-4 anim-fade-in-up card-hover card-dim" style={{ animationDelay: '60ms' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="font-display font-bold text-xs text-muted tracking-widest">LOG WEIGHT</p>
          {/* Date toggle */}
          <button
            onClick={() => setShowDate((v) => !v)}
            className={`flex items-center gap-1.5 font-mono text-xs transition-colors px-2 py-1 rounded-lg ${
              isBackfill
                ? 'text-brown-light bg-brown/15 border border-brown/30'
                : 'text-muted hover:text-cream'
            }`}
          >
            <Calendar size={12} />
            {isBackfill ? format(parseISO(logDate), 'MMM d') : 'today'}
          </button>
        </div>

        {/* Date picker — shown when toggled */}
        {showDate && (
          <div className="mb-3 anim-fade-in">
            <div className="overflow-hidden rounded-xl">
              <input
                type="date"
                value={logDate}
                max={todayStr}
                onChange={(e) => setLogDate(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-cream focus:outline-none focus:border-brown transition-colors"
                style={{ colorScheme: 'dark', display: 'block', width: '100%', maxWidth: '100%' }}
              />
            </div>
            {isBackfill && (
              <p className="font-mono text-[10px] text-brown-light mt-1.5 ml-1">
                Backfilling for {format(parseISO(logDate), 'MMMM d')} — 7-day avg will update automatically
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.0"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLog()}
            className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 font-mono text-base text-cream placeholder-muted focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/30"
          />
          <button
            onClick={() => setUnit(unit === 'lbs' ? 'kg' : 'lbs')}
            className="bg-surface border border-border rounded-xl px-4 font-display font-bold text-sm text-muted hover:text-cream transition-colors"
          >
            {unit}
          </button>
          <button
            onClick={handleLog}
            disabled={!input}
            className="btn-accent disabled:opacity-40 text-bg font-display font-bold text-sm tracking-widest px-5 rounded-xl transition-colors glow-hover"
          >
            LOG
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 px-5 mb-5">
        <div className="glass-card border border-border/60 rounded-xl p-3 anim-fade-in-up card-dim" style={{ animationDelay: '120ms' }}>
          <Scale size={14} className="text-muted mb-2" />
          <p className="font-display font-black text-2xl text-cream leading-none data-flicker">
            {currentWeight ?? '—'}
          </p>
          <p className="font-mono text-[10px] text-muted mt-1">{currentUnit} now</p>
        </div>
        <div className="glass-card border border-border/60 rounded-xl p-3 anim-fade-in-up card-dim" style={{ animationDelay: '180ms' }}>
          <div className="w-4 h-0.5 bg-brown rounded-full mb-[9px] mt-[3px]" />
          <p className="font-display font-black text-2xl text-brown-light leading-none data-flicker">
            {currentMA ?? '—'}
          </p>
          <p className="font-mono text-[10px] text-muted mt-1">7-day avg</p>
        </div>
        <div className="glass-card border border-border/60 rounded-xl p-3 anim-fade-in-up card-dim" style={{ animationDelay: '240ms' }}>
          <ChangeIcon size={14} className={`${changeColor} mb-2`} />
          <p className={`font-display font-black text-2xl leading-none ${changeColor} data-flicker`}>
            {change30 !== null ? `${change30 > 0 ? '+' : ''}${change30}` : '—'}
          </p>
          <p className="font-mono text-[10px] text-muted mt-1">30d change</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="mx-5 mb-5 glass-card border border-border/60 rounded-xl p-4 anim-fade-in-up card-hover card-dim" style={{ animationDelay: '300ms' }}>
          <p className="font-display font-bold text-xs text-muted tracking-[0.15em] mb-2">WEIGHT TREND</p>
          <div className="flex items-center gap-5 mb-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-olive" />
              <span className="font-mono text-[10px] text-muted">Logged</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-brown rounded-full" />
              <span className="font-mono text-[10px] text-muted">7-day avg</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: '#7A756E', fontFamily: 'Space Mono' }}
                interval={Math.max(1, Math.floor(chartData.length / 5))}
                axisLine={false}
                tickLine={false}
              />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip
                contentStyle={{
                  background: '#1C1A18',
                  border: '1px solid #2A2724',
                  borderRadius: 8,
                  fontFamily: 'Space Mono',
                  fontSize: 11,
                  color: '#E8E4DC',
                }}
                labelStyle={{ color: '#7A756E' }}
              />
              {/* Raw weight dots */}
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#6B7A52"
                strokeWidth={0}
                dot={{ fill: '#6B7A52', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#849663' }}
                name="Weight"
                connectNulls
              />
              {/* 7-day moving average — recalculated to include any backfilled entries */}
              <Line
                type="monotone"
                dataKey="avg"
                stroke="#9A7B55"
                strokeWidth={2.5}
                dot={false}
                name="7-day avg"
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History */}
      {sorted.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-5 mt-8 anim-fade-in" style={{ animationDelay: '350ms' }}>
          <Scale size={32} className="text-dim mb-3 anim-pop" style={{ animationDelay: '420ms' }} />
          <p className="font-display font-bold text-lg text-muted tracking-widest">NO ENTRIES YET</p>
          <p className="font-mono text-xs text-dim mt-1">Log your weight above to begin tracking</p>
        </div>
      ) : (
        <div className="mx-5 anim-fade-in-up" style={{ animationDelay: '360ms' }}>
          <p className="font-display font-bold text-xs text-muted tracking-[0.15em] mb-3">HISTORY</p>
          <div className="glass-card border border-border/60 rounded-xl overflow-hidden card-hover card-dim">
            {[...sorted].reverse().map((entry, reversedIdx) => {
              const originalIdx = sorted.length - 1 - reversedIdx
              const prevEntry   = originalIdx > 0 ? sorted[originalIdx - 1] : null
              const diff        = prevEntry ? +(entry.value - prevEntry.value).toFixed(1) : null
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] last:border-0 anim-row hover:bg-white/[0.04] transition-colors"
                  style={{ animationDelay: `${360 + Math.min(reversedIdx, 10) * 35}ms` }}
                >
                  <div>
                    <p className="font-mono text-sm text-cream">
                      {entry.value} {entry.unit}
                    </p>
                    <p className="font-mono text-xs text-muted">
                      {format(parseISO(entry.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {diff !== null && (
                      <span
                        className={`font-mono text-xs ${
                          diff < 0 ? 'text-olive-light' : diff > 0 ? 'text-red-400' : 'text-muted'
                        }`}
                      >
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    )}
                    <button
                      onClick={() => removeClientWeight(activeClientId, entry.id)}
                      className="text-dim hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
