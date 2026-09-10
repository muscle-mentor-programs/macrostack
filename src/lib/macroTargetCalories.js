// Daily target calories use the standard 4/4/9 calculation, rounded once.
export function macroTargetCalories({ protein, carbs, fat }) {
  const grams = [protein, carbs, fat]
  if (grams.some(value => value === '' || value == null || !Number.isFinite(Number(value)) || Number(value) < 0)) return null
  const calories = Math.round(Number(protein) * 4 + Number(carbs) * 4 + Number(fat) * 9)
  return Number.isSafeInteger(calories) ? calories : null
}
