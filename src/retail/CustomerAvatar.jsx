import { useEffect, useId, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { customerAvatarURL, saveCustomerAvatar } from './api';
import { Alert, useAction } from './ui';
export default function CustomerAvatar({ customer, editable = false, onSaved }) {
  const [result, setResult] = useState(null);
  const [broken, setBroken] = useState(null);
  const [openFor, setOpenFor] = useState(null);
  const open = openFor === customer.id;
  const container = useRef(null), trigger = useRef(null), input = useRef(null);
  const menuId = useId();
  const {busy,error,run}=useAction();
  useEffect(()=>{
    let active=true;
    if (!customer.avatar_path) return;
    const refresh=()=>customerAvatarURL(customer.avatar_path).then(url=>{if(active)setResult({path:customer.avatar_path,url});}).catch(()=>{});
    refresh();
    const timer=setInterval(refresh,50*60*1000);
    return()=>{active=false;clearInterval(timer);};
  },[customer.avatar_path]);
  useEffect(()=>{
    if(!open)return;
    const outside=event=>{if(!container.current?.contains(event.target))setOpenFor(null);};
    const escape=event=>{if(event.key==='Escape'){setOpenFor(null);trigger.current?.focus();}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
  },[open]);
  const url=result?.path===customer.avatar_path && broken!==result?.url ? result?.url : null;
  const picture=<span className="retail-customer-avatar" aria-hidden="true">{url?<img src={url} alt="" onError={()=>setBroken(url)}/>:customer.name?.trim().slice(0,1).toUpperCase()}</span>;
  if(!editable)return picture;
  return <div className="retail-avatar-editor" ref={container}>
    <button ref={trigger} type="button" className="retail-avatar-trigger" aria-label={busy?'Saving customer photo':'Edit customer photo'} aria-expanded={open} aria-controls={menuId} disabled={busy} onClick={()=>setOpenFor(open?null:customer.id)}>
      {picture}<span className="retail-avatar-badge" aria-hidden="true">{busy?<Loader2 size={13} className="animate-spin"/>:<Camera size={13}/>}</span>
    </button>
    <input ref={input} hidden aria-label="Customer profile photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file){setOpenFor(null);run(async()=>{const path=await saveCustomerAvatar(customer.id,file);await onSaved?.(path);});}}}/>
    {open&&<div className="retail-avatar-menu" id={menuId} role="group" aria-label="Photo actions">
      <button type="button" onClick={()=>{setOpenFor(null);input.current?.click();}}>{customer.avatar_path?'Change photo':'Add photo'}</button>
      {customer.avatar_path&&<button type="button" className="retail-avatar-remove" onClick={()=>{setOpenFor(null);trigger.current?.focus();run(async()=>{await saveCustomerAvatar(customer.id,null);await onSaved?.(null);});}}>Remove photo</button>}
    </div>}
    <Alert error={error}/>
  </div>;
}
