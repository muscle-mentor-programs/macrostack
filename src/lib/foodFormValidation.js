export function validServingSize(value) {
  return /^\d+(\.\d*)?$/.test(String(value).trim()) && Number(value) > 0 && Number(value) <= 10000
}

export function validFoodForm(form) {
  return Boolean(form.name.trim() && validServingSize(form.servingSize) && String(form.calories).trim() &&
    ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium'].every(key =>
      Number.isFinite(Number(form[key])) && Number(form[key]) >= 0))
}
