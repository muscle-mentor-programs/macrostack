/**
 * Estimate a client's maintenance calories from what they ACTUALLY did —
 * average logged intake vs. their weight trend — using energy balance:
 *
 *   maintenance ≈ avgИntake − (weeklyWeightChange × kcalPerUnit / 7)
 *
 * A loss while eating avgIntake implies maintenance is above intake; a gain
 * implies below. This is deliberately non-prescriptive: it tells a coach where
 * maintenance sits so they can set the deficit/surplus themselves. It never
 * changes targets on its own.
 */
import { parseISO } from 'date-fns'

const KCAL_PER_UNIT = { lbs: 3500, kg: 7700 }
const WINDOW_DAYS   = 21
const MIN_LOGGED    = 5   // logged days needed for a usable intake average
const MIN_SPAN_DAYS = 10  // weigh-in span needed for a usable trend

const dayMs = 86_400_000
const mean  = (arr) => arr.reduce((s, n) => s + n, 0) / arr.length

/**
 * @returns null if there isn't enough data, otherwise:
 *   { estMaintenance, avgIntake, weeklyChange, unit, spanDays, loggedDays,
 *     currentTarget, delta }  — delta = current target − estimate (kcal)
 */
export function estimateMaintenance(client) {
  const log = client?.log || {}
  const weights = [...(client?.weightLog || [])]
    .filter((w) => w?.date && typeof w.value === 'number')
    .sort((a, b) => a.date.localeCompare(b.date))
  if (weights.length < 2) return null

  // Anchor the window to the most recent weigh-in (independent of "now").
  const latest      = weights[weights.length - 1]
  const latestTime  = parseISO(latest.date).getTime()
  const windowStart = latestTime - WINDOW_DAYS * dayMs

  const inWindow = weights.filter((w) => parseISO(w.date).getTime() >= windowStart)
  if (inWindow.length < 2) return null
  const first    = inWindow[0]
  const spanDays = Math.round((latestTime - parseISO(first.date).getTime()) / dayMs)
  if (spanDays < MIN_SPAN_DAYS) return null

  // Smooth both ends (avg of up to 3 readings) so a single odd weigh-in
  // doesn't dominate the trend.
  const headAvg = mean(inWindow.slice(0, Math.min(3, inWindow.length)).map((w) => w.value))
  const tailAvg = mean(inWindow.slice(-Math.min(3, inWindow.length)).map((w) => w.value))
  const weeklyChange = (tailAvg - headAvg) / (spanDays / 7)

  // Average intake over logged days within the same window.
  const startStr = new Date(windowStart).toISOString().slice(0, 10)
  const intakeDays = Object.keys(log)
    .filter((d) => d >= startStr && d <= latest.date && (log[d]?.length || 0) > 0)
    .map((d) => log[d].reduce((s, e) => s + (e.calories || 0), 0))
  if (intakeDays.length < MIN_LOGGED) return null
  const avgIntake = mean(intakeDays)

  const unit          = latest.unit || 'lbs'
  const kcalPerUnit   = KCAL_PER_UNIT[unit] || KCAL_PER_UNIT.lbs
  const estMaintenance = Math.round(avgIntake - weeklyChange * (kcalPerUnit / 7))

  const currentTarget = client?.goals?.calories || null
  const delta = currentTarget ? currentTarget - estMaintenance : null

  return {
    estMaintenance,
    avgIntake:    Math.round(avgIntake),
    weeklyChange: +weeklyChange.toFixed(2),
    unit,
    spanDays,
    loggedDays:   intakeDays.length,
    currentTarget,
    delta,
  }
}
