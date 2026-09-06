import { useEffect, useRef, useState } from 'react'
import { format, subDays } from 'date-fns'
import useStore from '../../store'
import { appendWorkspace, latestEntries, loadWorkspace, periodSummary } from '../../lib/coachWorkspace'
import './CoachWorkspace.css'

const drafts = new Map()
const originalDrafts = new Map()
const tabs = ['Summary', 'Journal', 'Notes', 'Tasks', 'Reviews', 'Timeline', 'Plan']
const templates = {
  'Weekly review': 'CLIENT UPDATE\n\nWINS\n\nBARRIERS\n\nOBSERVATIONS & EVIDENCE\n\nDECISIONS & RATIONALE\n\nAGREED ACTIONS\n\nNEXT REVIEW\n',
  'Initial consultation': 'MAIN GOAL & MOTIVATION\n\nPREFERENCES & RESTRICTIONS\n\nSCHEDULE & RESOURCES\n\nRELEVANT CONTEXT\n\nBASELINE\n\nAGREED PLAN\n\nNEXT STEPS\n',
  'Plateau review': 'DATA COMPLETENESS\n\nWEIGHT & MEASUREMENT TREND\n\nHUNGER, ENERGY & RECOVERY\n\nPOSSIBLE BARRIERS\n\nDECISION & RATIONALE\n\nREVIEW DATE\n',
  'General follow-up': 'UPDATE\n\nOBSERVATIONS\n\nNEXT ACTION\n',
}
const day = () => format(new Date(), 'yyyy-MM-dd')
const stamp = value => value ? new Date(value).toLocaleString() : 'Unknown date'
const cleanEntry = e => ({ record_id: e.record_id, kind: e.kind, title: e.title, body: e.body, details: e.details })

export function LegacyCoachNotes({ clientId }) {
  const { fetchClientNote, saveClientNote, currentUser } = useStore()
  const draftKey = `${currentUser?.id}:${clientId}`
  const [body, setBody] = useState('')
  const [status, setStatus] = useState('Loading…')
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    let active = true
    fetchClientNote(clientId).then(value => { if (active) { setBody(originalDrafts.get(draftKey) ?? value); setReady(true); setStatus(originalDrafts.has(draftKey) ? 'Unsaved draft restored' : '') } })
      .catch(() => { if (active) setStatus('Existing notes could not load. Nothing has been overwritten.') })
    return () => { active = false }
  }, [clientId, draftKey, fetchClientNote])
  useEffect(() => {
    const warn = e => { if (originalDrafts.has(draftKey)) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [draftKey])
  return <div className="cw-panel"><h3>Existing private notes</h3>
    <p className="cw-muted">Your original notes remain here, unchanged by the new workspace.</p>
    <label>Original notes<textarea aria-label="Existing private notes" disabled={!ready || saving} value={body} onChange={e => { setBody(e.target.value); originalDrafts.set(draftKey, e.target.value); setStatus('Unsaved changes') }} /></label>
    <button disabled={!ready || saving} onClick={async () => {
      setSaving(true); setStatus('Saving…')
      try { await saveClientNote(clientId, body); originalDrafts.delete(draftKey); setStatus('Saved') } catch { setStatus('Save failed. Your text is still here; please retry.') } finally { setSaving(false) }
    }}>Save original notes</button><p role="status" className="cw-muted">{status}</p>
  </div>
}

export default function ClientWorkspace({ client, initialSection = 'Summary' }) {
  const currentUser = useStore(s => s.currentUser)
  const clientMessages = useStore(s => s.messages[client.id]) || []
  const [section, setSection] = useState(initialSection)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [date, setDate] = useState(day())
  const [days, setDays] = useState(7)
  const draftKey = `${currentUser?.id}:${client.id}`
  const [draft, setDraft] = useState(() => drafts.get(draftKey) || null)
  const [history, setHistory] = useState(null)
  const saveLock = useRef(false)
  useEffect(() => {
    let active = true
    loadWorkspace(client.id).then(rows => { if (active) { setEntries(rows); setError('') } })
      .catch(e => { if (active) setError(e.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [client.id])
  useEffect(() => {
    if (draft) drafts.set(draftKey, draft); else drafts.delete(draftKey)
    const warn = e => { if (draft) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [draft, draftKey])
  const start = (kind, source = null) => {
    if (draft) { setStatus('Finish or discard the open draft first.'); return }
    setStatus(''); setDraft({ kind, record_id: crypto.randomUUID(), title: '', body: '', details: { date: day(), ...(source ? { source } : {}) } })
  }
  const change = (key, value) => setDraft(d => ({ ...d, [key]: value }))
  const detail = (key, value) => setDraft(d => ({ ...d, details: { ...d.details, [key]: value } }))
  const save = async entry => {
    if (saveLock.current || loading || error) return false
    saveLock.current = true
    setBusy(true); setStatus('Saving…')
    try {
      const row = await appendWorkspace({ ...cleanEntry(entry), client_id: client.id, author_id: currentUser.id })
      setEntries(old => [row, ...old.filter(e => e.id !== row.id)]); setStatus('Saved to coaching history.'); return true
    } catch (e) { setStatus(e.message); return false } finally { saveLock.current = false; setBusy(false) }
  }
  const notes = latestEntries(entries, 'note')
  const tasks = latestEntries(entries, 'task')
  const openTasks = tasks.filter(e => e.details.state !== 'done')
  const brief = latestEntries(entries, 'brief')[0]
  const plan = latestEntries(entries, 'plan')[0]
  const reviews = latestEntries(entries, 'review')
  const lastReview = reviews[0]
  const now = periodSummary(client, day(), 7)
  const prior = periodSummary(client, format(subDays(new Date(), 7), 'yyyy-MM-dd'), 7)
  const matches = e => `${e.title} ${e.body} ${e.details.tags || ''}`.toLowerCase().includes(search.toLowerCase())
  const events = [
    ...entries,
    ...clientMessages.map(e => ({ id: `message-${e.id}`, kind: 'message', title: e.from === 'coach' ? 'Coach message' : 'Client message', body: e.text || 'Attachment', created_at: e.timestamp, details: {} })),
    ...(client.mealPlans || []).map(e => ({ id: `mealplan-${e.id}`, kind: 'mealplan', title: e.planName || 'Meal plan', body: 'Meal plan created. View the Plans tab for current contents.', created_at: e.createdAt, details: {} })),
    ...(client.checkins || []).map(e => ({ id: `checkin-${e.id}`, kind: 'checkin', title: 'Client check-in', body: e.notes || (e.answers || []).map(a => `${a.label}: ${a.value}`).join('\n'), created_at: e.createdAt, details: {} })),
    ...(client.photos || []).map(e => ({ id: `photo-${e.id}`, kind: 'photo', title: 'Progress photo', body: e.note || '', created_at: e.createdAt || e.takenAt, details: {} })),
    ...(client.weightLog || []).map(e => ({ id: `weight-${e.id || e.date}`, kind: 'weight', title: `Weight: ${e.value} ${e.unit || 'lbs'}`, body: '', created_at: e.date, details: {} })),
  ].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
  const recordCard = e => <article key={e.id} className="cw-panel">
    <div className="cw-row"><span className="cw-pill">{e.kind}</span><span className="cw-muted">{stamp(e.created_at)}</span>{e.details.pinned && <span className="cw-pill">Pinned</span>}</div>
    <h3>{e.title}</h3><p>{e.body}</p>
    {e.details.source && <p className="cw-muted">Linked evidence: {e.details.source}</p>}
    {e.details.tags && <p className="cw-muted">Tags: {e.details.tags}</p>}
    {e.details.due && <p className="cw-muted">Due {e.details.due} · {e.details.owner || 'Coach'} · {e.details.state || 'open'}</p>}
    {e.details.nextReview && <p className="cw-muted">Next review: {e.details.nextReview}</p>}
    {e.details.clientSummary && <details><summary>Client-ready summary</summary><p>{e.details.clientSummary}</p><button onClick={async () => {
      try { await navigator.clipboard.writeText(e.details.clientSummary); setStatus('Client summary copied. Paste it into Messages when ready; nothing has been sent.') }
      catch { setStatus('Clipboard is unavailable. Select and copy the summary text instead.') }
    }}>Copy client summary</button></details>}
    {e.details.snapshot && <details><summary>Data captured at review</summary><p className="cw-muted">{JSON.stringify(e.details.snapshot, null, 2)}</p></details>}
    <div className="cw-row">
      <button disabled={busy || !!draft} onClick={() => { setDraft(cleanEntry(e)); setStatus('Editing creates a new revision; the previous entry is retained.') }}>Revise</button>
      <button onClick={() => setHistory(e.record_id)}>History</button>
      {e.kind !== 'task' && <button onClick={() => start('task', `${e.kind}: ${e.title} (${e.id})`)}>Create follow-up</button>}
      {e.kind === 'task' && <button disabled={busy || !!draft} onClick={() => save({ ...e, details: { ...e.details, state: e.details.state === 'done' ? 'open' : 'done' } })}>{e.details.state === 'done' ? 'Reopen' : 'Complete task'}</button>}
    </div>
  </article>
  return <div className="coach-workspace">
    <header className="cw-header"><div><p className="cw-muted">PRIVATE COACHING WORKSPACE</p><h2>{client.name}</h2></div>
      <div className="cw-row"><button onClick={() => start('note')}>Add note</button><button onClick={() => start('task')}>Create task</button></div>
    </header>
    <p className="cw-muted">Internal records are not sent to the client. Drafts survive workspace navigation in this session, not a browser restart.</p>
    <nav className="cw-tabs" aria-label="Client coaching workspace">{tabs.map(t => <button key={t} aria-pressed={section === t} onClick={() => { setSection(t); setSearch(''); setFilter('all'); setHistory(null) }}>{t}</button>)}</nav>
    {loading && <p role="status">Loading coaching records…</p>}
    {error && <div role="alert" className="cw-error">{error} Existing client tools and records remain available. <button onClick={() => { setLoading(true); loadWorkspace(client.id).then(rows => { setEntries(rows); setError('') }).catch(e => setError(e.message)).finally(() => setLoading(false)) }}>Retry loading</button></div>}
    {status && <p role="status" className="cw-panel">{status}</p>}
    {draft && <form className="cw-panel" onSubmit={async e => { e.preventDefault(); if (await save(draft)) setDraft(null) }}>
      <fieldset disabled={busy}>
      <h3>{draft.kind === 'review' ? 'Complete coaching review' : `Write ${draft.kind}`}</h3>
      {draft.kind === 'note' && <label>Template<select defaultValue="" onChange={e => { if (e.target.value) { change('body', templates[e.target.value]); change('title', e.target.value) } }}><option value="">Choose a template</option>{Object.keys(templates).map(t => <option key={t}>{t}</option>)}</select></label>}
      <label>Title<input disabled={busy} required maxLength={200} value={draft.title} onChange={e => change('title', e.target.value)} /></label>
      <label>{draft.kind === 'brief' ? 'Goals, motivation, restrictions, schedule, barriers, and communication preferences' : 'Notes, decisions, and next steps'}<textarea aria-label={draft.kind === 'brief' ? 'Client brief' : 'Notes, decisions, and next steps'} required maxLength={30000} value={draft.body} onChange={e => change('body', e.target.value)} /></label>
      <div className="cw-grid"><label>Tags<input value={draft.details.tags || ''} onChange={e => detail('tags', e.target.value)} placeholder="travel, hunger, plateau" /></label><label>Linked evidence<input value={draft.details.source || ''} onChange={e => detail('source', e.target.value)} placeholder="Check-in date, meal, or measurement" /></label></div>
      {draft.kind === 'task' && <div className="cw-grid"><label>Due date<input type="date" required value={draft.details.due || ''} onChange={e => detail('due', e.target.value)} /></label><label>Responsible person<select value={draft.details.owner || 'Coach'} onChange={e => detail('owner', e.target.value)}><option>Coach</option><option>Client — coach tracked</option></select></label></div>}
      {['review', 'plan', 'brief'].includes(draft.kind) && <label>Next review date<input type="date" value={draft.details.nextReview || ''} onChange={e => detail('nextReview', e.target.value)} /></label>}
      {draft.kind === 'review' && <label>Client-ready summary (optional; separate from private notes)<textarea aria-label="Client-ready summary" maxLength={10000} value={draft.details.clientSummary || ''} onChange={e => detail('clientSummary', e.target.value)} placeholder="Write only what you want to share. After saving, copy this summary into Messages." /></label>}
      {draft.kind === 'note' && <label><select aria-label="Pin note" value={draft.details.pinned ? 'yes' : 'no'} onChange={e => detail('pinned', e.target.value === 'yes')}><option value="no">Standard note</option><option value="yes">Pin important note</option></select></label>}
      <div className="cw-row"><button disabled={busy || loading || !!error} type="submit">{busy ? 'Saving…' : 'Save private record'}</button><button disabled={busy} type="button" onClick={() => { if (window.confirm('Discard this unsaved draft?')) setDraft(null) }}>Discard draft</button></div>
      </fieldset>
    </form>}
    {history && <div className="cw-panel"><h3>Revision history — newest first</h3><button onClick={() => setHistory(null)}>Close history</button>{entries.filter(e => e.record_id === history).map(e => <div key={e.id} className="cw-panel"><p className="cw-muted">{stamp(e.created_at)} · Author {e.author_id}</p><h3>{e.title}</h3><p>{e.body}</p><p className="cw-muted">{e.details.state || ''}</p></div>)}</div>}
    {section === 'Summary' && <>
      <div className="cw-stats">{[['Days logged', `${now.days}/7`], ['Avg calories', now.calories ?? '—'], ['Avg protein', now.protein === null ? '—' : `${now.protein}g`], ['Open tasks', openTasks.length]].map(([label, value]) => <div className="cw-panel cw-stat" key={label}><strong>{value}</strong><span className="cw-muted">{label}</span></div>)}</div>
      <p className="cw-muted">Averages use logged days only; partial logs are not proof of intake or adherence.</p>
      <div className="cw-grid"><div className="cw-panel"><h3>Client brief</h3><p>{brief?.body || 'Add goals, preferences, restrictions, schedule, barriers, and what matters to this client.'}</p><p className="cw-muted">{brief ? `Last reviewed ${stamp(brief.created_at)}` : 'No brief recorded yet.'}</p><button onClick={() => brief && !draft ? setDraft(cleanEntry(brief)) : start('brief')}>Update brief</button></div>
        <div className="cw-panel"><h3>Needs attention</h3><p>{(client.checkins || []).filter(c => !c.reviewed).length} unreviewed check-ins</p><p>{openTasks.filter(t => t.details.due && t.details.due < day()).length} overdue follow-ups</p><p>{lastReview ? `Last completed review: ${stamp(lastReview.created_at)}` : 'No coaching review recorded yet.'}</p><p className="cw-muted">{events.filter(e => e.kind !== 'review' && (!lastReview || e.created_at > lastReview.created_at)).length} recorded events since last review</p></div></div>
      <h3>Next actions</h3>{openTasks.slice(0, 4).map(recordCard)}{!openTasks.length && <p className="cw-muted">No open tasks. Create a follow-up from a note or review.</p>}
      {notes.filter(n => n.details.pinned).map(recordCard)}
    </>}
    {section === 'Notes' && <><label className="cw-muted">Search notes<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search text or tags" /></label><div className="cw-row"><button onClick={() => start('note')}>New coaching note</button></div>{notes.filter(matches).map(recordCard)}{!notes.length && <p className="cw-muted">Create your first dated note. Your original notes are preserved below.</p>}<LegacyCoachNotes key={client.id} clientId={client.id} /></>}
    {section === 'Tasks' && <><div className="cw-row"><button onClick={() => start('task')}>New follow-up</button><button aria-pressed={filter === 'open'} onClick={() => setFilter(filter === 'open' ? 'all' : 'open')}>Open only</button></div>{tasks.filter(t => filter !== 'open' || t.details.state !== 'done').map(recordCard)}{!tasks.length && <p className="cw-muted">No follow-ups yet. Due dates appear in the coach workboard.</p>}</>}
    {section === 'Reviews' && <><div className="cw-grid">{[['This week', now], ['Previous week', prior]].map(([label, stats]) => <div className="cw-panel" key={label}><h3>{label}</h3><p>{stats.days}/7 days logged</p><p>Average: {stats.calories ?? '—'} kcal · {stats.protein ?? '—'}g protein</p><p className="cw-muted">Logged days only; missing days excluded.</p></div>)}</div><div className="cw-grid">{(client.checkins || []).slice(0, 2).map((c, i) => <div className="cw-panel" key={c.id}><h3>{i ? 'Previous check-in' : 'Latest check-in'}</h3><p className="cw-muted">{stamp(c.createdAt)}</p><p>{c.notes}</p>{(c.answers || []).map((a, n) => <p key={n}>{a.label}: {String(a.value ?? '—')}</p>)}</div>)}</div><button onClick={() => { if (!draft) setDraft({ record_id: crypto.randomUUID(), kind: 'review', title: `Review — ${day()}`, body: templates['Weekly review'], details: { snapshot: { current: now, previous: prior, goals: client.goals, checkinId: client.checkins?.[0]?.id || null } } }) }}>Complete review</button><p className="cw-muted">Saving records your review. It does not send a message or change client targets.</p>{reviews.map(recordCard)}</>}
    {section === 'Journal' && <>
      <div className="cw-grid"><label>Period ending<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label><label>Days<select value={days} onChange={e => setDays(Number(e.target.value))}>{[7,14,30].map(n => <option key={n}>{n}</option>)}</select></label></div>
      <p className="cw-muted">{periodSummary(client, date || day(), days).days}/{days} days have entries. Logging completeness is unconfirmed; zero logged food does not mean zero intake.</p>
      {periodSummary(client, date || day(), days).dates.map(d => {
        const foods = client.log?.[d] || []; const reviewed = latestEntries(entries, 'day_review').some(e => e.details.date === d)
        return <details className="cw-panel" key={d}><summary>{d} · {foods.length ? `${foods.length} entries · completeness unconfirmed` : 'Not logged'} {reviewed ? '· Reviewed' : ''}</summary>
          {foods.map((food, i) => <div className="cw-panel" key={food.id || i}><h3>{food.meal || 'Meal'} · {food.name}</h3><p>{Math.round(food.calories || 0)} kcal · {Math.round(food.protein || 0)}g protein</p><button onClick={() => start('comment', `${d} / ${food.meal || 'meal'} / ${food.name} / ${food.id || i}`)}>Add private comment</button></div>)}
          <button disabled={busy || !!error} onClick={() => save({ record_id: crypto.randomUUID(), kind: 'day_review', title: `Journal reviewed — ${d}`, body: 'Coach reviewed the available entries. This does not certify a complete food log.', details: { date: d } })}>Mark reviewed</button>
          {latestEntries(entries, 'comment').filter(e => e.details.source?.startsWith(d)).map(recordCard)}
        </details>
      })}
    </>}
    {section === 'Timeline' && <><div className="cw-grid"><label>Search history<input type="search" value={search} onChange={e => setSearch(e.target.value)} /></label><label>Event type<select value={filter} onChange={e => setFilter(e.target.value)}>{['all','note','task','review','brief','plan','comment','day_review','checkin','photo','weight'].map(k => <option key={k}>{k}</option>)}</select></label></div><div className="cw-timeline">{events.filter(matches).filter(e => filter === 'all' || e.kind === filter).map(e => <article className="cw-panel" key={e.id}><span className="cw-pill">{e.kind}</span><p className="cw-muted">{stamp(e.created_at)}</p><h3>{e.title}</h3><p>{e.body}</p></article>)}</div></>}
    {section === 'Plan' && <><div className="cw-panel"><h3>Current targets</h3><p>{client.goals.calories} kcal · {client.goals.protein}g protein · {client.goals.carbs}g carbs · {client.goals.fat}g fat</p><p className="cw-muted">Use the existing Overview target controls and Plans tab to make changes. Historical targets before documented snapshots are unknown.</p></div><button onClick={() => { if (!draft) setDraft({ record_id: crypto.randomUUID(), kind: 'plan', title: `Plan decision — ${day()}`, body: 'COACHING PHASE\n\nGOAL & MILESTONES\n\nRATIONALE\n\nNEXT ACTIONS\n', details: { snapshot: { goals: client.goals, mealPlanId: client.activeMealPlanId || null }, previous: plan?.details.snapshot || null } }) }}>Document plan & rationale</button><p className="cw-muted">Snapshots preserve targets at the time you document a decision. They do not retroactively reconstruct earlier changes.</p>{latestEntries(entries, 'plan').map(recordCard)}</>}
  </div>
}
