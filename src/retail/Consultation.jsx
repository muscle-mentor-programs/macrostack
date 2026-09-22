import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { command } from "./api";
import { steps, initialDraft, planIssues } from "./model";
import { Button, Field, Select, Alert, useAction } from "./ui";
export default function Consultation({
  relationship,
  existing,
  onDone,
  templates = [],
  startingStep,
  previousPlan,
  intake,
  followups = [],
}) {
  const [draftId] = useState(() => existing?.id || crypto.randomUUID());
  const [draft, setDraft] = useState({
      ...initialDraft,
      goal: intake?.goal || relationship.goal || "",
      preferences: intake?.preferences || "",
      barriers: intake?.barriers || "",
      ...previousPlan,
      ...existing?.draft,
      flow_version: 2,
    }),
    [step, setStep] = useState(
      startingStep ??
        (existing?.draft?.flow_version === 2
          ? existing.step
          : [0, 0, 0, 1, 2, 3][existing?.step || 0]),
    ),
    [record, setRecord] = useState(existing || null),
    [status, setStatus] = useState(existing ? "Saved" : "Not saved");
  const { busy, error, run, setError } = useAction();
  const dirty = useRef(false),
    serial = useRef(false),
    current = useRef({ draft, step, record });
  useLayoutEffect(() => {
    current.current = { draft, step, record };
  }, [draft, step, record]);
  const save = useCallback(async () => {
    if (serial.current) return null;
    serial.current = true;
    const snapshot = current.current;
    setStatus("Saving…");
    setError("");
    try {
      const saved = await command("consultation", {
        relationship_id: relationship.id,
        id: snapshot.record?.id || draftId,
        revision: snapshot.record?.revision,
        draft: snapshot.draft,
        step: snapshot.step,
      });
      setRecord(saved);
      current.current.record = saved;
      const unchanged =
        current.current.draft === snapshot.draft &&
        current.current.step === snapshot.step;
      dirty.current = !unchanged;
      setStatus(unchanged ? "Saved" : "Unsaved changes");
      return saved;
    } catch (e) {
      setStatus("Not saved");
      setError(e.message);
      return null;
    } finally {
      serial.current = false;
    }
  }, [relationship.id, draftId, setError]);
  // A debounce saves only actual edits, never replacing a dirty draft after a refresh.
  useEffect(() => {
    if (!dirty.current) return;
    const timer = setTimeout(save, 900);
    return () => clearTimeout(timer);
  }, [draft, step, save]);
  useEffect(() => {
    const before = (e) => {
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const leave = (e) => {
      if (dirty.current) {
        e.preventDefault();
        setError(
          "Save and close this consultation before leaving. Your edits are still here.",
        );
      }
    };
    window.addEventListener("retail-before-leave", leave);
    window.addEventListener("beforeunload", before);
    return () => {
      window.removeEventListener("beforeunload", before);
      window.removeEventListener("retail-before-leave", leave);
    };
  }, [setError]);
  const field = (key) => (value) => {
    dirty.current = true;
    setStatus("Unsaved changes");
    setDraft((d) => ({ ...d, [key]: value }));
  };
  const move = async (n) => {
    if (dirty.current && !(await save())) return;
    dirty.current = true;
    setStep(n);
  };
  const publish = () =>
    run(async () => {
      const issues = planIssues(draft);
      if (issues.length) throw new Error(issues.join(" "));
      const saved = await save();
      if (!saved)
        throw new Error("Save the draft successfully before publishing.");
      await command("publish", {
        relationship_id: relationship.id,
        id: saved.id,
        revision: saved.revision,
      });
      dirty.current = false;
      onDone();
    });
  const finish = async () => {
    if (dirty.current && !(await save())) return;
    onDone();
  };
  return (
    <section>
      <div className="retail-header">
        <div>
          <div className="retail-eyebrow">
            Nutrition consultation · {relationship.name}
          </div>
          <h1>{steps[step]}</h1>
          <span className="retail-status" role="status">
            {status}
          </span>
        </div>
        <Button onClick={finish} disabled={busy}>
          Save & close
        </Button>
      </div>
      <Alert error={error} />
      <div className="retail-tabbar">
        {steps.map((s, i) => (
          <Button
            key={s}
            primary={i === step}
            onClick={() => move(i)}
            disabled={busy}
          >
            {i + 1}. {s}
          </Button>
        ))}
      </div>
      <div className="retail-progress">
        <span style={{ width: `${((step + 1) / 4) * 100}%` }} />
      </div>
      <div className="retail-card">
        {step === 0 && (
          <>
            <h2>
              {relationship.status === "active"
                ? "Customer connected"
                : "Activation pending"}
            </h2>
            <p>
              {relationship.name} · {relationship.email}
            </p>
            <p className="retail-muted">
              You can prepare a draft now. Publishing requires the customer to
              connect their own account and confirm sharing.
            </p>
            {intake && (
              <details>
                <summary>Original customer intake</summary>
                {Object.entries(intake).map(([k, v]) => (
                  <p key={k}>
                    <strong>{k.replaceAll("_", " ")}: </strong>
                    {String(v)}
                  </p>
                ))}
              </details>
            )}

            <Field
              label="Customer goal"
              value={draft.goal}
              onChange={field("goal")}
            />
            <Field
              label="Preferences and restrictions"
              value={draft.preferences}
              onChange={field("preferences")}
              multiline
            />
            <Field
              label="Practical barriers"
              value={draft.barriers}
              onChange={field("barriers")}
              multiline
            />
            <Field
              label="Assessment observations — staff only"
              value={draft.assessment_note || ""}
              onChange={field("assessment_note")}
              multiline
            />
            <Field
              label="Staff-only consultation notes — never published"
              value={draft.private_note}
              onChange={field("private_note")}
              multiline
            />
          </>
        )}
        {step === 1 && (
          <>
            <Select
              label="Start with an approved nutrition template"
              value=""
              onChange={(id) => {
                const t = templates.find((t) => t.id === id);
                if (t) {
                  dirty.current = true;
                  setDraft((d) => ({
                    ...d,
                    guidance: t.content.body || "",
                    template_id: t.id,
                    template_version: t.version,
                  }));
                }
              }}
            >
              <option value="">Choose a template</option>
              {templates
                .filter((t) => t.category === "nutrition" && t.published)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} · v{t.version}
                  </option>
                ))}
            </Select>
            <p className="retail-muted">
              Daily targets are managed in Nutrition. Publishing guidance does
              not change current targets.
            </p>
            <Field
              label="Nutrition guidance — visible to customer"
              value={draft.guidance}
              onChange={field("guidance")}
              multiline
            />
            <Field
              label="Agreed habits — visible to customer"
              value={draft.habits}
              onChange={field("habits")}
              multiline
            />
            <Field
              label="Optional product routine — product, purpose, instructions and follow-up"
              value={draft.products}
              onChange={field("products")}
              multiline
            />
          </>
        )}
        {step === 2 && (
          <>
            <p>
              Choose the dates agreed with the customer. Publishing replaces
              open consultation follow-ups; completed actions remain in history.
              Follow-ups use the store’s timezone.
            </p>
            {followups.length > 0 && (
              <details>
                <summary>Existing open follow-ups ({followups.length})</summary>
                {followups.map((t) => (
                  <p key={t.id}>
                    {t.title} · {t.due_at}
                  </p>
                ))}
              </details>
            )}
            <div className="retail-fields">
              <Field
                label="First check-in"
                type="date"
                value={draft.checkin_date}
                onChange={field("checkin_date")}
              />
              <Field
                label="Return scan"
                type="date"
                value={draft.next_scan}
                onChange={field("next_scan")}
              />
            </div>
            <Field
              label="Product routine follow-up (optional)"
              type="date"
              value={draft.product_followup || ""}
              onChange={field("product_followup")}
            />
            <p className="retail-muted">
              In-app reminders stop when the action is completed, canceled, or
              the store connection is paused.
            </p>
          </>
        )}
        {step === 3 && (
          <>
            <div className="retail-eyebrow">Customer preview</div>
            <h2>{draft.goal || "Add a goal"}</h2>
            <p className="retail-muted">
              Publishes guidance and the follow-up schedule. Current app targets
              and the active meal plan remain unchanged.
            </p>
            <p className="retail-pre">{draft.guidance}</p>
            <h3>Habits</h3>
            <p className="retail-pre">{draft.habits || "None added"}</p>
            <h3>Product routine</h3>
            <p className="retail-pre">{draft.products || "None added"}</p>
            <p>
              Check-in: {draft.checkin_date || "Not set"} · Return scan:{" "}
              {draft.next_scan || "Not set"}
            </p>
            <p className="retail-muted">
              Private notes and assessment observations are excluded from this
              preview and the published plan.
            </p>
            <Button
              primary
              disabled={busy || relationship.status !== "active"}
              onClick={publish}
            >
              {busy ? "Publishing…" : "Publish customer plan"}
            </Button>
          </>
        )}
      </div>
      <div className="retail-actions">
        <Button disabled={step === 0 || busy} onClick={() => move(step - 1)}>
          Back
        </Button>
        {step < 3 && (
          <Button primary disabled={busy} onClick={() => move(step + 1)}>
            Continue
          </Button>
        )}
        <Button onClick={save} disabled={busy}>
          Save draft
        </Button>
      </div>
    </section>
  );
}
