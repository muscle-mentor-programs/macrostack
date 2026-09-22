import {useContext,useEffect,useState} from 'react';
import {retailerFoods} from './api';
import {RetailThemeContext} from './ThemeContext';
import MealPlanBuilder from '../pages/coach/MealPlanBuilder';
import {resourceCommand} from './resourcesApi';
import {Button,Field,Select,Check,Modal,Alert,useAction} from './ui';
import {resourceKinds} from './resourceModel';
import {starterTemplates} from './starterTemplates.mjs';
export default function ResourceEditor({initial,location,organizationId,onClose,onSaved,corporate=false,allowCorporate=false}) {
 const theme=useContext(RetailThemeContext);
 const [draft,setDraft]=useState(()=>initial||{title:'',description:'',kind:'guide',audience:'customer',status:'draft',allow_copy:true,content:{body:'',questions:[]}});
 const [saveId]=useState(()=>draft.id||crypto.randomUUID());
 const [builder,setBuilder]=useState(false);
 const [scope,setScope]=useState(corporate?'corporate':'store');
 const {busy,error,run,setError}=useAction();
 const [foods,setFoods]=useState([]);
 useEffect(()=>{if(!builder)return;let active=true;retailerFoods().then(rows=>{if(active)setFoods(rows)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[builder,setError]);
 const update=(key,value)=>setDraft(d=>({...d,[key]:value}));
 const content=value=>setDraft(d=>({...d,content:{...d.content,...value}}));
 const questions=draft.content.questions||[];
 const question=(index,patch)=>content({questions:questions.map((q,i)=>i===index?{...q,...patch}:q)});
 async function save(e){e.preventDefault();await run(async()=>{await resourceCommand('save',{...draft,id:saveId,content:{...draft.content,...(draft.kind==='form'?{questions:questions.map(q=>({...q,...(q.type==='select'?{options:[...new Set((q.options||[]).map(o=>o.trim()).filter(Boolean))]}:{})}))}:{})},organization_id:organizationId,location_id:draft.id?draft.location_id:scope==='corporate'?null:location.id});await onSaved();onClose();});}
 if(builder)return <MealPlanBuilder createPDF={async(plan,client)=>{const {loadPlanBranding,generateRetailPlanPDF}=await import('./planPDF');return generateRetailPlanPDF(plan,client,await loadPlanBranding(location.id));}} additionalFoods={foods} toolbarContent={<Alert error={error}/>} themeStyle={theme} client={{id:`resource-${draft.id||location.id}`,name:'Reusable meal plan',goals:{}}} initialPlan={{planName:draft.title||'New meal plan',days:draft.content.days}} allowEmail={false} draftScope="retail-resource" maxDays={14} saveLabel="SAVE TEMPLATE CONTENT" onClose={()=>setBuilder(false)} onSave={async plan=>{setDraft(d=>({...d,title:plan.planName,content:{...d.content,days:plan.days}}));}}/>;
 return <Modal wide title={draft.id?'Edit resource':'Create resource'} onClose={onClose}><form className="resource-editor" onSubmit={save}>
 <Alert error={error}/>
 {!draft.id&&<Select label="Start with" value="" onChange={key=>{const t=starterTemplates.find(t=>t.key===key);if(t)setDraft(d=>({...d,title:t.title,kind:t.content.questions?.length?'form':'guide',audience:'staff',content:structuredClone(t.content)}));}}><option value="">Blank resource</option>{starterTemplates.map(t=><option key={t.key} value={t.key}>{t.title}</option>)}</Select>}
 <div className="retail-fields"><Field label="Resource name" value={draft.title} required maxLength={160} onChange={v=>update('title',v)}/><Select label="Type" value={draft.kind} onChange={v=>update('kind',v)}>{Object.entries(resourceKinds).map(([k,v])=><option key={k} value={k}>{v}</option>)}</Select></div>
 {!draft.id&&allowCorporate&&<Select label="Resource scope" value={scope} onChange={setScope}><option value="store">This store</option><option value="corporate">All stores in the company</option></Select>}
 <Field label="Short description" value={draft.description} maxLength={500} onChange={v=>update('description',v)}/>
 <div className="retail-fields"><Select label="Who is this for?" value={draft.audience} onChange={v=>update('audience',v)}><option value="customer">Customers</option><option value="staff">Staff only</option></Select><Select label="Status" value={draft.status} onChange={v=>update('status',v)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select></div>
 <Check checked={draft.allow_copy} onChange={v=>update('allow_copy',v)}>Allow stores to duplicate this resource</Check>
 {draft.kind==='meal_plan'?<div className="resource-editor-meals"><p>{draft.content.days?.length||0} days in this template</p><Button type="button" onClick={()=>setBuilder(true)}>Open food database & meal plan builder</Button></div>:<Field label={draft.kind==='form'?'Instructions (optional)':'Guide content'} multiline value={draft.content.body||''} maxLength={20000} required={draft.kind==='guide'} onChange={body=>content({body})}/>}
 {draft.kind==='form'&&<section><h3>Questions</h3>{questions.map((q,i)=><div className="resource-question" key={q.id}><Field label={`Question ${i+1}`} value={q.label} required maxLength={300} onChange={label=>question(i,{label})}/><div className="retail-fields"><Select label="Response type" value={q.type||'text'} onChange={type=>question(i,{type,options:[]})}><option value="text">Short answer</option><option value="long">Long answer</option><option value="number">Number</option><option value="select">Choose an option</option></Select><Check checked={!!q.required} onChange={required=>question(i,{required})}>Required</Check></div>{q.type==='select'&&<Field label="Options (one per line)" multiline value={(q.options||[]).join('\n')} onChange={v=>question(i,{options:v.split('\n')})}/>}<Button type="button" onClick={()=>content({questions:questions.filter((_,j)=>i!==j)})}>Remove question {i+1}</Button></div>)}<Button type="button" disabled={questions.length>=20} onClick={()=>content({questions:[...questions,{id:crypto.randomUUID(),label:'',type:'text',required:false}]})}>Add question</Button></section>}
 <p className="retail-muted">Assigned copies stay unchanged when you edit this resource.</p><div className="retail-actions"><Button primary type="submit" disabled={busy}>{busy?'Saving…':'Save resource'}</Button><Button type="button" disabled={busy} onClick={onClose}>Cancel</Button></div>
 </form></Modal>;
}
