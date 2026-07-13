import apiFetch from '../lib/apiFetch'
/**
 * Generate a weekly check-in review with Kay.
 *
 * Feeds the client's last-7-days logged data, weight trend, current targets,
 * and their submitted check-in form into the AI, and gets back a coach-facing
 * summary plus recommended target adjustments (suggest-only — the coach applies).
 *
 * @param {object} p
 * @param {string} p.clientName
 * @param {object} p.goals       - current { calories, protein, carbs, fat }
 * @param {Array}  p.week        - [{ date, logged, calories, protein, carbs, fat }] oldest→newest
 * @param {object} p.weightTrend - { start, end, change, unit } or null
 * @param {object} p.checkin     - { weight, weightUnit, adherence, hunger, energy, notes } or null
 * @returns {Promise<{summary:string, recommendation:string, suggestedGoals:{calories,protein,carbs,fat}}>}
 */
export async function generateCheckinReview({ clientName = 'the client', goals, week = [], weightTrend, checkin }) {
  const loggedDays = week.filter((d) => d.logged).length
  const avg = (k) => {
    const logged = week.filter((d) => d.logged)
    return logged.length ? Math.round(logged.reduce((s, d) => s + (d[k] || 0), 0) / logged.length) : 0
  }
  const avgIntake = { calories: avg('calories'), protein: avg('protein'), carbs: avg('carbs'), fat: avg('fat') }

  const scale = (n) => (n ? `${n}/5` : 'not reported')

  // Custom question answers (new check-ins) — falls back to the legacy
  // structured fields for older submissions.
  const answerBlock = (checkin?.answers || [])
    .map((a) => {
      const val = a.type === 'scale'
        ? (a.value ? `${a.value}/5` : 'not answered')
        : a.type === 'yesno'
        ? (a.value === null || a.value === undefined ? 'not answered' : a.value ? 'Yes' : 'No')
        : (a.value || 'not answered')
      return `  ${a.label}: ${val}`
    })
    .join('\n')

  const systemPrompt = `You are an experienced nutrition coach reviewing a client's weekly check-in.
Be concise, specific, and practical. Base everything on the data given.
Respond with ONLY valid JSON, no markdown, no commentary.`

  const userPrompt = `Review this week for ${clientName} and decide whether to adjust their targets.

CURRENT DAILY TARGETS:
  Calories ${goals.calories} · Protein ${goals.protein}g · Carbs ${goals.carbs}g · Fat ${goals.fat}g

LOGGING THIS WEEK: ${loggedDays}/7 days logged
AVERAGE INTAKE (logged days): ${avgIntake.calories} kcal · ${avgIntake.protein}g protein · ${avgIntake.carbs}g carbs · ${avgIntake.fat}g fat

WEIGHT TREND: ${weightTrend
    ? `${weightTrend.start}→${weightTrend.end} ${weightTrend.unit} (${weightTrend.change > 0 ? '+' : ''}${weightTrend.change} ${weightTrend.unit})`
    : 'no recent weight data'}

CLIENT CHECK-IN FORM:
  Reported weight: ${checkin?.weight ? `${checkin.weight} ${checkin.weightUnit || 'lbs'}` : 'not reported'}
${answerBlock || `  Adherence: ${scale(checkin?.adherence)}
  Hunger: ${scale(checkin?.hunger)}
  Energy: ${scale(checkin?.energy)}
  Notes: ${checkin?.notes || 'none'}`}

Consider: if adherence is low, fix adherence before changing numbers. If weight isn't
moving toward the goal and adherence is solid, adjust calories. Keep protein high.
Only change targets when the data justifies it — otherwise keep them and say why.

Respond with ONLY this JSON:
{
  "summary": "2-3 sentence read on how the week went, grounded in the data above",
  "recommendation": "1-2 sentences: what to change (or hold) and why",
  "suggestedGoals": { "calories": <int>, "protein": <int>, "carbs": <int>, "fat": <int> }
}
If no change is warranted, set suggestedGoals equal to the current targets.`

  const response = await apiFetch('/api/ai/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    let detail = ''
    try { detail = await response.text() } catch { /* ignore */ }
    throw new Error(`AI API error ${response.status}${detail ? ': ' + detail : ''}`)
  }

  const data = await response.json()
  const raw = data.content?.[0]?.text || ''
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    const m = raw.match(/\{[\s\S]*\}/)
    if (!m) throw new Error('AI returned invalid JSON')
    parsed = JSON.parse(m[0])
  }

  const g = parsed.suggestedGoals || {}
  return {
    summary: parsed.summary || '',
    recommendation: parsed.recommendation || '',
    suggestedGoals: {
      calories: Math.round(Number(g.calories) || goals.calories),
      protein:  Math.round(Number(g.protein)  || goals.protein),
      carbs:    Math.round(Number(g.carbs)    || goals.carbs),
      fat:      Math.round(Number(g.fat)      || goals.fat),
    },
  }
}
