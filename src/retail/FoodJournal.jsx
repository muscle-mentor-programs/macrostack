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
          {days.map((d) => (
            <details className="retail-journal-day" key={d.date}>
              <summary>
                {displayDate(d.date)} · {Math.round(d.calories)} kcal ·{" "}
                {Math.round(d.protein)}p · {Math.round(d.carbs)}c ·{" "}
                {Math.round(d.fat)}f
              </summary>
              {d.foods.map((f) => (
                <div className="retail-row" key={f.id}>
                  <div>
                    <strong>{f.name}</strong>
                    <p>
                      {f.meal} · {f.quantity} {f.serving_unit}
                    </p>
                  </div>
                  <span>{Math.round(f.calories)} kcal</span>
                </div>
              ))}
            </details>
          ))}
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
