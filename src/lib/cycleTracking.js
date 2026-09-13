export const CYCLE_SYMPTOMS = ['Bloating', 'Cramps', 'Appetite changes', 'Low energy']

export function localDate() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function isPeriodDay(date, periods) {
  return periods.some(period => period.start_date <= date && period.end_date >= date)
}

export function validatePeriod(draft, periods, today = localDate()) {
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
  if (!validDate(draft.start_date) || !validDate(draft.end_date)) return 'Choose valid start and end dates.'
  if (draft.start_date < '1900-01-01' || draft.end_date > today) return 'Use dates between January 1, 1900 and today.'
  if (draft.end_date < draft.start_date) return 'The end date cannot be before the start date.'
  if (draft.notes.length > 1000) return 'Keep notes under 1,000 characters.'
  if (draft.symptoms.some(value => !CYCLE_SYMPTOMS.includes(value))) return 'Choose a listed symptom.'
  if (periods.some(period => period.id !== draft.id && period.start_date <= draft.end_date && period.end_date >= draft.start_date)) {
    return 'These dates overlap an existing entry. Edit that entry instead.'
  }
  return ''
}
