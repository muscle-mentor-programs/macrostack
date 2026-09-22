import {withCalculatedCalories} from "./nutritionTargets";
import useDraftProtection from "./useDraftProtection";
import { useEffect, useState } from "react";
import { nutritionState, setStoreTargets } from "./api";
import { Alert, Button, Field, Modal, useAction } from "./ui";
import { displayDate } from "./model";
export function CurrentNutrition({ relationship, compact = false, staff }) {
  const [state, setState] = useState(null),
    [error, setError] = useState(""),
    [editing, setEditing] = useState(false),
    [values, setValues] = useState({}),
    [notice, setNotice] = useState("");
  const action = useAction();
  const computedValues=withCalculatedCalories(values);
  const dirty=editing&&Object.keys(values).some(k=>String(values[k]??"")!==String(state?.targets?.[k]??""));
  useDraftProtection(dirty,action.setError);
  useEffect(() => {
    let live = true;
    nutritionState(relationship.id)
      .then((r) => {
        if (live) setState(r);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [relationship.id]);
  return (
    <section className="retail-current-targets">
      <h2>{compact ? "Current nutrition" : "Current daily targets"}</h2>
      <Alert error={error} />
      {staff && !compact && state && (
        <Button
          onClick={() => {
            setValues(state.targets);
            setEditing(true);
          }}
        >
          Edit targets
        </Button>
      )}
      {notice && <p role="status">{notice}</p>}
      {editing && (
        <Modal title="Daily targets" onClose={() => {if(!dirty||window.confirm("Discard your unsaved target changes?"))setEditing(false)}}>
          <p>
            Updates the customer’s current app targets. Meal plans and
            historical guidance are retained.
          </p>
          <div className="retail-fields">
            {["calories", "protein", "carbs", "fat"].map((k) => (
              <Field
                key={k}
                type="number"
                label={k === "calories" ? "Calories / day" : `${k} · g`}
                value={computedValues[k] ?? ""}
                readOnly={k === "calories"}
                aria-readonly={k === "calories" || undefined}
                className={k === "calories" ? "retail-calculated-calories" : undefined}
                min={0}
                step="any"
                onChange={(v) => setValues((t) => ({ ...t, [k]: v }))}
              />
            ))}
          </div>
          <Alert error={action.error} />
          <Button
            primary
            disabled={action.busy}
            onClick={() =>
              action.run(async () => {
                await setStoreTargets(relationship.id, {
                  ...computedValues,
                  _client_id: state.client_id,
                  _version: state.version,
                });
                setState(await nutritionState(relationship.id));
                setEditing(false);
                setNotice("Current targets updated.");
              })
            }
          >
            Save targets
          </Button>
          {action.error && (
            <Button
              onClick={() =>
                action.run(async () => {
                  const next = await nutritionState(relationship.id);
                  setState(next);
                  setValues(next.targets);
                })
              }
            >
              Reload current targets
            </Button>
          )}
        </Modal>
      )}
      {state ? (
        <>
          <div className="retail-nutrition-targets">
            {["calories", "protein", "carbs", "fat"].map((k) => (
              <div key={k}>
                <strong>{state.targets?.[k] ?? "—"}</strong>
                <small>{k === "calories" ? "kcal / day" : `${k} · g`}</small>
              </div>
            ))}
          </div>
          <p className="retail-muted">
            {state.active_plan_name
              ? `Active plan: ${state.active_plan_name}`
              : "No active app meal plan"}
          </p>
        </>
      ) : (
        !error && <p role="status">Loading current targets…</p>
      )}
    </section>
  );
}
export function ConsultationNotes({ consultations, notes = [] }) {
  const entries = [
    ...notes.map((n) => ({
      ...n,
      source: "Private note",
      body: n.body,
      date: n.created_at,
    })),
    ...consultations
      .filter((c) => c.draft?.private_note || c.draft?.assessment_note)
      .map((c) => ({
        ...c,
        source: "Consultation",
        body: [c.draft.private_note, c.draft.assessment_note]
          .filter(Boolean)
          .join("\n\n"),
        date: c.updated_at,
      })),
  ].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return (
    <div>
      {entries.map((c) => (
        <details key={`${c.source}:${c.id}`} className="retail-note-entry">
          <summary>
            {c.source} · {displayDate(c.date)}
          </summary>
          <p className="retail-pre">{c.body}</p>
          {c.draft && (
            <p className="retail-muted">
              {c.status} consultation · Goal: {c.draft.goal}
            </p>
          )}
        </details>
      ))}
      {!entries.length && <p className="retail-muted">No private notes yet.</p>}
    </div>
  );
}
