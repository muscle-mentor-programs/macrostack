export function calculatedCalories(targets) {
  const macros = ['protein', 'carbs', 'fat'].map(key => targets?.[key]);
  if (macros.some(value => value == null || String(value).trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0)) return '';
  return Math.round(Number(macros[0]) * 4 + Number(macros[1]) * 4 + Number(macros[2]) * 9);
}
export function withCalculatedCalories(targets) {
  return {...targets, calories: calculatedCalories(targets)};
}
