import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import useStore from '../../store'
import { latestEntries, loadWorkspace } from '../../lib/coachWorkspace'
import '../../components/coach/CoachWorkspace.css'

export default function CoachWorkboard() {
  const { clients, messages, setActivePage, setViewingClientId } = useStore()
  const [entries, setEntries] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  useEffect(() => {
    let active = true
    loadWorkspace().then(rows => { if (active) setEntries(rows) }).catch(e => { if (active) setError(e.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  const today = format(new Date(), 'yyyy-MM-dd')
  const recordsUnavailable = loading || !!error
  const tasks = latestEntries(entries, 'task').filter(e => e.details.state !== 'done')
  const open = client => { setViewingClientId(client.id, 'workspace'); setActivePage('clients') }
  const rows = clients.map(client => ({ client,
    unread: (messages[client.id] || []).filter(m => m.from === 'client' && !m.readByCoach).length,
    checkins: (client.checkins || []).filter(c => !c.reviewed).length,
    tasks: tasks.filter(t => t.client_id === client.id && t.details.due && t.details.due <= today).length,
  }))
  const visibleRows = rows.filter(r => `${r.client.name} ${r.client.email} ${(r.client.tags || []).join(' ')}`.toLowerCase().includes(search.toLowerCase()))
    .filter(r => filter === 'all' || (filter === 'attention' ? r.unread + r.checkins + r.tasks > 0 : r[filter] > 0))
  return <div className="h-full overflow-y-auto"><div className="coach-workspace pt-mobile-header">
    <header className="cw-header"><div><p className="cw-muted">COACH PORTAL / YOUR DAY</p><h2>Coaching workboard</h2><p className="cw-muted">Review changes, follow through, and keep every client moving.</p></div><button onClick={() => setActivePage('insights')}>Open full dashboard</button></header>
    <div className="cw-stats">{[['Clients',clients.length],['Unread messages',rows.reduce((n,r)=>n+r.unread,0)],['Check-ins to review',rows.reduce((n,r)=>n+r.checkins,0)],['Tasks due',recordsUnavailable ? '—' : rows.reduce((n,r)=>n+r.tasks,0)]].map(([label,value])=><div className="cw-panel cw-stat" key={label}><strong>{value}</strong><span className="cw-muted">{label}</span></div>)}</div>
    {loading && <p role="status">Loading follow-ups…</p>}
    {error && <p className="cw-error" role="alert">{error} Task counts are unavailable. Your existing client data and dashboard are still available.</p>}
    <nav className="cw-tabs" aria-label="Coach quick actions">{[['clients','Manage clients'],['chat','Messages'],['foods','Food library'],['forms','Forms & check-ins'],['profile','Coach profile'],['upgrade','Your plan']].map(([id,label])=><button key={id} onClick={()=>setActivePage(id)}>{label}</button>)}</nav>
    <div className="cw-grid"><label className="cw-muted">Find a client<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, email, or tags" /></label><label className="cw-muted">Show<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All clients</option><option value="attention">Needs attention</option><option value="checkins">New check-ins</option><option value="tasks">Follow-ups due</option><option value="unread">Unread messages</option></select></label></div>
    <div className="cw-grid">{visibleRows.map(r=><article key={r.client.id} className="cw-panel"><h3>{r.client.name}</h3><p className="cw-muted">{r.client.email || 'No email'} · {r.client.status || 'active'}</p><div className="cw-row"><span className="cw-pill">{r.unread} unread</span><span className="cw-pill">{r.checkins} check-ins</span><span className="cw-pill">{recordsUnavailable?'—':r.tasks} tasks due</span></div><button className="mt-4" onClick={()=>open(r.client)}>Open client workspace</button></article>)}</div>
    {!!clients.length && !visibleRows.length && <p className="cw-muted">{recordsUnavailable && ['tasks','attention'].includes(filter) ? 'Follow-up data is unavailable. Other client tools remain available.' : 'No clients match these filters.'}</p>}
    {!clients.length&&<div className="cw-panel"><h3>Your client workspace starts here</h3><p>Add your first client, then manage their reviews, notes, and next steps in one place.</p><button onClick={()=>setActivePage('clients')}>Add a client</button></div>}
    <section className="cw-panel"><h3>Upcoming follow-ups</h3>{tasks.slice().sort((a,b)=>(a.details.due||'9999').localeCompare(b.details.due||'9999')).slice(0,12).map(t=>{const client=clients.find(c=>c.id===t.client_id);return <div className="cw-row" key={t.id}><span>{t.details.due || 'No date'} · {client?.name || 'Client'} · {t.title}</span>{client&&<button onClick={()=>open(client)}>Review</button>}</div>})}{!tasks.length&&!recordsUnavailable&&<p className="cw-muted">No open follow-ups.</p>}</section>
  </div></div>
}
