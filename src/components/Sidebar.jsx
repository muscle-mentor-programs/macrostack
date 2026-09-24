import {useState} from 'react'
import useStore from '../store'
import useIsSuperadmin from '../hooks/useIsSuperadmin'
import BrandWordmark from './BrandWordmark'
import {LayoutDashboard,Users,MessageCircle,BookOpen,ClipboardList,User,PanelLeftClose,PanelLeftOpen,CreditCard} from 'lucide-react'
const settingsPages=new Set(['profile','upgrade','marketplace','feedback'])
export default function Sidebar(){
 const {activePage,setActivePage,currentUser}=useStore();const admin=useIsSuperadmin()
 const [collapsed,setCollapsed]=useState(()=>{try{return localStorage.getItem('macrostack-coach-rail')==='collapsed'||innerWidth<1200}catch{return false}})
 const groups=[['Coaching',[['dashboard','Home',LayoutDashboard],['clients','Clients',Users],['chat','Messages',MessageCircle]]],['Resources',[['library','Library',BookOpen],['forms','Forms & check-ins',ClipboardList]]],['Account',[['more','Settings',User],...(admin?[['coaches','Coaches',Users],['billing','Billing',CreditCard]]:[])]]]
 return <aside className={`coach-sidebar ${collapsed?'is-collapsed':''}`}><header>{!collapsed&&<BrandWordmark/>}<button aria-label={collapsed?'Expand sidebar':'Collapse sidebar'} onClick={()=>setCollapsed(v=>{try{localStorage.setItem('macrostack-coach-rail',v?'expanded':'collapsed')}catch{/* Storage is optional. */}return !v})}>{collapsed?<PanelLeftOpen size={20}/>:<PanelLeftClose size={20}/>}</button></header><nav aria-label="Coach navigation">{groups.map(([title,items])=><section key={title}><h2 className="coach-sidebar-heading">{collapsed?<span className="sr-only">{title}</span>:title}</h2>{items.map(([id,label,Icon])=><button key={id} title={collapsed?label:undefined} aria-label={label} aria-current={activePage===id||(id==='library'&&activePage==='foods')||(id==='more'&&settingsPages.has(activePage))?'page':undefined} onClick={()=>setActivePage(id)}><Icon size={20}/>{!collapsed&&<span>{label}</span>}</button>)}</section>)}</nav><button className="coach-sidebar-account" onClick={()=>setActivePage('more')} aria-label="Open account settings"><User size={20}/>{!collapsed&&<span>{currentUser?.name||'Coach'}</span>}</button></aside>
}
