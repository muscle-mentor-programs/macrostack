import { useState } from 'react'
import useStore from '../store'
import useCycleTracking from '../hooks/useCycleTracking'
import { supabase } from '../lib/supabase'
import { CYCLE_SYMPTOMS, localDate, validatePeriod } from '../lib/cycleTracking'

const blank = () => ({ start_date: localDate(), end_date: localDate(), symptoms: [], notes: '' })
const button = 'min-h-11 rounded-lg border border-border px-4 py-2 text-sm text-cream hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50'
const input = 'mt-1 w-full min-w-0 rounded-lg border border-border bg-surface p-3 text-cream focus-visible:outline-accent'

export default function CycleTracking({ client }) {
  const userId = useStore(state => state.currentUser?.id)
  if (!userId || client?.profileId !== userId) return null
  return <CyclePanel key={userId} userId={userId} />
}

function CyclePanel({ userId }) {
  const { enabled, periods, loading, error, reload } = useCycleTracking(userId)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [draft, setDraft] = useState(blank)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [visible, setVisible] = useState(6)

  async function mutate(query, success, reset = false) {
    setBusy(true); setMessage('')
    try {
      const result = await query
      if (result.error || !result.data?.length) throw new Error('Save failed')
      if (reset) setDraft(blank())
      setConfirmDelete(null); setMessage(success); reload()
    } catch { setMessage('Could not save the change. Nothing has been confirmed; please retry.') }
    finally { setBusy(false) }
  }

  function save(event) {
    event.preventDefault()
    const problem = validatePeriod(draft, periods)
    if (problem) { setMessage(problem); return }
    const row = { ...draft, user_id: userId }
    const query = draft.id
      ? supabase.from('cycle_periods').update(row).eq('id', draft.id).eq('user_id', userId)
      : supabase.from('cycle_periods').insert(row)
    mutate(query.select('id'), 'Period entry saved.', true)
  }

  return <section className="app-page-inset mb-6 glass-card border border-border rounded-2xl p-4 min-w-0" aria-label="Cycle tracking">
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h2 id="cycle-title" className="font-display font-bold text-xl text-cream">CYCLE TRACKING</h2>
        <p className="text-muted text-sm mt-1">Optional period logging and weight context.</p>
      </div>
      <button type="button" role="switch" aria-checked={enabled} aria-labelledby="cycle-title" aria-controls="cycle-panel"
        disabled={loading || busy || Boolean(error)}
        className={`${button} shrink-0 ${enabled ? 'bg-accent/20' : 'bg-surface'}`}
        onClick={() => { setDraft(blank()); mutate(supabase.from('cycle_tracking_settings').upsert({ user_id: userId, enabled: !enabled }).select('user_id'), enabled ? 'Cycle tracking turned off. Saved entries are retained.' : 'Cycle tracking enabled.') }}>
        {loading ? 'Loading…' : enabled ? 'ON' : 'OFF'}
      </button>
    </div>
    <p className="text-muted text-xs mt-3 leading-relaxed">Private to your account in the app—not shown to coaches or in shared reports. Turning this off hides the feature but keeps your entries until you delete them.</p>
    {error && <div role="alert" className="mt-3 text-sm text-red-400">{error} <button className={button} onClick={reload}>Retry</button></div>}
    <p role="status" className="text-sm text-muted mt-2">{busy ? 'Saving…' : message}</p>
    {enabled && !error && <div id="cycle-panel" className="mt-4 space-y-5">
      <p className="text-sm text-muted leading-relaxed">Log actual period days, not predictions. If your period is still ongoing, use today as the end date and extend the entry later. Cycle-related fluid changes may affect weight, but these logs cannot determine the cause. Your calorie and macro targets stay unchanged.</p>
      <form onSubmit={save} className="space-y-3">
        <fieldset disabled={busy} className="min-w-0 space-y-3">
          <legend className="font-display text-cream mb-2">{draft.id ? 'EDIT PERIOD' : 'LOG PERIOD'}</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm text-muted min-w-0">Start date<input required type="date" min="1900-01-01" max={localDate()} value={draft.start_date} className={input} onChange={e => setDraft({ ...draft, start_date: e.target.value })} /></label>
            <label className="text-sm text-muted min-w-0">Last logged day<input required type="date" min={draft.start_date || '1900-01-01'} max={localDate()} value={draft.end_date} className={input} onChange={e => setDraft({ ...draft, end_date: e.target.value })} /></label>
          </div>
          <fieldset><legend className="text-sm text-muted mb-1">Symptoms (optional)</legend><div className="flex flex-wrap gap-2">
            {CYCLE_SYMPTOMS.map(symptom => <label key={symptom} className="flex items-center gap-2 min-h-11 px-3 border border-border rounded-lg text-sm text-cream">
              <input type="checkbox" checked={draft.symptoms.includes(symptom)} onChange={e => setDraft({ ...draft, symptoms: e.target.checked ? [...draft.symptoms, symptom] : draft.symptoms.filter(value => value !== symptom) })} />{symptom}
            </label>)}
          </div></fieldset>
          <label className="block text-sm text-muted">Notes (optional)<textarea rows={2} maxLength={1000} value={draft.notes} className={input} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></label>
          <div className="flex flex-wrap gap-2"><button type="submit" className={`${button} btn-accent`}>Save period</button>{draft.id && <button type="button" className={button} onClick={() => setDraft(blank())}>Cancel edit</button>}</div>
        </fieldset>
      </form>
      <div>
        <h3 className="font-display text-cream">PERIOD HISTORY</h3>
        {!periods.length && <p className="text-sm text-muted mt-2">No entries yet. Saved period days will be marked on your weight chart.</p>}
        {periods.slice(0, visible).map(period => <div key={period.id} className="border-b border-border py-3">
          <p className="text-sm text-cream break-words">{period.start_date} — {period.end_date}</p>
          <p className="text-sm text-muted break-words">{period.symptoms.join(' · ')}</p>
          <p className="text-sm text-muted whitespace-pre-wrap break-words">{period.notes}</p>
          <div className="flex flex-wrap gap-2 mt-2"><button disabled={busy} className={button} onClick={() => { setDraft({ ...period }); setMessage('Editing the selected entry in the form above.') }}>Edit</button><button disabled={busy} className={button} onClick={() => setConfirmDelete(period.id)}>Delete</button></div>
        </div>)}
        {periods.length > visible && <button className={`${button} mt-3`} onClick={() => setVisible(value => value + 6)}>Show older entries</button>}
      </div>
    </div>}
    {!loading && !error && periods.length > 0 && <button className={`${button} mt-4`} disabled={busy} onClick={() => setConfirmDelete('all')}>Delete all cycle data</button>}
    {confirmDelete && <div className="mt-3 border border-border rounded-lg p-3" role="alert">
      <p className="text-sm text-cream mb-2">{confirmDelete === 'all' ? 'Permanently delete all cycle entries and turn tracking off?' : 'Permanently delete this period entry?'} This cannot be undone.</p>
      <div className="flex flex-wrap gap-2"><button disabled={busy} className={button} onClick={() => mutate(confirmDelete === 'all'
        ? supabase.from('cycle_tracking_settings').delete().eq('user_id', userId).select('user_id')
        : supabase.from('cycle_periods').delete().eq('user_id', userId).eq('id', confirmDelete).select('id'), 'Cycle data deleted.', true)}>Confirm delete</button><button disabled={busy} className={button} onClick={() => setConfirmDelete(null)}>Cancel</button></div>
    </div>}
  </section>
}
