import { supabase } from './supabase'

export async function marketplace(action, values = {}) {
  if (!supabase) throw new Error('Marketplace is unavailable. Please try again later.')
  const { data, error } = await supabase.functions.invoke('marketplace', { body: { action, ...values } })
  if (error) {
    let message = error.message
    try { message = (await error.context.json()).error || message } catch { /* Network errors have no JSON body. */ }
    throw new Error(message)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

export function coachingPrice(coach) {
  const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(coach.price_cents / 100)
  return coach.billing_mode === 'monthly' ? `${price} / month` : `${price} for ${coach.duration_days} days`
}
