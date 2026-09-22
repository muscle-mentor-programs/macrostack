import { ChevronDown, Utensils } from "lucide-react";
import { useEffect, useState } from "react";
import { appRecords } from "./api";
import { Alert, Button, Empty } from "./ui";
import { displayDate } from "./model";
import { CurrentNutrition } from "./CustomerDetails";
export default function FoodJournal({ relationship }) {
  const [offset, setOffset] = useState(0),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    appRecords(relationship.id, "foods", offset)
      .then((r) => {
        if (active) {setData(r);setError("");}
      })
      .catch((e) => {
        if (active) {setError(e.message);setData(null);}
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [relationship.id, offset, revision]);
  const days = Object.values(
    (data?.rows || []).reduce((all, f) => {
      const d = (all[f.date] ??= {
        date: f.date,
        foods: [],
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      });
      d.foods.push(f);
      for (const k of ["calories", "protein", "carbs", "fat"])
        d[k] += Number(f[k]) || 0;
      return all;
    }, {}),
  );
  return (
    <section className="retail-section">
      <CurrentNutrition relationship={relationship} compact />
      <div className="retail-row">
        <h2>Food journal</h2>
        <Button onClick={() => {setLoading(true);setRevision((v) => v + 1)}}>Refresh</Button>
      </div>
      <p className="retail-muted">
        Customer app · Totals cover entries on this page; a day may continue on
        another page. Missing logs do not mean zero intake.
      </p>
      <Alert error={error} />
      {loading ? (
        <p role="status">Loading meals…</p>
      ) : data?.shared ? (
        <>
          <div className="retail-journal-days">
          {days.map((d) => {
            const meals=d.foods.reduce((all,food)=>{const key=food.meal||'Other';(all[key]??=[]).push(food);return all;},{});
            const order=['breakfast','lunch','dinner','snack','snacks'];
            const groups=Object.entries(meals).sort(([a],[b])=>{
              const ai=order.indexOf(a.toLowerCase()),bi=order.indexOf(b.toLowerCase());
              return (ai<0?99:ai)-(bi<0?99:bi);
            });
            return <details className="retail-journal-day" key={`${relationship.id}:${offset}:${d.date}`}>
              <summary>
                <div className="retail-journal-date"><span className="retail-plan-status">Daily food log</span><strong>{displayDate(d.date)}</strong><span className="retail-journal-count">{d.foods.length} {d.foods.length===1?'entry':'entries'} · {groups.length} {groups.length===1?'meal':'meals'}</span></div>
                <div className="retail-journal-summary-totals">{[['calories','Calories','kcal'],['protein','Protein','g'],['carbs','Carbs','g'],['fat','Fat','g']].map(([key,label,unit])=><span key={key}><span>{label}</span><strong>{Math.round(d[key])}<small>{unit}</small></strong></span>)}</div>
                <span className="retail-journal-toggle"><span className="retail-journal-show">View log</span><span className="retail-journal-hide">Close log</span><ChevronDown size={18} aria-hidden="true"/></span>
              </summary>
              <div className="retail-journal-content">
                <div className="retail-plan-meals">
                {groups.map(([meal,foods])=><section className="retail-plan-meal" key={meal}>
                  <header><h4><Utensils size={15} aria-hidden="true"/>{meal}</h4><span>{Math.round(foods.reduce((sum,f)=>sum+(Number(f.calories)||0),0))} kcal</span></header>
                  <ul>{foods.map(f=><li key={f.id}><div className="retail-plan-food"><strong>{f.name}</strong><span>{f.quantity ?? ''} {f.serving_unit || 'servings'}</span></div><div className="retail-plan-food-macros"><strong>{Math.round(Number(f.calories)||0)} <small>kcal</small></strong><span>{Math.round(Number(f.protein)||0)}g P · {Math.round(Number(f.carbs)||0)}g C · {Math.round(Number(f.fat)||0)}g F</span></div></li>)}</ul>
                </section>)}
                </div>
                <p className="retail-journal-total-note">Logged totals reflect the entries shown for this day.</p>
              </div>
            </details>;
          })}
          </div>
          {!days.length && <Empty>No food entries.</Empty>}
        </>
       ) : error ? null : (
        <Empty>
          The customer needs to enable activity sharing in Connection settings.
        </Empty>
      )}
      <div className="retail-actions">
        <Button
          disabled={loading || offset === 0}
          onClick={() => {setLoading(true);setOffset((v) => Math.max(0, v - 50))}}
        >
          Previous
        </Button>
        <span>Page {offset / 50 + 1}</span>
        <Button
          disabled={loading || !data?.has_more}
          onClick={() => {setLoading(true);setOffset((v) => v + 50)}}
        >
          Next
        </Button>
      </div>
    </section>
  );
}
