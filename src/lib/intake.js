/* ── Intake → suggested starting targets ──────────────────────────────────────
   Parses an intro-questionnaire submission (by default question ids) and runs
   Mifflin-St Jeor to suggest starting macros. Returns null when the answers
   don't contain enough to compute (age + weight + height minimum). */

const ACTIVITY_FACTORS = [1.2, 1.375, 1.55, 1.725, 1.9] // scale 1–5

function answerById(answers, idPrefix) {
  return answers.find((a) => a.id?.startsWith(idPrefix))?.value ?? null
}

/* "5'10\"", "5 ft 10", "70 in", "178 cm", "1.78m" → inches */
export function parseHeightInches(raw) {
  if (!raw) return null
  const s = String(raw).toLowerCase().trim()
  const cm = s.match(/(\d{2,3}(?:\.\d+)?)\s*cm/)
  if (cm) return Math.round(Number(cm[1]) / 2.54)
  const m = s.match(/^(\d(?:\.\d+)?)\s*m$/)
  if (m) return Math.round((Number(m[1]) * 100) / 2.54)
  const ftIn = s.match(/(\d)\s*(?:'|ft|feet)\s*(\d{1,2})?/)
  if (ftIn) return Number(ftIn[1]) * 12 + (Number(ftIn[2]) || 0)
  const inches = s.match(/(\d{2})\s*(?:"|in)/)
  if (inches) return Number(inches[1])
  const bare = Number(s)
  if (!Number.isNaN(bare)) {
    if (bare >= 100 && bare <= 230) return Math.round(bare / 2.54) // assume cm
    if (bare >= 48 && bare <= 90) return bare                      // assume inches
  }
  return null
}

export function suggestTargetsFromIntake(answers = []) {
  const age      = Number(answerById(answers, 'intro-age'))
  const weightLb = Number(answerById(answers, 'intro-weight'))
  const heightIn = parseHeightInches(answerById(answers, 'intro-height'))
  const activityRaw = Number(answerById(answers, 'intro-activity'))
  const sexRaw   = String(answerById(answers, 'intro-sex') || '').toLowerCase()

  if (!age || !weightLb || !heightIn) return null

  const isMale   = !sexRaw.startsWith('f') // default male unless clearly female
  const kg = weightLb * 0.4536
  const cm = heightIn * 2.54
  const bmr = 10 * kg + 6.25 * cm - 5 * age + (isMale ? 5 : -161)
  const factor = ACTIVITY_FACTORS[Math.min(Math.max((activityRaw || 3) - 1, 0), 4)]
  const tdee = Math.round(bmr * factor)

  // Starting point: maintenance, high protein (0.8 g/lb), 25% fat, rest carbs
  const calories = Math.round(tdee / 10) * 10
  const protein  = Math.round(weightLb * 0.8)
  const fat      = Math.round((calories * 0.25) / 9)
  const carbs    = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4))

  return {
    calories, protein, carbs, fat,
    basis: {
      age, weightLb, heightIn,
      sex: isMale ? 'male' : 'female',
      activity: factor, tdee,
    },
  }
}
