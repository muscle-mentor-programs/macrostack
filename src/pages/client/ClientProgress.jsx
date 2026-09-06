import { format, subDays } from 'date-fns'
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine,
} from 'recharts'
import useStore from '../../store'
import ScrambleText from '../../components/ScrambleText'

export default function ClientProgress() {
  const { activeClientId, clients } = useStore()
  const client = clients.find((c) => c.id === activeClientId)

  // Build 30-day dataset with calories + macros
  const calData = Array.from({ length: 30 }, (_, i) => {
    const date = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
    const entries = client?.log?.[date] || []
    const cal     = entries.reduce((s, e) => s + (e.calories || 0), 0)
    const protein = entries.reduce((s, e) => s + (e.protein  || 0), 0)
    const fat     = entries.reduce((s, e) => s + (e.fat      || 0), 0)
    return {
      date: format(subDays(new Date(), 29 - i), 'MMM d'),
      cal, protein, fat,
    }
  })

  const daysLogged  = calData.filter((d) => d.cal > 0).length
  const avgCal      = daysLogged > 0 ? calData.reduce((s, d) => s + d.cal, 0)     / daysLogged : 0
  const avgProtein  = daysLogged > 0 ? calData.reduce((s, d) => s + d.protein, 0) / daysLogged : 0
  const avgFat      = daysLogged > 0 ? calData.reduce((s, d) => s + d.fat, 0)     / daysLogged : 0

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="app-page-gutter sticky top-0 z-20 px-5 pt-mobile-header pb-4 border-b border-border anim-fade-in-down glass-panel accent-line">
        <h1 className="font-display font-black text-3xl tracking-wide text-cream">
          <ScrambleText text="PROGRESS" duration={750} />
        </h1>
        <p className="font-mono text-xs text-muted mt-1">Last 30 days</p>
      </div>

      {/* Stat cards */}
      <div className="app-page-gutter grid grid-cols-2 gap-3 px-5 mt-5 mb-6">
        {[
          { val: avgCal.toFixed(0),     label: 'avg kcal / day',   color: 'text-cream',         delay: 60 },
          { val: daysLogged,            label: 'days logged',       color: 'text-cream',         delay: 120 },
          { val: `${avgProtein.toFixed(0)}g`, label: 'avg protein / day', color: 'text-olive-light', delay: 180 },
          { val: `${avgFat.toFixed(0)}g`,     label: 'avg fat / day',     color: 'text-slategray-light', delay: 240 },
        ].map(({ val, label, color, delay }) => (
          <div key={label} className="glass-card border border-border rounded-2xl p-4 anim-fade-in-up card-dim" style={{ animationDelay: `${delay}ms` }}>
            <p className={`font-display font-black text-3xl ${color} data-flicker`}>{val}</p>
            <p className="font-mono text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Calorie trend chart */}
      <div className="app-page-inset mb-6 glass-card border border-border rounded-2xl p-4 anim-fade-in-up card-dim" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center gap-2 mb-4"><span className="w-5 h-px bg-brown/50 flex-shrink-0" /><p className="font-mono text-[10px] tracking-[0.3em] text-muted">CALORIE TREND</p></div>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={calData}>
            <defs>
              <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#9A7B55" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#9A7B55" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#7A756E', fontFamily: 'Space Mono' }}
              interval={6}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
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
            <ReferenceLine
              y={client?.goals?.calories || 2000}
              stroke="#6B7A52"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="cal"
              stroke="#9A7B55"
              strokeWidth={2}
              fill="url(#calGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Protein trend chart */}
      <div className="app-page-inset mb-6 glass-card border border-border rounded-2xl p-4 anim-fade-in-up card-dim" style={{ animationDelay: '400ms' }}>
        <div className="flex items-center gap-2 mb-4"><span className="w-5 h-px bg-brown/50 flex-shrink-0" /><p className="font-mono text-[10px] tracking-[0.3em] text-muted">PROTEIN TREND</p></div>
        <ResponsiveContainer width="100%" height={110}>
          <AreaChart data={calData}>
            <defs>
              <linearGradient id="proGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6B7A52" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6B7A52" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#7A756E', fontFamily: 'Space Mono' }}
              interval={6}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
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
              formatter={(val) => [`${val.toFixed(0)}g`, 'Protein']}
            />
            <ReferenceLine
              y={client?.goals?.protein || 150}
              stroke="#849663"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="protein"
              stroke="#6B7A52"
              strokeWidth={2}
              fill="url(#proGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
