import { supabase } from './supabase'

// Reuse the request ID after an uncertain response so a retry cannot duplicate a note.
const pendingWrites = new Map()

// Append-only entries: editing creates a new revision, never overwrites history.
export async function loadWorkspace(clientId) {
  let query = supabase.from('coach_workspace_entries').select('*').order('created_at', { ascending: false }).order('id', { ascending: false })
  if (clientId) query = query.eq('client_id', clientId)
  const rows = []
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await query.range(offset, offset + 499)
    if (error) throw new Error('Coaching records could not load. Check your connection and that the workspace migration has been applied.')
    rows.push(...data)
    if (data.length < 500) return rows
  }
}

export async function appendWorkspace(entry) {
  const key = JSON.stringify(entry)
  const id = pendingWrites.get(key) || crypto.randomUUID()
  pendingWrites.set(key, id)
  let { data, error } = await supabase.from('coach_workspace_entries').insert({ ...entry, id }).select().single()
  if (error?.code === '23505') {
    const recovered = await supabase.from('coach_workspace_entries').select('*').eq('id', id).single()
    data = recovered.data
    error = recovered.error
  }
  if (error) throw new Error('Not saved. Your draft is still here. Check your connection and try again.')
  if (!data) throw new Error('Save could not be confirmed. Please retry before leaving this page.')
  pendingWrites.delete(key)
  return data
}

export function latestEntries(entries, kind) {
  const seen = new Set()
  return entries.filter(e => e.kind === kind).filter(e => {
    const key = e.record_id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function periodSummary(client, endDate, days = 7) {
  const end = new Date(`${endDate}T12:00:00`)
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date(end); d.setDate(d.getDate() - i)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const logged = dates.filter(d => client.log?.[d]?.length)
  const totals = logged.reduce((sum, date) => {
    for (const food of client.log[date]) for (const key of ['calories', 'protein', 'carbs', 'fat']) sum[key] += Number(food[key]) || 0
    return sum
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 })
  return { days: logged.length, dates, ...Object.fromEntries(Object.entries(totals).map(([key, n]) => [key, logged.length ? Math.round(n / logged.length) : null])) }
}
