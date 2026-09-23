import {useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';
import {resources,resourceCommand} from './resourcesApi';
import ResourceContent from './ResourceContent';
import {Button,Modal,Alert,useAction} from './ui';
export default function RequiredResources({locationId,userId,roles=[]}) {
 const [items,setItems]=useState([]),[opened,setOpened]=useState(null),[version,setVersion]=useState(0);
 const {busy,error,run,setError}=useAction();
 const roleKey=[...roles].sort().join(',');
 useEffect(()=>{let active=true;Promise.all([resources(locationId),supabase.from('retail_resource_acknowledgments').select('resource_id,version').eq('user_id',userId)]).then(([rows,ack])=>{if(ack.error)throw ack.error;if(active)setItems(rows.filter(r=>r.status==='published'&&r.audience==='staff'&&r.staff_required&&(!r.required_roles?.length||r.required_roles.some(role=>roleKey.split(',').includes(role)))&&!ack.data.some(a=>a.resource_id===r.id&&a.version===r.version)))}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[locationId,userId,roleKey,version,setError]);
 if(!items.length&&!error)return null;
 return <section className="retail-section required-resources"><div><span className="retail-eyebrow">YOUR COMPANY TOOLKIT</span><h2>Required reading</h2><p>Review your company’s latest guidance before serving customers.</p></div><Alert error={error}/>{items.map(r=><div className="retail-row" key={r.id}><div><strong>{r.title}</strong><p>{r.description}</p></div><Button onClick={()=>setOpened(r)}>Review</Button></div>)}{opened&&<Modal wide title={opened.title} onClose={()=>setOpened(null)}><ResourceContent resource={opened}/><Alert error={error}/><div className="retail-actions"><Button primary disabled={busy} onClick={()=>run(async()=>{await resourceCommand('acknowledge',{id:opened.id,version:opened.version});setVersion(v=>v+1);setOpened(null);})}>I have read and understood this material</Button></div></Modal>}</section>;
}
