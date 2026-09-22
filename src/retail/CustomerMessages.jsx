import {Modal} from './ui';
import {brandStyle} from './brandColors';
import './retail.css';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
const CustomerResources = lazy(() => import('./CustomerResources'));
import { ArrowLeft, ChevronRight, MessageCircle, Store, UserCircle2 } from 'lucide-react';
import useStore from '../store';
import { buildThread, DaySep, Bubble, Composer } from '../components/ChatKit';
import { list, storeBranding, brandLogoURL, conversation, command } from './api';
import './CustomerMessages.css';
function ChatFrame({children}) {
  const setNavHidden=useStore(s=>s.setNavHidden);
  const [bounds,setBounds]=useState({top:0,height:window.innerHeight,paddingTop:100,bottom:80});
  useEffect(()=>{
    const viewport=window.visualViewport;
    const nav=document.getElementById('client-bottom-nav');
    const controls=document.querySelector('.product-controls');
    let navHeight=nav?.offsetHeight||72;
    const sync=()=>{
      const top=viewport?.offsetTop||0,height=viewport?.height||window.innerHeight;
      const keyboard=window.innerHeight-height-top>100;
      if(nav?.offsetHeight)navHeight=nav.offsetHeight;
      setNavHidden?.(keyboard);
      setBounds({top,height,paddingTop:Math.max(16,(controls?.getBoundingClientRect().bottom||76)-top+12),bottom:keyboard?12:navHeight+12});
    };
    const observer=new ResizeObserver(sync);
    if(controls)observer.observe(controls);
    if(nav)observer.observe(nav);
    sync();viewport?.addEventListener('resize',sync);viewport?.addEventListener('scroll',sync);window.addEventListener('resize',sync);
    return()=>{observer.disconnect();viewport?.removeEventListener('resize',sync);viewport?.removeEventListener('scroll',sync);window.removeEventListener('resize',sync);setNavHidden?.(false);};
  },[setNavHidden]);
  return <section className="member-conversations" style={{top:bounds.top,height:bounds.height,'--chat-top':`${bounds.paddingTop}px`,'--chat-bottom':`${bounds.bottom}px`}}>{children}</section>;
}
function StoreConversation({connection,onBack}) {
  const userId=useStore(s=>s.currentUser?.id);
  const [rows,setRows]=useState(null),[error,setError]=useState(''),[requestId,setRequestId]=useState(()=>crypto.randomUUID());
  useEffect(()=>{
    let active=true;
    const refresh=async()=>{try{const data=await conversation(connection.id);if(!active)return;setRows(data.messages||[]);setError('');await command('read',{relationship_id:connection.id});window.dispatchEvent(new Event('retail-messages-read'));}catch(e){if(active)setError(e.message);}};
    refresh();const timer=setInterval(()=>{if(document.visibilityState==='visible')refresh();},10000);window.addEventListener('focus',refresh);
    return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',refresh);};
  },[connection.id]);
  const items=useMemo(()=>buildThread((rows||[]).map(m=>({id:m.id,text:m.body,timestamp:m.created_at,from:m.author_id===userId?'client':'store'})).sort((a,b)=>a.timestamp.localeCompare(b.timestamp))).reverse(),[rows,userId]);
  const [resourceOpen,setResourceOpen]=useState(false);
  const name=connection.brand?.name||'Your store';
  return <ChatFrame>
    <header className="member-chat-heading glass-panel accent-line"><button onClick={onBack} aria-label="All conversations"><ArrowLeft size={20}/></button><div className="member-chat-avatar">{connection.brand?.logo_path?<img alt="" src={brandLogoURL(connection.brand.logo_path)}/>:<Store size={22}/>}</div><div><h1>{name}</h1><p>Your store team · private conversation</p></div><button className="member-chat-resources" onClick={()=>setResourceOpen(true)}>Resources</button></header>
    {resourceOpen&&<div className="retail" style={brandStyle(connection.brand?.brand_colors)}><Modal wide title={`${name} · Resources`} onClose={()=>setResourceOpen(false)}><Suspense fallback={<p role="status">Loading resources…</p>}><CustomerResources relationship={connection} staff={false}/></Suspense></Modal></div>}
    {error&&<p className="member-chat-error" role="alert">{error}</p>}
    <div className="member-chat-thread" role="log" aria-label="Store messages">
      {rows===null&&!error?<p role="status" className="member-chat-empty">Loading messages…</p>:items.length?items.map(item=>item.type==='sep'?<DaySep key={item.id} label={item.label}/>:<Bubble key={item.id} msg={item.msg} isSelf={item.msg.from==='client'} first={item.first} last={item.last} senderLabel={name} maxW="max-w-[80%]"/>):<div className="member-chat-empty"><MessageCircle size={30}/><h2>No messages yet</h2><p>Start a conversation with your store team.</p></div>}
    </div>
    <div className="member-chat-composer glass-panel"><Composer clientId={`retail:${connection.id}`} placeholder={`Message ${name}…`} textSize="text-base" onSendText={async text=>{
      await command('message',{relationship_id:connection.id,id:requestId,body:text});
      setRows(current=>[...(current||[]).filter(m=>m.id!==requestId),{id:requestId,author_id:userId,body:text,created_at:new Date().toISOString()}]);
      setRequestId(crypto.randomUUID());
    }}/></div>
  </ChatFrame>;
}
export default function CustomerMessages({CoachConversation}) {
  const userId=useStore(s=>s.currentUser?.id);
  const client=useStore(s=>s.clients?.find(c=>c.id===s.activeClientId));
  const coachProfile=useStore(s=>s.coachProfile);
  const [connections,setConnections]=useState(null),[selected,setSelected]=useState(null),[error,setError]=useState('');
  useEffect(()=>{
    let active=true;
    if(userId)list('relationships',{profile_id:userId,status:'active'}).then(rows=>Promise.all(rows.map(async r=>({...r,brand:await storeBranding(r.location_id).catch(()=>null)})))).then(rows=>{if(active){setConnections(rows);const url=new URL(window.location.href);const target=rows.find(row=>row.id===url.searchParams.get('store'));if(target){setSelected(target);url.searchParams.delete('store');window.history.replaceState({},'',url);}}}).catch(()=>{if(active)setError('Could not load store conversations. Please refresh to try again.');});
    return()=>{active=false;};
  },[userId]);
  if(selected==='coach')return <CoachConversation onBack={()=>setSelected(null)}/>;
  if(selected)return <StoreConversation key={selected.id} connection={selected} onBack={()=>setSelected(null)}/>;
  return <ChatFrame><header className="member-chat-heading glass-panel accent-line"><div><h1>Messages</h1><p>Your coach and store, in separate conversations.</p></div></header><div className="member-chat-directory">
    {error&&<p role="alert">{error}</p>}
    <button className="member-conversation-row" onClick={()=>setSelected('coach')}><span className="member-chat-avatar"><UserCircle2 size={22}/></span><span><strong>{client?.coachId?coachProfile?.name||'Your coach':'Connect with a coach'}</strong><small>{client?.coachId?'Coach · open conversation':'Link a coach without changing your store connection'}</small></span><ChevronRight size={18}/></button>
    {!connections&&!error&&<p role="status">Loading conversations…</p>}
    {connections?.map(r=><button className="member-conversation-row" key={r.id} onClick={()=>setSelected(r)}><span className="member-chat-avatar">{r.brand?.logo_path?<img src={brandLogoURL(r.brand.logo_path)} alt=""/>:<Store size={22}/>}</span><span><strong>{r.brand?.name||'Your store'}</strong><small>Store team · open conversation</small></span><ChevronRight size={18}/></button>)}
  </div></ChatFrame>;
}
