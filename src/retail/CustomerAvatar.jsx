import { useEffect, useState } from 'react';
import { customerAvatarURL, saveCustomerAvatar } from './api';
import { Alert, Button, useAction } from './ui';
export default function CustomerAvatar({ customer, editable = false, onSaved }) {
  const [result, setResult] = useState(null);
  const [broken, setBroken] = useState(null);
  const {busy,error,run}=useAction();
  useEffect(()=>{
    let active=true;
    if (!customer.avatar_path) return;
    const refresh=()=>customerAvatarURL(customer.avatar_path).then(url=>{if(active)setResult({path:customer.avatar_path,url});}).catch(()=>{});
    refresh();
    const timer=setInterval(refresh,50*60*1000);
    return()=>{active=false;clearInterval(timer);};
  },[customer.avatar_path]);
  const url=result?.path===customer.avatar_path && broken!==result?.url ? result?.url : null;
  return <div className={editable?'retail-avatar-editor':undefined}>
    <span className="retail-customer-avatar" aria-hidden="true">{url?<img src={url} alt="" onError={()=>setBroken(url)}/>:customer.name?.trim().slice(0,1).toUpperCase()}</span>
    {editable && <><label className="retail-button retail-photo-upload">{busy?'Saving photo…':customer.avatar_path?'Change photo':'Add profile photo'}<input aria-label="Customer profile photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)run(async()=>{const path=await saveCustomerAvatar(customer.id,file);await onSaved(path);});}}/></label>{customer.avatar_path&&<Button disabled={busy} onClick={()=>run(async()=>{await saveCustomerAvatar(customer.id,null);await onSaved(null);})}>Remove photo</Button>}<small>JPG, PNG or WebP · up to 2 MB · private to this store connection</small><Alert error={error}/></>}
  </div>;
}
