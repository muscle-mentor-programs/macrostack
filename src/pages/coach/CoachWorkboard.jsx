import { useEffect, useState } from 'react'
import ClientAvatar from '../../components/ClientAvatar'
import { ArrowUpRight, Users, TrendingUp, Target, MessageSquare, ClipboardCheck, ListChecks } from 'lucide-react'
import { format } from 'date-fns'
import useStore from '../../store'
import useCoachPreference from '../../hooks/useCoachPreference'
import { latestEntries, loadWorkspace } from '../../lib/coachWorkspace'
import '../../components/coach/CoachWorkspace.css'
export default function CoachWorkboard({ userCount, avgCompliance, activePlans }) {
 const {clients,messages,setActivePage,setViewingClientId,setPendingChatClientId}=useStore()
 const [entries,setEntries]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true)
 const [search,setSearch]=useCoachPreference('roster-search',''),[filter,setFilter]=useCoachPreference('roster-filter','all'),[sort,setSort]=useCoachPreference('roster-sort','attention')
 const [page,setPage]=useState(0),[reload,setReload]=useState(0)
 useEffect(()=>{let active=true;loadWorkspace().then(rows=>{if(active){setEntries(rows);setError('')}}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[reload])
 const today=format(new Date(),'yyyy-MM-dd'),unavailable=loading||!!error
 const tasks=latestEntries(entries,'task').filter(e=>e.details.state!=='done')
 const open=(id,tab='overview')=>{setViewingClientId(id,tab);setActivePage('clients')}
 const chat=id=>{setPendingChatClientId(id);setActivePage('chat')}
 const rows=clients.filter(c=>c.status!=='archived').map(client=>({client,unread:(messages[client.id]||[]).filter(m=>m.from==='client'&&!m.readByCoach).length,checkins:(client.checkins||[]).filter(c=>!c.reviewed).length,tasks:tasks.filter(t=>t.client_id===client.id&&t.details.due&&t.details.due<=today).length,last:Object.keys(client.log||{}).filter(d=>client.log[d]?.length).sort().at(-1)}))
 const visible=rows.filter(r=>`${r.client.name} ${r.client.email||''} ${(r.client.tags||[]).join(' ')}`.toLowerCase().includes(search.toLowerCase())).filter(r=>filter==='all'||(filter==='attention'?r.unread+r.checkins+r.tasks>0:r[filter]>0)).sort((a,b)=>sort==='name'?a.client.name.localeCompare(b.client.name):sort==='last'?(b.last||'').localeCompare(a.last||''):(b.unread+b.checkins+b.tasks)-(a.unread+a.checkins+a.tasks)||a.client.name.localeCompare(b.client.name))
 const pages=Math.max(1,Math.ceil(visible.length/20)),current=Math.min(page,pages-1)
 return <div className="dashboard-workboard">
 <div className="coach-summary-grid">{[['USERS',userCount,Users],['7-DAY LOG',`${avgCompliance}%`,TrendingUp],['PLANS',activePlans,Target]].map(([label,value,Icon])=><div className="glass-card coach-summary-card" key={label}><Icon size={16} aria-hidden="true"/><strong>{value}</strong><span>{label}</span></div>)}</div>
 <div className="cw-stats coach-summary-grid">{[['unread','Unread messages',rows.reduce((n,r)=>n+r.unread,0)],['checkins','New check-ins',rows.reduce((n,r)=>n+r.checkins,0)],['tasks','Tasks due',unavailable?'—':rows.reduce((n,r)=>n+r.tasks,0)]].map(([id,label,value])=><button className="cw-panel cw-stat coach-summary-card" key={id} aria-pressed={filter===id} onClick={()=>{setFilter(id);setPage(0)}}>{id==='unread'?<MessageSquare size={16}/>:id==='checkins'?<ClipboardCheck size={16}/>:<ListChecks size={16}/>}<strong>{value}</strong><span className="cw-muted">{label}</span></button>)}</div>
 {loading&&<p role="status">Loading follow-ups…</p>}{error&&<p role="alert" className="cw-error">{error} <button onClick={()=>{setLoading(true);setReload(n=>n+1)}}>Retry</button></p>}
 <div className="coach-roster-filters"><label>Find a client<input type="search" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} placeholder="Name, email, or tag"/></label><label>Show<select value={filter} onChange={e=>{setFilter(e.target.value);setPage(0)}}><option value="all">All clients</option><option value="attention">Needs attention</option><option value="unread">Unread messages</option><option value="checkins">New check-ins</option><option value="tasks">Tasks due</option></select></label><label>Sort by<select value={sort} onChange={e=>{setSort(e.target.value);setPage(0)}}><option value="attention">Needs attention</option><option value="name">Name</option><option value="last">Last logged</option></select></label></div>
 <div className="coach-roster coach-roster-cards">{visible.slice(current*20,current*20+20).map(r=><article className="coach-roster-row coach-client-card" key={r.client.id}>
   <button className="coach-client-identity" onClick={()=>open(r.client.id)}><ClientAvatar name={r.client.name} avatarUrl={r.client.avatarUrl}/><span><strong>{r.client.name}</strong><small>{r.client.email || 'View client profile'}</small></span></button>
   <dl className="coach-client-metrics"><div><dt>Last logged</dt><dd>{r.last?format(new Date(r.last+'T12:00:00'),'MMM d'):'No logs yet'}</dd></div><div><dt>Check-ins</dt><dd>{r.checkins?`${r.checkins} new`:'Up to date'}</dd></div><div><dt>Tasks due</dt><dd>{unavailable?'—':r.tasks}</dd></div></dl>
   <footer><span className="coach-client-status" data-attention={!!(r.unread+r.checkins+r.tasks)}>{r.client.status==='pending'?'Invitation pending':r.unread?`${r.unread} unread`:r.checkins||r.tasks?'Needs attention':'No pending follow-ups'}</span><button data-action onClick={()=>filter==='tasks'?open(r.client.id,'tasks'):filter==='checkins'||(!r.unread&&r.checkins)?open(r.client.id,'checkin'):r.unread||filter==='unread'?chat(r.client.id):open(r.client.id)}>{filter==='tasks'?'View tasks':filter==='checkins'||(!r.unread&&r.checkins)?'Review check-in':r.unread||filter==='unread'?'Message':'Open client'}<ArrowUpRight size={15} aria-hidden="true"/></button></footer>
 </article>)}</div>
 {!visible.length&&<p className="cw-empty">{clients.length?'No clients match. Change the filters or search.':'Add your first client to start coaching.'}</p>}
 <div className="coach-pagination"><button disabled={current===0} onClick={()=>setPage(current-1)}>Previous</button><span>{visible.length} clients · {current+1}/{pages}</span><button disabled={current+1>=pages} onClick={()=>setPage(current+1)}>Next</button></div>
 <button className="btn-accent px-4 py-3 rounded-lg font-display" onClick={()=>setActivePage('clients')}>Manage clients</button>
 </div>
}
