import { LayoutDashboard, Users, MessageCircle, BookOpen, Menu } from 'lucide-react'
import useStore from '../store'
const nav=[['dashboard','Home',LayoutDashboard],['clients','Clients',Users],['chat','Messages',MessageCircle],['library','Library',BookOpen],['more','More',Menu]]
export default function CoachBottomNav(){
 const {activePage,setActivePage,clients,messages,navHidden}=useStore()
 const unread=clients.reduce((n,c)=>n+(messages[c.id]||[]).filter(m=>m.from==='client'&&!m.readByCoach).length,0)
 if(navHidden)return null
 return <nav className="coach-bottom-nav" aria-label="Coach navigation">{nav.map(([id,label,Icon])=>{const active=activePage===id||(id==='library'&&activePage==='foods')||(id==='more'&&!['dashboard','insights','clients','chat','library','foods'].includes(activePage));return <button key={id} aria-current={active?'page':undefined} onClick={()=>setActivePage(id)}><span><Icon size={21}/>{id==='chat'&&unread>0&&<b aria-label={`${unread} unread messages`}>{unread>99?'99+':unread}</b>}</span><strong>{label}</strong></button>})}</nav>
}
