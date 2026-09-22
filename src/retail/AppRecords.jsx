import PublishedPlan from "./PublishedPlan";
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
function WeightTrend({ rows }) {
  const units = [...new Set(rows.map((r) => r.unit))];
  return units.map((unit) => {
    const points = rows
      .filter((r) => r.unit === unit && Number.isFinite(Number(r.value)))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
    if (points.length < 2) return null;
    const values = points.map((p) => Number(p.value));
    const low = Math.min(...values),
      high = Math.max(...values),
      range = high - low || 1;
    const coords = values
      .map(
        (v, i) =>
          `${12 + (i / (values.length - 1)) * 576},${108 - ((v - low) / range) * 80}`,
      )
      .join(" ");
    return (
      <figure className="retail-weight-trend" key={unit}>
        <figcaption>Weight trend · {unit} · records on this page</figcaption>
        <svg
          viewBox="0 0 600 130"
          role="img"
          aria-label={`Weight from ${values[0]} to ${values.at(-1)} ${unit}`}
        >
          <polyline
            points={coords}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <p>
          {displayDate(points[0].date)} — {displayDate(points.at(-1).date)} ·{" "}
          {values[0]} → {values.at(-1)} {unit}
        </p>
      </figure>
    );
  });
}
function Values({ value }) {
  if (value == null || value === "") return <span>—</span>;
  if (typeof value !== "object") return <span>{String(value)}</span>;
  return (
    <dl className="retail-record-values">
      {Object.entries(value)
        .filter(
          ([k]) => !["id", "client_id", "active_meal_plan_id","goal_calories","goal_protein","goal_carbs","goal_fat"].includes(k),
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
export default function AppRecords({
  relationship,
  staff,
  manager=false,
  onRefresh,
  recordTypes,
  title,
  sharing = false,
}) {
  const [kind, setKind] = useState(recordTypes?.[0] || "profile"),
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
    <section className="retail-section">
      <div className="retail-header">
        <div>
          <h2>{title || "Customer app records"}</h2>
          <p className="retail-muted">Customer app · Shared records</p>
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
      {!staff && sharing && (
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
        {types
          .filter(([k]) => !recordTypes || recordTypes.includes(k))
          .map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
      </Select>
      <Alert error={error} />
      {loading ? (
        <p role="status" className="retail-inline-loading">
          Loading records…
        </p>
      ) : !data ? null : !data.shared ? (
        <Empty>
          The customer needs to enable app record sharing in their store
          workspace → Connection settings.
        </Empty>
      ) : (
        <>
          {kind === "weights" && <WeightTrend rows={data.rows} />}
          <div className="retail-app-records">
            {data.rows.map((r, i) => kind === "plans" ? (
              <PublishedPlan key={r.id || i} plan={r} relationship={relationship} staff={staff} manager={manager} onRemoved={async()=>{prepareLoad();setRevision(v=>v+1);await onRefresh?.();}}/>
            ) : (
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
