import { format, subDays } from 'date-fns'

/* ── Auto-adjust nudges ───────────────────────────────────────────────────────
   Flags clients whose recent data suggests their targets deserve a look, so
   the coach gets nudged instead of having to notice it themselves. Pure
   client-side math over data already in the store — no backend.

   A nudge only fires when the data is trustworthy:
     • ≥ 3 weight entries in the last 21 days spanning ≥ 10 days
     • ≥ 5 of the last 7 days logged (so intake data means something)

   Then:
     • |weekly change| < 0.15% of bodyweight → STALLED  (plateau despite effort)
     • |weekly change| > 1.25% of bodyweight → RAPID    (moving too fast)
*/

const WINDOW_DAYS   = 21
const MIN_ENTRIES   = 3
const MIN_SPAN_DAYS = 10
const MIN_LOGGED_7  = 5
const STALL_PCT_WK  = 0.15
const RAPID_PCT_WK  = 1.25

export function computeGoalNudge(client) {
  if (!client) return null

  // Compliance over the last 7 days
  const logged7 = Array.from({ length: 7 }, (_, i) => {
    const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
    return (client.log?.[d] || []).length > 0
  }).filter(Boolean).length
  if (logged7 < MIN_LOGGED_7) return null

  // Weight entries inside the window, oldest → newest
  const cutoff = format(subDays(new Date(), WINDOW_DAYS), 'yyyy-MM-dd')
  const entries = (client.weightLog || [])
    .filter((w) => w.date >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date))
  if (entries.length < MIN_ENTRIES) return null

  const first = entries[0]
  const last  = entries[entries.length - 1]
  const spanDays = Math.round(
    (new Date(last.date) - new Date(first.date)) / 86_400_000
  )
  if (spanDays < MIN_SPAN_DAYS) return null

  const perWeek = ((last.value - first.value) / spanDays) * 7
  const pctPerWeek = (perWeek / last.value) * 100
  const unit = last.unit || 'lbs'

  if (Math.abs(pctPerWeek) < STALL_PCT_WK) {
    return {
      type:  'stalled',
      title: 'Weight has stalled',
      detail: `Flat for ${spanDays} days at ${last.value} ${unit} despite logging ${logged7}/7 days — targets may need a change.`,
    }
  }

  if (Math.abs(pctPerWeek) > RAPID_PCT_WK) {
    const dir = perWeek < 0 ? 'Losing' : 'Gaining'
    return {
      type:  'rapid',
      title: `${dir} weight fast`,
      detail: `${dir} ${Math.abs(perWeek).toFixed(1)} ${unit}/week over the last ${spanDays} days — consider easing the targets.`,
    }
  }

  return null
}

/* All nudges for a roster: [{ client, nudge }] */
export function computeRosterNudges(clients = []) {
  return clients
    .map((client) => ({ client, nudge: computeGoalNudge(client) }))
    .filter((r) => r.nudge)
}
