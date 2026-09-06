import { useEffect, useRef, useState } from 'react'
import { format, isValid, parseISO, subDays } from 'date-fns'
import { BookOpen, CheckCheck, ChevronDown, MessageSquare, LayoutDashboard, NotebookPen, ListChecks, ClipboardCheck, History, Target, Plus, LockKeyhole, Pin } from 'lucide-react'
import useStore from '../../store'
import { appendWorkspace, latestEntries, loadWorkspace, periodSummary } from '../../lib/coachWorkspace'
import { workspaceDate, taskMatches, sortTasks } from '../../lib/workspacePresentation'
import './CoachWorkspace.css'

const drafts = new Map()
const originalDrafts = new Map()
const tabs = ['Summary', 'Journal', 'Notes', 'Tasks', 'Reviews', 'Timeline', 'Plan']
const sectionMeta = {
  Summary: [LayoutDashboard, 'The coaching picture', 'Start with what changed, what needs attention, and what happens next.'],
  Journal: [BookOpen, 'Daily nutrition', 'Review the available logs without treating missing entries as zero intake.'],
  Notes: [NotebookPen, 'Your coaching notebook', 'Keep observations, decisions, and supporting evidence together.'],
  Tasks: [ListChecks, 'Follow-ups that move things forward', 'Prioritize by due date, assign responsibility, and keep a complete history.'],
  Reviews: [ClipboardCheck, 'Make the next decision', 'Compare logged weeks and check-ins before documenting your review.'],
  Timeline: [History, 'The complete record', 'Search the client’s activity and your coaching decisions in one place.'],
  Plan: [Target, 'Direction and decisions', 'Current targets and the reasoning behind documented plan changes.'],
}
const templates = {
  'Weekly review': 'CLIENT UPDATE\n\nWINS\n\nBARRIERS\n\nOBSERVATIONS & EVIDENCE\n\nDECISIONS & RATIONALE\n\nAGREED ACTIONS\n\nNEXT REVIEW\n',
  'Initial consultation': 'MAIN GOAL & MOTIVATION\n\nPREFERENCES & RESTRICTIONS\n\nSCHEDULE & RESOURCES\n\nRELEVANT CONTEXT\n\nBASELINE\n\nAGREED PLAN\n\nNEXT STEPS\n',
  'Plateau review': 'DATA COMPLETENESS\n\nWEIGHT & MEASUREMENT TREND\n\nHUNGER, ENERGY & RECOVERY\n\nPOSSIBLE BARRIERS\n\nDECISION & RATIONALE\n\nREVIEW DATE\n',
  'General follow-up': 'UPDATE\n\nOBSERVATIONS\n\nNEXT ACTION\n',
}
const day = () => format(new Date(), 'yyyy-MM-dd')
const stamp = value => {
  if (!value) return 'Unknown date'
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, value.includes('T') ? "MMMM d, yyyy 'at' h:mm a" : 'MMMM d, yyyy') : 'Unknown date'
}
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
  const [owner, setOwner] = useState('all')
  const [visibleEvents, setVisibleEvents] = useState(30)
  const [date, setDate] = useState(day())
  const [days, setDays] = useState(7)
  const draftKey = `${currentUser?.id}:${client.id}`
  const [draft, setDraft] = useState(() => drafts.get(draftKey) || null)
  const [history, setHistory] = useState(null)
  const saveLock = useRef(false)
  const composerRef = useRef(null)
  const hasDraft = !!draft
  useEffect(() => {
    if (hasDraft) {
      composerRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
      composerRef.current?.querySelector('input')?.focus({ preventScroll: true })
    }
  }, [hasDraft])
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
  const tasks = sortTasks(latestEntries(entries, 'task'))
  const openTasks = tasks.filter(e => e.details.state !== 'done')
  const brief = latestEntries(entries, 'brief')[0]
  const plan = latestEntries(entries, 'plan')[0]
  const reviews = latestEntries(entries, 'review')
  const lastReview = reviews[0]
  const scheduledReview = [brief, plan, lastReview].filter(e => e?.details.nextReview).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0]?.details.nextReview
  const now = periodSummary(client, day(), 7)
  const prior = periodSummary(client, format(subDays(new Date(), 7), 'yyyy-MM-dd'), 7)
  const journal = section === 'Journal' ? periodSummary(client, date || day(), days) : null
  const overdueTasks = openTasks.filter(t => t.details.due && t.details.due < day())
  const filteredNotes = notes.filter(e => matches(e) && (filter !== 'pinned' || e.details.pinned)).sort((a, b) => Number(!!b.details.pinned) - Number(!!a.details.pinned))
  const filteredTasks = tasks.filter(t => taskMatches(t, filter, owner, search, day()))
  const navigate = next => { setSection(next); setSearch(''); setFilter('all'); setOwner('all'); setVisibleEvents(30); setHistory(null) }
  function matches(e) { return `${e.title} ${e.body} ${e.details.tags || ''}`.toLowerCase().includes(search.toLowerCase().trim()) }
  const events = [
    ...entries,
    ...clientMessages.map(e => ({ id: `message-${e.id}`, kind: 'message', title: e.from === 'coach' ? 'Coach message' : 'Client message', body: e.text || 'Attachment', created_at: e.timestamp, details: {} })),
    ...(client.mealPlans || []).map(e => ({ id: `mealplan-${e.id}`, kind: 'mealplan', title: e.planName || 'Meal plan', body: 'Meal plan created. View the Plans tab for current contents.', created_at: e.createdAt, details: {} })),
    ...(client.checkins || []).map(e => ({ id: `checkin-${e.id}`, kind: 'checkin', title: 'Client check-in', body: e.notes || (e.answers || []).map(a => `${a.label}: ${a.value}`).join('\n'), created_at: e.createdAt, details: {} })),
    ...(client.photos || []).map(e => ({ id: `photo-${e.id}`, kind: 'photo', title: 'Progress photo', body: e.note || '', created_at: e.createdAt || e.takenAt, details: {} })),
    ...(client.weightLog || []).map(e => ({ id: `weight-${e.id || e.date}`, kind: 'weight', title: `Weight: ${e.value} ${e.unit || 'lbs'}`, body: '', created_at: e.date, details: {} })),
  ].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
  const filteredEvents = events.filter(matches).filter(e => filter === 'all' || e.kind === filter)
  const recordCard = e => <article key={e.id} data-coach-record={e.kind} className={`cw-panel cw-record ${e.details.pinned ? 'cw-record-pinned' : ''}`}>
    <div className="cw-row"><span className="cw-pill">{e.kind}</span><span className="cw-muted">{section === 'Journal' && e.created_at ? format(parseISO(e.created_at), 'MMMM d, yyyy') : stamp(e.created_at)}</span>{e.details.pinned && <span className="cw-pill">Pinned</span>}</div>
    <h3>{e.title}</h3><p>{e.body}</p>
    {e.details.source && <p className="cw-muted">Linked evidence: {section === 'Journal' ? e.details.source.replace(/^\d{4}-\d{2}-\d{2}(?= \/)/, value => format(parseISO(value), 'MMMM d, yyyy')) : e.details.source}</p>}
    {e.details.tags && <p className="cw-muted">Tags: {e.details.tags}</p>}
    {e.kind === 'task' && <div className="cw-task-meta"><span className={`cw-pill ${e.details.state !== 'done' && e.details.due && e.details.due < day() ? 'cw-overdue' : ''}`}>{e.details.state === 'done' ? 'Completed' : e.details.due && e.details.due < day() ? 'Overdue' : 'Open'}</span><span className="cw-pill">{e.details.priority || 'normal'} priority</span><span className="cw-muted">{e.details.owner || 'Coach'} · {e.details.due ? `Due ${workspaceDate(e.details.due)}` : 'No due date'}</span></div>}
    {e.details.nextReview && <p className="cw-muted">Next review: {workspaceDate(e.details.nextReview)}</p>}
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
  return <div data-coach-section={section} className="coach-workspace cw-client-workspace">
    <header className="cw-header cw-client-header"><div><p className="cw-journal-eyebrow"><LockKeyhole size={13} aria-hidden="true" /> PRIVATE CLIENT WORKSPACE</p><h2>{client.name}</h2><p className="cw-muted">{client.email}</p></div>
      <div className="cw-row"><button className="cw-primary" onClick={() => start('note')}><Plus size={14} aria-hidden="true" />Add note</button><button onClick={() => start('task')}><ListChecks size={14} aria-hidden="true" />Create task</button></div>
    </header>
    <details className="cw-privacy"><summary><LockKeyhole size={12} aria-hidden="true" /> Private records & draft storage</summary><p className="cw-muted">Internal records are not sent to the client. Drafts survive workspace navigation in this session, not a browser restart.</p></details>
    <nav className="cw-tabs" aria-label="Client coaching workspace">{tabs.map(t => { const Icon = sectionMeta[t][0]; const count = t === 'Notes' ? notes.length : t === 'Tasks' ? openTasks.length : t === 'Reviews' ? reviews.length : null; return <button key={t} aria-label={t} aria-pressed={section === t} onClick={() => navigate(t)}><Icon size={15} aria-hidden="true" /><span>{t}</span>{count !== null && <span className="cw-nav-count" aria-hidden="true">{loading ? '—' : count}</span>}</button> })}</nav>
    <div className="cw-section-intro"><h3>{sectionMeta[section][1]}</h3><p className="cw-muted">{sectionMeta[section][2]}</p></div>
    {loading && <p role="status">Loading coaching records…</p>}
    {error && <div role="alert" className="cw-error">{error} Existing client tools and records remain available. <button onClick={() => { setLoading(true); loadWorkspace(client.id).then(rows => { setEntries(rows); setError('') }).catch(e => setError(e.message)).finally(() => setLoading(false)) }}>Retry loading</button></div>}
    {status && <p role="status" className="cw-status">{status}</p>}
    {draft && <form ref={composerRef} className="cw-panel cw-composer" onSubmit={async e => { e.preventDefault(); if (await save(draft)) setDraft(null) }}>
      <fieldset disabled={busy}>
      <h3>{draft.kind === 'review' ? 'Complete coaching review' : `Write ${draft.kind}`}</h3>
      {draft.kind === 'note' && <label>Template<select defaultValue="" onChange={e => { if (e.target.value) { change('body', templates[e.target.value]); change('title', e.target.value) } }}><option value="">Choose a template</option>{Object.keys(templates).map(t => <option key={t}>{t}</option>)}</select></label>}
      <label>Title<input disabled={busy} required maxLength={200} value={draft.title} onChange={e => change('title', e.target.value)} /></label>
      <label>{draft.kind === 'brief' ? 'Goals, motivation, restrictions, schedule, barriers, and communication preferences' : 'Notes, decisions, and next steps'}<textarea aria-label={draft.kind === 'brief' ? 'Client brief' : 'Notes, decisions, and next steps'} required maxLength={30000} value={draft.body} onChange={e => change('body', e.target.value)} /></label>
      <div className="cw-grid"><label>Tags<input value={draft.details.tags || ''} onChange={e => detail('tags', e.target.value)} placeholder="travel, hunger, plateau" /></label><label>Linked evidence<input value={draft.details.source || ''} onChange={e => detail('source', e.target.value)} placeholder="Check-in date, meal, or measurement" /></label></div>
      {draft.kind === 'task' && <div className="cw-grid"><label>Due date<input type="date" required value={draft.details.due || ''} onChange={e => detail('due', e.target.value)} /></label><label>Responsible person<select value={draft.details.owner || 'Coach'} onChange={e => detail('owner', e.target.value)}><option>Coach</option><option>Client — coach tracked</option></select></label></div>}
      {draft.kind === 'task' && <label>Priority<select aria-label="Task priority" value={draft.details.priority || 'normal'} onChange={e => detail('priority', e.target.value)}><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select></label>}
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
      <div className="cw-grid"><section className="cw-panel"><h3>Week-over-week context</h3><p className="cw-muted">Logged-day averages, compared with the previous seven days. Different logging coverage can change these averages.</p><dl className="cw-comparison">{[['calories','Calories','kcal'],['protein','Protein','g'],['carbs','Carbs','g'],['fat','Fat','g']].map(([key,label,unit]) => <div key={key}><dt>{label}</dt><dd><strong>{now[key] === null ? '—' : `${now[key]} ${unit}`}</strong><span>{now[key] === null || prior[key] === null ? 'Not enough data to compare' : `${now[key] - prior[key] > 0 ? '+' : ''}${now[key] - prior[key]} ${unit} vs previous week`}</span></dd></div>)}</dl><button onClick={() => navigate('Reviews')}>Open reviews</button></section>
      <section className="cw-panel"><h3>Review queue</h3><div className="cw-queue"><button onClick={() => { navigate('Tasks'); setFilter('overdue') }}><span>Overdue follow-ups</span><strong>{loading ? '—' : overdueTasks.length}</strong></button><button onClick={() => { navigate('Tasks'); setFilter('today') }}><span>Due today</span><strong>{loading ? '—' : openTasks.filter(t => t.details.due === day()).length}</strong></button><button onClick={() => { navigate('Notes'); setFilter('pinned') }}><span>Pinned observations</span><strong>{loading ? '—' : notes.filter(n => n.details.pinned).length}</strong></button></div><p className="cw-muted">Latest scheduled review: {workspaceDate(scheduledReview)}</p></section></div>
      <div className="cw-section-heading"><h3>Next actions</h3><button onClick={() => { navigate('Tasks'); setFilter('open') }}>View all tasks</button></div><div className="cw-record-grid">{openTasks.slice(0, 4).map(recordCard)}</div>{!openTasks.length && <p className="cw-empty">No open tasks. Create a follow-up from a note or review.</p>}
      {!!notes.filter(n => n.details.pinned).length && <><h3 className="cw-section-heading">Pinned observations</h3><div className="cw-record-grid">{notes.filter(n => n.details.pinned).map(recordCard)}</div></>}
    </>}
    {section === 'Notes' && <><div className="cw-toolbar"><label>Search notes<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search text or tags" /></label><button aria-pressed={filter === 'pinned'} onClick={() => setFilter(filter === 'pinned' ? 'all' : 'pinned')}><Pin size={14} aria-hidden="true" />Pinned only</button><button onClick={() => start('note')}>New coaching note</button></div><p className="cw-muted cw-result-count">{filteredNotes.length} matching notes · Pinned notes first</p><div className="cw-record-grid">{filteredNotes.map(recordCard)}</div>{!filteredNotes.length && <p className="cw-empty">{notes.length ? 'No notes match. Try a different search or turn off the pinned filter.' : 'Create your first dated note. Your original notes are preserved below.'}</p>}<LegacyCoachNotes key={client.id} clientId={client.id} /></>}
    {section === 'Tasks' && <><div className="cw-toolbar"><label>Search tasks<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search follow-ups or tags" /></label><label>Task status<select aria-label="Task status" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All tasks</option><option value="open">Open</option><option value="overdue">Overdue</option><option value="today">Due today</option><option value="done">Completed</option></select></label><label>Task owner<select aria-label="Task owner" value={owner} onChange={e => setOwner(e.target.value)}><option value="all">Everyone</option><option>Coach</option><option>Client — coach tracked</option></select></label><button onClick={() => start('task')}>New follow-up</button></div><p className="cw-muted cw-result-count">{filteredTasks.length} matching tasks · Open first, then due date and priority. Client-owned tasks are coach-tracked, not sent automatically.</p><div className="cw-record-grid">{filteredTasks.map(recordCard)}</div>{!filteredTasks.length && <p className="cw-empty">{tasks.length ? 'No tasks match these filters.' : 'No follow-ups yet. Create one with a due date, owner, and priority.'}</p>}</>}
    {section === 'Reviews' && <><div className="cw-grid">{[['This week', now], ['Previous week', prior]].map(([label, stats]) => <div className="cw-panel" key={label}><h3>{label}</h3><p>{stats.days}/7 days logged</p><p>Average: {stats.calories ?? '—'} kcal · {stats.protein ?? '—'}g protein</p><p className="cw-muted">Logged days only; missing days excluded.</p></div>)}</div><div className="cw-grid">{(client.checkins || []).slice(0, 2).map((c, i) => <div className="cw-panel" key={c.id}><h3>{i ? 'Previous check-in' : 'Latest check-in'}</h3><p className="cw-muted">{stamp(c.createdAt)}</p><p>{c.notes}</p>{(c.answers || []).map((a, n) => <p key={n}>{a.label}: {String(a.value ?? '—')}</p>)}</div>)}</div><button onClick={() => { if (!draft) setDraft({ record_id: crypto.randomUUID(), kind: 'review', title: `Review — ${day()}`, body: templates['Weekly review'], details: { snapshot: { current: now, previous: prior, goals: client.goals, checkinId: client.checkins?.[0]?.id || null } } }) }}>Complete review</button><p className="cw-muted">Saving records your review. It does not send a message or change client targets.</p>{reviews.map(recordCard)}</>}
    {section === 'Journal' && <section className="cw-journal" aria-label="Client journal">
      <div className="cw-panel cw-journal-toolbar">
        <div><span className="cw-journal-eyebrow"><BookOpen size={14} aria-hidden="true" /> DAILY NUTRITION</span><h3>Client journal</h3><p className="cw-muted">Explore meals, leave private observations, and track your reviews.</p></div>
        <div className="cw-journal-filters"><label>Period ending<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label><label>Show<select value={days} onChange={e => setDays(Number(e.target.value))}>{[7,14,30].map(n => <option key={n} value={n}>{n} days</option>)}</select></label></div>
      </div>
      <div className="cw-journal-context"><p><strong>{journal.days} of {days}</strong> days with entries</p><p className="cw-muted">Ending {format(parseISO(date || day()), 'MMMM d, yyyy')} · Logged entries may be incomplete. No log does not mean no intake.</p></div>
      <div className="cw-journal-grid">{journal.dates.map(d => {
        const foods = client.log?.[d] || []; const reviewed = latestEntries(entries, 'day_review').some(e => e.details.date === d)
        const totals = foods.reduce((sum, food) => { for (const key of ['calories','protein','carbs','fat']) sum[key] += Number(food[key]) || 0; return sum }, {calories:0,protein:0,carbs:0,fat:0})
        const dateLabel = format(parseISO(d), 'MMMM d, yyyy')
        return <details className="cw-panel cw-journal-day" key={d}><summary>
          <span className="cw-journal-dayline"><span className="cw-journal-eyebrow">{format(parseISO(d), 'EEEE')}</span>{reviewed && <span className="cw-journal-reviewed"><CheckCheck size={14} aria-hidden="true" /> Reviewed</span>}</span>
          <span className="cw-journal-date">{dateLabel}</span>
          <span className="cw-journal-metrics">{[['calories','kcal'],['protein','protein'],['carbs','carbs'],['fat','fat']].map(([key,label]) => <span key={key}><strong>{foods.length ? `${Math.round(totals[key])}${key === 'calories' ? '' : 'g'}` : '—'}</strong><span>{label}</span></span>)}</span>
          <span className="cw-journal-expand"><span>{foods.length ? `${foods.length} ${foods.length === 1 ? 'entry' : 'entries'} · View journal` : 'No entries logged'}</span><ChevronDown size={16} aria-hidden="true" /></span>
        </summary><div className="cw-journal-body">
          {!foods.length && <p className="cw-muted">No food entries are available for this day. Intake is unknown.</p>}
          {foods.map((food, i) => <div className="cw-journal-food" key={food.id || i}><span className="cw-journal-eyebrow">{food.meal || 'Meal'}</span><h4>{food.name}</h4><p className="cw-muted">{Math.round(food.calories || 0)} kcal · {Math.round(food.protein || 0)}g protein · {Math.round(food.carbs || 0)}g carbs · {Math.round(food.fat || 0)}g fat</p><button onClick={() => start('comment', `${d} / ${food.meal || 'meal'} / ${food.name} / ${food.id || i}`)}><MessageSquare size={13} aria-hidden="true" /> Add private comment</button></div>)}
          <button disabled={busy || loading || !!error || reviewed} onClick={() => save({ record_id: crypto.randomUUID(), kind: 'day_review', title: `Journal reviewed — ${dateLabel}`, body: 'Coach reviewed the available entries. This does not certify a complete food log.', details: { date: d } })}><CheckCheck size={14} aria-hidden="true" />{reviewed ? 'Reviewed' : 'Mark reviewed'}</button>
          {latestEntries(entries, 'comment').filter(e => e.details.source?.startsWith(d)).map(recordCard)}
        </div></details>
      })}</div>
    </section>}
    {section === 'Timeline' && <><div className="cw-toolbar"><label>Search history<input type="search" value={search} onChange={e => { setSearch(e.target.value); setVisibleEvents(30) }} /></label><label>Event type<select aria-label="Event type" value={filter} onChange={e => { setFilter(e.target.value); setVisibleEvents(30) }}>{['all','note','task','review','brief','plan','comment','day_review','checkin','photo','weight','message','mealplan'].map(k => <option key={k}>{k}</option>)}</select></label></div><p className="cw-muted cw-result-count">{filteredEvents.length} matching events · Newest first · Earlier revisions are retained</p><div className="cw-timeline">{filteredEvents.slice(0, visibleEvents).map(e => <article className="cw-panel" key={e.id}><span className="cw-pill">{e.kind}</span><p className="cw-muted">{stamp(e.created_at)}</p><h3>{e.title}</h3><p>{e.body}</p></article>)}</div>{!filteredEvents.length && <p className="cw-empty">No events match these filters.</p>}{filteredEvents.length > visibleEvents && <button onClick={() => setVisibleEvents(n => n + 30)}>Show more events</button>}</>}
    {section === 'Plan' && <><div className="cw-panel"><h3>Current targets</h3><p>{client.goals.calories} kcal · {client.goals.protein}g protein · {client.goals.carbs}g carbs · {client.goals.fat}g fat</p><p className="cw-muted">Use the existing Overview target controls and Plans tab to make changes. Historical targets before documented snapshots are unknown.</p></div><button onClick={() => { if (!draft) setDraft({ record_id: crypto.randomUUID(), kind: 'plan', title: `Plan decision — ${day()}`, body: 'COACHING PHASE\n\nGOAL & MILESTONES\n\nRATIONALE\n\nNEXT ACTIONS\n', details: { snapshot: { goals: client.goals, mealPlanId: client.activeMealPlanId || null }, previous: plan?.details.snapshot || null } }) }}>Document plan & rationale</button><p className="cw-muted">Snapshots preserve targets at the time you document a decision. They do not retroactively reconstruct earlier changes.</p>{latestEntries(entries, 'plan').map(recordCard)}</>}
  </div>
}
