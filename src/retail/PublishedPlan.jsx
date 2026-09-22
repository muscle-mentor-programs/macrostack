import ResourceEditor from './ResourceEditor';
import {resourceStore} from './resourcesApi';
import {useState} from 'react';
import {Download, Utensils} from 'lucide-react';
import {removeMealPlan} from './api';
import {Alert, Button, Modal, useAction} from './ui';
const order=['Breakfast','Lunch','Dinner','Snack'];
const amount = value => Math.round(Number(value)||0);
function totals(items){return items.reduce((a,item)=>{for(const key of Object.keys(a))a[key]+=Number(item[key])||0;return a;},{calories:0,protein:0,carbs:0,fat:0});}
function portion(food){
 const quantity=Number(food.quantity)||1;
 if(['g','oz','ml','lb','fl oz','L'].includes(food.servingUnit)&&food.servingSize)return `${Math.round(quantity*Number(food.servingSize)*100)/100} ${food.servingUnit}`;
 return `${quantity} × ${food.servingUnit || 'serving'}`;
}
export default function PublishedPlan({plan,relationship,staff=false,manager=false,onRemoved}){
 const days=Array.isArray(plan.days)?plan.days:[];
 const [selected,setSelected]=useState(0);
 const [confirm,setConfirm]=useState(false);
 const [savingTemplate,setSavingTemplate]=useState(null);
 const [templateSaved,setTemplateSaved]=useState(false);
 const day=days[Math.min(selected,Math.max(0,days.length-1))];
 const meals=order.map(name=>[name,Array.isArray(day?.meals?.[name])?day.meals[name]:[]]).filter(([,items])=>items.length);
 const summary=totals(meals.flatMap(([,items])=>items));
 const {busy,error,run}=useAction();
 return <article className="retail-published-plan">
   <header className="retail-plan-heading"><div><span className="retail-plan-status">{plan.active?'Active meal plan':'Previous meal plan'}</span><h3>{plan.plan_name || 'Nutrition plan'}</h3><p>{days.length} {days.length===1?'day':'days'} · Personalized nutrition</p></div><Button disabled={busy} onClick={()=>run(async()=>{const {loadPlanBranding,generateRetailPlanPDF}=await import('./planPDF');const brand=await loadPlanBranding(relationship.location_id);const doc=generateRetailPlanPDF({planName:plan.plan_name,days},{name:relationship.name},brand);doc.save(`${(plan.plan_name||'nutrition-plan').replace(/[^a-z0-9]+/gi,'-').toLowerCase()}.pdf`);})}><Download size={16} aria-hidden="true"/>{busy?'Preparing…':'Download PDF'}</Button></header>
   <Alert error={error}/>
   {manager&&<div className="retail-plan-remove"><Button disabled={busy} onClick={()=>run(async()=>setSavingTemplate(await resourceStore(relationship.location_id)))}>Save to Resources</Button>{templateSaved&&<p role="status">Meal plan template saved to Resources as a draft.</p>}</div>}
   {savingTemplate&&<ResourceEditor initial={{title:plan.plan_name,description:'',kind:'meal_plan',audience:'customer',status:'draft',allow_copy:true,content:{days:structuredClone(days)}}} location={savingTemplate} organizationId={savingTemplate.organization_id} onClose={()=>setSavingTemplate(null)} onSaved={async()=>setTemplateSaved(true)}/>}

   {staff && plan.can_remove && <div className="retail-plan-remove"><Button onClick={()=>setConfirm(true)}>Remove plan</Button></div>}
   {confirm && <Modal title="Remove meal plan" onClose={()=>{if(!busy)setConfirm(false)}}><p>Remove “{plan.plan_name}” from {relationship.name}?{plan.active?' This also clears their active meal plan.':''} Calorie and macro targets will stay unchanged.</p><Alert error={error}/><div className="retail-actions"><Button disabled={busy} onClick={()=>setConfirm(false)}>Keep plan</Button><Button disabled={busy} onClick={()=>run(async()=>{await removeMealPlan(relationship.id,plan.id);setConfirm(false);await onRemoved?.();})}>{busy?'Removing…':'Confirm removal'}</Button></div></Modal>}
   <nav className="retail-plan-days" aria-label={`${plan.plan_name || 'Nutrition plan'} days`}>{days.map((d,i)=><button type="button" key={d.id||i} aria-current={i===selected?'page':undefined} onClick={()=>setSelected(i)}>{d.label||`Day ${i+1}`}</button>)}</nav>
   {day?<><dl className="retail-plan-totals">{[['calories','Calories','kcal'],['protein','Protein','g'],['carbs','Carbs','g'],['fat','Fat','g']].map(([key,label,unit])=><div key={key}><dt>{label}</dt><dd>{amount(summary[key])}<small>{unit}</small></dd></div>)}</dl>
   <div className="retail-plan-meals">{meals.map(([meal,items])=><section className="retail-plan-meal" key={meal}><header><h4><Utensils size={15} aria-hidden="true"/>{meal}</h4><span>{amount(totals(items).calories)} kcal</span></header><ul>{items.map((food,i)=><li key={food.id||i}><div className="retail-plan-food"><strong>{food.name}</strong><span>{portion(food)}{food.brand?` · ${food.brand}`:''}</span></div><div className="retail-plan-food-macros"><strong>{amount(food.calories)} <small>kcal</small></strong><span>{amount(food.protein)}g P · {amount(food.carbs)}g C · {amount(food.fat)}g F</span></div></li>)}</ul></section>)}</div>{!meals.length&&<p className="retail-muted">No meals in this day yet.</p>}</>:<p className="retail-muted">No days in this plan yet.</p>}
 </article>;
}
