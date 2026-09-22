import { useEffect, useState } from "react";
import { appRecords, shareAppRecords, appPhotoURL } from "./api";
import { Alert, Button, Empty, Select, useAction } from "./ui";
import { displayDate } from "./model";
const types = [
  ["profile", "Profile & targets"],
  ["foods", "Food history"],
  ["weights", "Weight history"],
  ["photos", "Progress photos"],
  ["plans", "Meal plans"],
  ["checkins", "Check-in history"],
  ["forms", "Form responses"],
  ["schedules", "Scheduled targets"],
];
const labels = {
  goal_calories: "Calories",
  goal_protein: "Protein",
  goal_carbs: "Carbs",
  goal_fat: "Fat",
  dob: "Date of birth",
  bio: "About",
  height: "Height",
  phone: "Phone",
  adherence: "Adherence",
  hunger: "Hunger",
  energy: "Energy",
  weight: "Weight",
  weight_unit: "Unit",
  notes: "Notes",
  calories: "Calories",
  protein: "Protein",
  carbs: "Carbs",
  fat: "Fat",
  apply_on: "Scheduled for",
  applied: "Applied",
};
function Values({ value }) {
  if (value == null || value === "") return <span>—</span>;
  if (typeof value !== "object") return <span>{String(value)}</span>;
  return (
    <dl className="retail-record-values">
      {Object.entries(value)
        .filter(
          ([k]) => !["id", "client_id", "active_meal_plan_id"].includes(k),
        )
        .map(([k, v]) => (
          <div key={k}>
            <dt>{labels[k] || k.replaceAll("_", " ")}</dt>
            <dd>
              <Values value={v} />
            </dd>
          </div>
        ))}
    </dl>
  );
}
function MealDays({ days }) {
  return (Array.isArray(days) ? days : []).map((day, i) => (
    <details key={day.id || i} open={i === 0}>
      <summary>{day.label || `Day ${i + 1}`}</summary>
      {Object.entries(day.meals || {}).map(([meal, items]) => (
        <section key={meal}>
          <h4>{meal}</h4>
          {(Array.isArray(items) ? items : []).map((food, j) => (
            <div className="retail-row" key={food.id || j}>
              <div>
                <strong>{food.name}</strong>
                <p>
                  {["g", "oz", "ml", "lb"].includes(food.servingUnit) &&
                  food.servingSize
                    ? Math.round(
                        Number(food.quantity) * Number(food.servingSize) * 100,
                      ) / 100
                    : food.quantity}{" "}
                  {food.servingUnit || "servings"}
                </p>
              </div>
              <span>
                {Math.round(Number(food.calories) || 0)} kcal ·{" "}
                {Math.round(Number(food.protein) || 0)}g protein ·{" "}
                {Math.round(Number(food.carbs) || 0)}g carbs ·{" "}
                {Math.round(Number(food.fat) || 0)}g fat
              </span>
            </div>
          ))}
        </section>
      ))}
    </details>
  ));
}
export default function AppRecords({ relationship, staff, onRefresh }) {
  const [kind, setKind] = useState("profile"),
    [offset, setOffset] = useState(0),
    [data, setData] = useState(null),
    [loading, setLoading] = useState(true),
    [preview, setPreview] = useState(null),
    [revision, setRevision] = useState(0);
  const { busy, error, run, setError } = useAction();
  function prepareLoad() {
    setLoading(true);
    setData(null);
    setPreview(null);
  }
  useEffect(() => {
    let active = true;
    appRecords(relationship.id, kind, offset)
      .then((result) => {
        if (active) {
          setError("");
          setData(result);
        }
      })
      .catch((error) => {
        if (active) setError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [relationship.id, kind, offset, revision, setError]);
  return (
    <section className="retail-card">
      <div className="retail-header">
        <div>
          <h2>Customer app records</h2>
          <p className="retail-muted">
            Connected to the customer’s MacroStack account. Browse all available
            history.
          </p>
        </div>
        <Button
          onClick={() => {
            prepareLoad();
            setRevision((v) => v + 1);
          }}
        >
          Refresh
        </Button>
      </div>
      {!staff && (
        <div className="retail-sharing-card">
          <h3>Share your app records with this store</h3>
          <p>
            Allow your authorized store team to view your profile, nutrition
            targets, full food and weight history, progress photos, meal plans,
            check-ins, form responses and scheduled targets. Private coach
            conversations and staff notes stay separate. You can turn this off
            at any time.
          </p>
          <Button
            disabled={busy}
            onClick={() =>
              run(async () => {
                await shareAppRecords(
                  relationship.id,
                  !relationship.share_app_records,
                );
                await onRefresh?.();
                prepareLoad();
                setRevision((v) => v + 1);
              })
            }
          >
            {relationship.share_app_records
              ? "Stop sharing app records"
              : "Allow app record sharing"}
          </Button>
        </div>
      )}
      <Select
        label="View records"
        value={kind}
        onChange={(v) => {
          if (v === kind) return;
          prepareLoad();
          setKind(v);
          setOffset(0);
        }}
      >
        {types.map(([k, l]) => (
          <option key={k} value={k}>
            {l}
          </option>
        ))}
      </Select>
      <Alert error={error} />
      {loading ? (
        <Empty>Loading records…</Empty>
      ) : !data ? null : !data.shared ? (
        <Empty>
          The customer needs to enable app record sharing in their store
          workspace → App records.
        </Empty>
      ) : (
        <>
          <div className="retail-app-records">
            {data.rows.map((r, i) => (
              <article className="retail-card" key={r.id || i}>
                <h3>
                  {kind === "foods"
                    ? r.name
                    : kind === "plans"
                      ? r.plan_name
                      : kind === "profile"
                        ? r.name
                        : kind === "forms"
                          ? r.form_title
                          : displayDate(
                              r.date ||
                                r.taken_at ||
                                r.created_at ||
                                r.apply_on,
                            )}
                </h3>
                {kind === "photos" ? (
                  <>
                    <p>{r.note}</p>
                    <Button
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          setPreview(await appPhotoURL(r.path));
                        })
                      }
                    >
                      View photo
                    </Button>
                  </>
                ) : kind === "plans" ? (
                  <>
                    <p>
                      {r.active ? "Active meal plan" : "Previous meal plan"}
                    </p>
                    <MealDays days={r.days} />
                  </>
                ) : (
                  <Values
                    value={Object.fromEntries(
                      Object.entries(r).filter(
                        ([k]) => !["name", "created_at"].includes(k),
                      ),
                    )}
                  />
                )}
              </article>
            ))}
          </div>
          {!data.rows.length && <Empty>No records in this section yet.</Empty>}
          <div className="retail-actions">
            <Button
              disabled={offset === 0}
              onClick={() => {
                prepareLoad();
                setOffset((v) => Math.max(0, v - 50));
              }}
            >
              Previous
            </Button>
            <span>Page {offset / 50 + 1}</span>
            <Button
              disabled={!data.has_more}
              onClick={() => {
                prepareLoad();
                setOffset((v) => v + 50);
              }}
            >
              Next
            </Button>
          </div>
        </>
      )}
      {preview && (
        <div className="retail-photo-preview">
          <Button onClick={() => setPreview(null)}>Close photo</Button>
          <img src={preview} alt="Customer progress" />
        </div>
      )}
    </section>
  );
}
