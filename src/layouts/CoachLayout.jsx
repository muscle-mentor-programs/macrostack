import { useEffect, useRef, useState } from 'react'
import Sidebar from '../components/Sidebar'
import CoachBottomNav from '../components/CoachBottomNav'
import CoachNotifications from '../components/CoachNotifications'
import useStore from '../store'
import useIsMobile from '../hooks/useIsMobile'
const positions=new Map()
export default function CoachLayout({children}) {
 const {activePage,currentUser}=useStore();const mobile=useIsMobile();const root=useRef(null);const [online,setOnline]=useState(navigator.onLine)
 useEffect(()=>{
   const sync=()=>{const viewport=window.visualViewport;document.documentElement.style.setProperty('--coach-height',`${viewport?.height||innerHeight}px`);document.documentElement.classList.toggle('coach-keyboard-open',!!viewport&&innerHeight-viewport.height>150)}
   sync();window.visualViewport?.addEventListener('resize',sync);window.addEventListener('resize',sync)
   const connection=()=>setOnline(navigator.onLine);window.addEventListener('online',connection);window.addEventListener('offline',connection)
   return()=>{window.visualViewport?.removeEventListener('resize',sync);window.removeEventListener('resize',sync);window.removeEventListener('online',connection);window.removeEventListener('offline',connection);document.documentElement.classList.remove('coach-keyboard-open')}
 },[])
 useEffect(()=>{
   const key=`${currentUser?.id}:${activePage}:${mobile}`;const el=root.current
   const frame=requestAnimationFrame(()=>{if(!el)return;const nodes=[el,...el.querySelectorAll('*')].filter(n=>n.scrollHeight>n.clientHeight&&['auto','scroll'].includes(getComputedStyle(n).overflowY));nodes.forEach((n,i)=>{n.scrollTop=positions.get(`${key}:${i}`)||0})})
   const remember=event=>{const nodes=[el,...el.querySelectorAll('*')].filter(n=>n.scrollHeight>n.clientHeight&&['auto','scroll'].includes(getComputedStyle(n).overflowY));const i=nodes.indexOf(event.target);if(i>=0)positions.set(`${key}:${i}`,event.target.scrollTop)}
   el?.addEventListener('scroll',remember,true)
   return()=>{cancelAnimationFrame(frame);el?.removeEventListener('scroll',remember,true)}
 },[activePage,currentUser?.id,mobile])
 return <div className="software-ui software-coach coach-shell" data-coach-page={activePage}>{!mobile&&<Sidebar/>}<div className="coach-canvas"><div className="coach-utility-bar"><span className="coach-eyebrow">COACH PORTAL</span><CoachNotifications compact/></div>{!online&&<p className="coach-offline" role="status">You’re offline. Reconnect before saving changes.</p>}<main ref={root} className="coach-main" data-scroller>{children}</main>{mobile&&<CoachBottomNav/>}</div></div>
}
