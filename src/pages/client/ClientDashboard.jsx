import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Plus, LogOut, BookOpen, ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts'
import useStore from '../../store'
import AnimatedNumber from '../../components/AnimatedNumber'
import ScrambleText from '../../components/ScrambleText'

function CalorieRing({ current, goal }) {
  const theme = useStore((s) => s.theme)

  // Read accent + track colors from CSS custom properties so they always
  // match the active theme (Recharts uses SVG fill, not CSS classes).
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
    <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="72%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: trackColor }}
            dataKey="value"
            angleAxisId={0}
            cornerRadius={8}
            isAnimationActive={true}
            animationDuration={1100}
            animationEasing="ease-out"
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-black text-5xl text-cream leading-none data-flicker">
          <AnimatedNumber value={current} duration={1000} />
        </span>
        <span className="font-mono text-xs text-muted mt-1">KCAL</span>
        <span className="font-mono text-xs text-muted">/ {goal}</span>
      </div>
    </div>
  )
}

function MacroChip({ label, current, goal, color, delay = 0 }) {
  const pct = Math.min(Math.round((current / (goal || 1)) * 100), 100)
  const barColors = {
    olive: { bar: 'bg-olive', text: 'text-olive-light' },
    brown: { bar: 'bg-brown', text: 'text-brown-light' },
    slate: { bar: 'bg-slategray', text: 'text-slategray-light' },
  }
  const c = barColors[color] || barColors.olive
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex-1 anim-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <p className={`font-display font-black text-2xl ${c.text} data-flicker`}>
        <AnimatedNumber value={current} duration={900} delay={delay} />
      </p>
      <p className="font-mono text-xs text-muted">{label}</p>
      <div className="mt-2 w-full bg-dim rounded-full h-1">
        <div className={`h-1 rounded-full ${c.bar} bar-fill`} style={{ width: `${pct}%`, animationDelay: `${delay + 100}ms` }} />
      </div>
      <p className="font-mono text-xs text-dim mt-1">{pct}%</p>
    </div>
  )
}

const WEIGHT_UNITS = ['g', 'ml', 'oz', 'fl oz', 'L']

function entryServingLabel(entry) {
  if (!entry.servingUnit || entry.quantity == null) return entry.amount ? `${entry.amount}g` : '1 serving'
  if (WEIGHT_UNITS.includes(entry.servingUnit)) return `${Math.round(entry.quantity * entry.servingSize)} ${entry.servingUnit}`
  return entry.quantity === 1 ? `1 ${entry.servingUnit}` : `${entry.quantity} × ${entry.servingUnit}`
}

const MEAL_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const MEAL_COLORS = {
  Breakfast: 'text-brown-light',
  Lunch:     'text-olive-light',
  Dinner:    'text-slategray-light',
  Snack:     'text-cream',
}

function MealPlanSection({ client, onLogMeal }) {
  const plans      = client?.mealPlans || []
  const activeId   = client?.activeMealPlanId
  const activePlan = plans.find((p) => p.id === activeId)

  const [dayIdx, setDayIdx] = useState(0)

  if (!activePlan) {
    return (
      <div className="mx-5 mb-6 glass-card border border-border/60 rounded-xl p-5 text-center anim-fade-in-up" style={{ animationDelay: '360ms' }}>
        <BookOpen size={24} className="text-dim mx-auto mb-2" />
        <p className="font-display font-bold text-sm text-muted tracking-widest">NO ACTIVE MEAL PLAN</p>
        <p className="font-mono text-xs text-dim mt-1">Your coach hasn't assigned a meal plan yet</p>
      </div>
    )
  }

  const totalDays = activePlan.days?.length || 0
  const day       = activePlan.days?.[Math.min(dayIdx, totalDays - 1)]

  const dayTotal = MEAL_ORDER.reduce(
    (acc, m) => {
      const items = day?.meals?.[m] || []
      return {
        cal: acc.cal + items.reduce((s, e) => s + e.calories, 0),
        pro: acc.pro + items.reduce((s, e) => s + e.protein, 0),
      }
    },
    { cal: 0, pro: 0 }
  )

  return (
    <div className="mx-5 mb-6 anim-fade-in-up" style={{ animationDelay: '360ms' }}>
      {/* Section heading */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-sm tracking-widest text-muted">MEAL PLAN</h2>
        <span className="font-mono text-xs text-brown-light truncate max-w-[160px]">{activePlan.planName}</span>
      </div>

      <div className="glass-card border border-border/60 rounded-xl overflow-hidden">
        {/* Day navigator */}
        <div className="flex items-center justify-between px-4 py-3 bg-white/[0.04] border-b border-border/50">
          <button
            onClick={() => setDayIdx((i) => Math.max(0, i - 1))}
            disabled={dayIdx === 0}
            className="w-7 h-7 flex items-center justify-center text-muted hover:text-cream disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-center">
            <p className="font-display font-bold text-sm text-cream tracking-widest">
              {day?.label || `Day ${dayIdx + 1}`}
            </p>
            <p className="font-mono text-[10px] text-muted">
              {dayTotal.cal.toFixed(0)} kcal · {dayTotal.pro.toFixed(0)}g protein
            </p>
          </div>
          <button
            onClick={() => setDayIdx((i) => Math.min(totalDays - 1, i + 1))}
            disabled={dayIdx >= totalDays - 1}
            className="w-7 h-7 flex items-center justify-center text-muted hover:text-cream disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day indicator dots */}
        {totalDays > 1 && (
          <div className="flex justify-center gap-1 py-2 border-b border-border">
            {Array.from({ length: totalDays }, (_, i) => (
              <button
                key={i}
                onClick={() => setDayIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === dayIdx ? 'bg-brown w-3' : 'bg-dim hover:bg-muted'
                }`}
              />
            ))}
          </div>
        )}

        {/* Meals */}
        {MEAL_ORDER.map((meal, mi) => {
          const items = day?.meals?.[meal] || []
          if (items.length === 0) return null
          const mTotal = items.reduce(
            (a, e) => ({ cal: a.cal + e.calories, pro: a.pro + e.protein }),
            { cal: 0, pro: 0 }
          )
          return (
            <div key={meal} className="border-b border-border last:border-0">
              <div className="flex items-center justify-between px-4 py-2 bg-white/[0.04]">
                <span className={`font-display font-bold text-xs tracking-widest ${MEAL_COLORS[meal]}`}>
                  {meal.toUpperCase()}
                </span>
                <span className="font-mono text-xs text-muted">
                  {mTotal.cal.toFixed(0)} kcal · {mTotal.pro.toFixed(0)}p
                </span>
              </div>
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="font-mono text-sm text-cream truncate">{item.name}</p>
                      <p className="font-mono text-xs text-muted">
                        {entryServingLabel(item)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="font-display font-bold text-sm text-cream">{item.calories.toFixed(0)}</p>
                      <p className="font-mono text-xs text-olive-light">{item.protein.toFixed(0)}p</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Log this meal button */}
              <button
                onClick={() => onLogMeal(meal, items)}
                className="w-full flex items-center justify-center gap-1.5 py-2 font-mono text-xs text-brown-light hover:text-brown transition-colors border-t border-border/50"
              >
                <ClipboardList size={11} />
                Log this meal to today
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ClientDashboard() {
  const { activeClientId, clients, getClientTotalsForDate, logDate, setActivePage, setActiveClientId, setActiveRole, addClientEntry, coachProfile } = useStore()
  const client = clients.find((c) => c.id === activeClientId)
  const totals = getClientTotalsForDate(activeClientId, logDate)
  const remaining = (client?.goals?.calories || 0) - totals.calories
  const entries = client?.log?.[logDate] || []

  const mealGroups = entries.reduce((acc, e) => {
    const m = e.meal || 'Other'
    if (!acc[m]) acc[m] = []
    acc[m].push(e)
    return acc
  }, {})

  const handleSignOut = () => {
    setActiveClientId(null)
    setActiveRole(null)
  }

  // Log every item from a plan meal into today's food log
  const handleLogMeal = (mealName, items) => {
    const date = format(new Date(), 'yyyy-MM-dd')
    items.forEach((item) => {
      addClientEntry(activeClientId, {
        name:        item.name,
        brand:       item.brand || '',
        foodId:      item.foodId,
        quantity:    item.quantity,
        servingSize: item.servingSize,
        servingUnit: item.servingUnit,
        meal:        mealName,
        calories:    item.calories,
        protein:     item.protein,
        carbs:       item.carbs,
        fat:         item.fat,
        date,
      })
    })
    setActivePage('log')
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="relative flex items-center justify-between px-5 pt-mobile-header pb-4 border-b border-border anim-fade-in-down glass-panel accent-line">
        <div>
          <p className="font-mono text-xs text-muted tracking-widest">{format(new Date(), 'EEEE, MMMM d').toUpperCase()}</p>
          <h1 className="font-display font-black text-3xl tracking-wide text-cream mt-0.5">
            <ScrambleText text={client?.name?.split(' ')[0]?.toUpperCase() || 'ATHLETE'} duration={700} delay={50} />
          </h1>
        </div>
        <button onClick={handleSignOut} className="text-muted hover:text-cream transition-colors p-2">
          <LogOut size={18} />
        </button>
      </div>

      {/* Calorie ring */}
      <div className="flex flex-col items-center py-6 px-5 anim-fade-in" style={{ animationDelay: '100ms' }}>
        <CalorieRing current={totals.calories} goal={client?.goals?.calories || 2000} />
        <div className="flex gap-8 mt-4">
          <div className="text-center">
            <p className="font-display font-black text-lg text-cream data-flicker">
              <AnimatedNumber value={totals.calories} duration={900} />
            </p>
            <p className="font-mono text-xs text-muted">CONSUMED</p>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <p className={`font-display font-black text-lg ${remaining < 0 ? 'text-red-400' : 'text-olive-light'} data-flicker`}>
              <AnimatedNumber value={Math.abs(remaining)} duration={900} />
            </p>
            <p className="font-mono text-xs text-muted">{remaining < 0 ? 'OVER' : 'REMAINING'}</p>
          </div>
        </div>
      </div>

      {/* Macro chips */}
      <div className="flex gap-3 px-5 mb-6">
        <MacroChip label="PROTEIN" current={totals.protein} goal={client?.goals?.protein} color="olive" delay={150} />
        <MacroChip label="CARBS" current={totals.carbs} goal={client?.goals?.carbs} color="brown" delay={220} />
        <MacroChip label="FAT" current={totals.fat} goal={client?.goals?.fat} color="slate" delay={290} />
      </div>

      {/* Today's meals */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-sm tracking-widest text-muted">TODAY'S MEALS</h2>
          <button onClick={() => setActivePage('log')} className="font-display text-xs text-brown tracking-widest">
            VIEW LOG →
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="glass-card border border-border/60 rounded-xl p-8 text-center anim-fade-in" style={{ animationDelay: '300ms' }}>
            <p className="font-display font-bold text-lg text-muted tracking-widest">NOTHING LOGGED</p>
            <p className="font-mono text-xs text-dim mt-1">Tap the log tab to add your meals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(mealGroups).map(([meal, items], gi) => {
              const mTotal = items.reduce((a, e) => ({ cal: a.cal + e.calories }), { cal: 0 })
              return (
                <div
                  key={meal}
                  className="glass-card border border-border/60 rounded-xl overflow-hidden anim-fade-in-up card-hover"
                  style={{ animationDelay: `${gi * 60 + 200}ms` }}
                >
                  <div className="flex justify-between px-4 py-2.5 bg-white/[0.04]">
                    <span className="font-display font-bold text-xs tracking-widest text-cream">{meal.toUpperCase()}</span>
                    <span className="font-mono text-xs text-muted">{mTotal.cal.toFixed(0)} kcal</span>
                  </div>
                  <div className="divide-y divide-border">
                    {items.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between px-4 py-3 gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-sm text-cream truncate">{entry.name}</p>
                          <p className="font-mono text-xs text-muted">{entryServingLabel(entry)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-display font-bold text-sm text-cream">{entry.calories.toFixed(0)}</p>
                          <p className="font-mono text-xs text-olive-light">
                            {entry.protein.toFixed(0)}p{' '}
                            <span className="text-brown-light">{entry.carbs.toFixed(0)}c</span>{' '}
                            <span className="text-slategray-light">{entry.fat.toFixed(0)}f</span>
                          </p>
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

      {/* Meal Plan Section */}
      <MealPlanSection client={client} onLogMeal={handleLogMeal} />

      {/* Your Coach card */}
      {coachProfile && (
        <div className="px-5 mb-6 anim-fade-in-up" style={{ animationDelay: '400ms' }}>
          <h2 className="font-display font-bold text-sm tracking-widest text-muted mb-3">YOUR COACH</h2>
          <button
            onClick={() => setActivePage('coach')}
            className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3 text-left hover:border-brown/40 active:bg-surface transition-all card-hover"
          >
            <div className="w-11 h-11 rounded-xl bg-brown/20 border border-brown/30 flex items-center justify-center flex-shrink-0">
              <span className="font-display font-black text-lg text-brown-light">
                {(coachProfile.name || 'C').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-sm text-cream">{coachProfile.name}</p>
              {coachProfile.credentials && (
                <p className="font-mono text-xs text-muted truncate">{coachProfile.credentials}</p>
              )}
              {!coachProfile.credentials && coachProfile.specialties && (
                <p className="font-mono text-xs text-muted truncate">{coachProfile.specialties.split(',')[0].trim()}</p>
              )}
              {!coachProfile.credentials && !coachProfile.specialties && (
                <p className="font-mono text-xs text-muted">Nutrition Coach</p>
              )}
            </div>
            <ChevronRight size={14} className="text-dim flex-shrink-0" />
          </button>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setActivePage('log')}
        className="fixed right-5 w-14 h-14 bg-brown hover:bg-brown-light rounded-full flex items-center justify-center shadow-lg transition-colors z-40 fab-pulse"
        style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
      >
        <Plus size={24} className="text-bg" strokeWidth={2.5} />
      </button>
    </div>
  )
}
