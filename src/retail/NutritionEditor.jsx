import { useEffect, useState } from 'react';
import MealPlanBuilder from '../pages/coach/MealPlanBuilder';
import LoadingSplash from '../components/LoadingSplash';
import {publishNutrition, storeMealPlans, setStoreTargets, retailerFoods} from './api';
import {Alert, Button, Field, Modal, useAction} from './ui';
export default function NutritionEditor({relationship,onClose}) {
  const [loaded,setLoaded]=useState(null);
  const [targets,setTargets]=useState({calories:'',protein:'',carbs:'',fat:''});
  const [requestId]=useState(()=>crypto.randomUUID());
  const [notice,setNotice]=useState('');
  const {busy,error,run,setError}=useAction();
  useEffect(()=>{
    let active=true;
    Promise.all([storeMealPlans(relationship.id),retailerFoods()]).then(([plans,foods])=>{
      if(!active)return;
      const plan=plans?.[0];
      if(plan?.retail_targets)setTargets(plan.retail_targets);
      setLoaded({foods,plan:plan?{...plan,planName:plan.plan_name}:null});
    }).catch(e=>{if(active)setError(e.message);});
    return()=>{active=false;};
  },[relationship.id,setError]);
  function validTargets(){
    for(const [k,v] of Object.entries(targets))if(v===''||!Number.isFinite(Number(v))||Number(v)<(k==='calories'?1:0)||Number(v)>(k==='calories'?20000:2000))throw new Error('Enter valid calories, protein, carbs and fat targets.');
    return Object.fromEntries(Object.entries(targets).map(([k,v])=>[k,Number(v)]));
  }
  if(!loaded)return <Modal wide title="Meal plan & daily targets" onClose={onClose}>{error?<Alert error={error}/>:<LoadingSplash label="Opening nutrition editor…"/>}</Modal>;
  return <MealPlanBuilder client={{id:relationship.id,name:relationship.name,goals:Object.fromEntries(Object.entries(targets).map(([k,v])=>[k,Number(v)]))}} initialPlan={loaded.plan} additionalFoods={loaded.foods} draftScope="retail" maxDays={14} allowEmail={false} saveLabel="PUBLISH PLAN" onClose={onClose} onSave={async plan=>{
    const t=validTargets();
    if(!plan.days.some(d=>Object.values(d.meals).some(foods=>foods.length)))throw new Error('Add at least one food before publishing.');
    if(plan.days.some(d=>Object.values(d.meals).some(foods=>foods.length>40)))throw new Error('Each meal can contain up to 40 foods.');
    await publishNutrition(relationship.id,requestId,plan.planName,plan.days,t);
  }} toolbarContent={<details className="retail retail-builder-targets">
    <summary>Daily calorie & macro targets <span>{targets.calories?`${targets.calories} kcal · ${targets.protein}p · ${targets.carbs}c · ${targets.fat}f`:'Set targets before publishing'}</span></summary>
    <div className="retail-fields">{Object.keys(targets).map(k=><Field key={k} label={k==='calories'?'Calories · kcal':`${k} · g`} type="number" min={k==='calories'?1:0} max={k==='calories'?20000:2000} step="any" value={targets[k]} onChange={v=>setTargets(t=>({...t,[k]:v}))}/>)}</div>
    <Button disabled={busy} onClick={()=>run(async()=>{await setStoreTargets(relationship.id,validTargets());setNotice('Daily targets updated.');})}>Save targets only</Button>
    <p className="retail-muted">Publishing assigns this meal plan and these targets to the customer’s app.</p><Alert error={error}/>{notice&&<p role="status">{notice}</p>}
  </details>}/>;
}
