/**
 * Keep macro targets and calories consistent: calories = 4·protein + 4·carbs + 9·fat.
 *
 * - Editing protein / carbs / fat → calories is recomputed from the macros.
 * - Editing calories → carbs back-solves to hit that calorie target (protein and
 *   fat stay anchored), clamped at 0 so it never goes negative.
 *
 * Returns a new goals object; values are kept as-is for the edited field so
 * typing stays smooth.
 *
 * @param {object} prev     - current { calories, protein, carbs, fat }
 * @param {string} key      - the field being edited
 * @param {string|number} rawValue - the new raw input value
 */
export function reconcileGoals(prev, key, rawValue) {
  const next = { ...prev, [key]: rawValue }

  if (key === 'calories') {
    const cal = Number(rawValue || 0)
    const pro = Number(next.protein || 0)
    const fat = Number(next.fat || 0)
    next.carbs = Math.max(0, Math.round((cal - pro * 4 - fat * 9) / 4))
  } else {
    next.calories = Math.round(
      Number(next.protein || 0) * 4 +
      Number(next.carbs   || 0) * 4 +
      Number(next.fat     || 0) * 9
    )
  }

  return next
}
