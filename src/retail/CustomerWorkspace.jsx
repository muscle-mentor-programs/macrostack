import History from "./History";
import ContactPreferences from "./ContactPreferences";
import useClock from "./useClock";
import { useEffect, useRef, useState } from "react";
import useStore from "../store";
import { command, customer, intakeForm, conversation } from "./api";
import { displayDate, parseAssessmentCSV } from "./model";
import { Button, Field, Select, Check, Empty, Alert, useAction } from "./ui";
import Consultation from "./Consultation";
import Progress from "./Progress";
const blankAssessment = {
  measured_on: new Date().toLocaleDateString("en-CA"),
  weight: "",
  unit: "lbs",
  body_fat: "",
  muscle_mass: "",
  note: "",
};
export default function CustomerWorkspace({
  relationship,
  staff,
  manager,
  employees = [],
  templates = [],
  initialTab = "Overview",
  onBack,
  onRefresh,
}) {
  const now = useClock();
  const userId = useStore((s) => s.currentUser?.id);
  const composingAt = useRef(0);
  const [data, setData] = useState(null),
    [tab, setTab] = useState(initialTab),
    [consult, setConsult] = useState(false),
    [consultStep, setConsultStep] = useState(undefined),
    [loading, setLoading] = useState(true),
    [questions, setQuestions] = useState([]),
    [intake, setIntake] = useState({});
  const { busy, error, run, setError } = useAction();
  const [note, setNote] = useState(""),
    [message, setMessage] = useState(""),
    [messageId, setMessageId] = useState(() => crypto.randomUUID());
  const [assessment, setAssessment] = useState(blankAssessment),
    [rows, setRows] = useState(null),
    [checkin, setCheckin] = useState({
      progress: "",
      barriers: "",
      question: "",
    }),
    [checkinId, setCheckinId] = useState(() => crypto.randomUUID());
  const [preferences, setPreferences] = useState({
    share_activity: relationship.share_activity,
    service_reminders: relationship.service_reminders,
    marketing_consent: relationship.marketing_consent,
  });
  const [task, setTask] = useState({ title: "", kind: "followup", due_at: "" }),
    [taskNotes, setTaskNotes] = useState({}),
    [taskDates, setTaskDates] = useState({}),
    [assignment, setAssignment] = useState(relationship.assigned_to || ""),
    [relStatus, setRelStatus] = useState(relationship.status);
  const refresh = async () => {
    const result = await customer(relationship.id);
    setData(result);
    setLoading(false);
  };
  useEffect(() => {
    intakeForm(relationship.id)
      .then(setQuestions)
      .catch((e) => setError(e.message));
  }, [relationship.id, setError]);
  useEffect(() => {
    let active = true;
    customer(relationship.id)
      .then((d) => {
        if (active) {
          setData(d);
          setIntake(d.intakes?.[0]?.answers || {});
          setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [relationship.id, setError]);
  useEffect(() => {
    if (tab !== "Messages") return;
    const timer = setInterval(() => {
      conversation(relationship.id)
        .then((partial) =>
          setData((previous) =>
            previous ? { ...previous, ...partial } : previous,
          ),
        )
        .catch(() => {});
    }, 15000);
    return () => clearInterval(timer);
  }, [relationship.id, tab]);
  const mutate = (action, payload, after) =>
    run(async () => {
      await command(action, { relationship_id: relationship.id, ...payload });
      after?.();
      await refresh();
      await onRefresh?.();
    });
  const draft = data?.consultations
    ?.filter((c) => c.status === "draft")
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
  const plans = [...(data?.plans || [])].sort((a, b) =>
    b.published_at.localeCompare(a.published_at),
  );
  const plan = plans[0];
  const tasks = (data?.tasks || [])
    .filter((t) => t.status === "open")
    .sort((a, b) => a.due_at.localeCompare(b.due_at));
  if (consult)
    return (
      <Consultation
        relationship={relationship}
        existing={draft}
        previousPlan={plan?.content}
        startingStep={consultStep}
        templates={templates}
        onDone={() => {
          setConsult(false);
          setConsultStep(undefined);
          setTab("Plan");
          refresh()
            .then(() => onRefresh?.())
            .catch((e) => setError(e.message));
        }}
      />
    );
  const selectTab = (name) => {
    setTab(name);
    if (name === "Messages")
      command("read", { relationship_id: relationship.id }).catch((e) =>
        setError(e.message),
      );
  };
  return (
    <section>
      <div className="retail-header">
        <div>
          <Button onClick={onBack}>
            ← {staff ? "Customers" : "My stores"}
          </Button>
          <h1 style={{ marginTop: 14 }}>
            {staff ? relationship.name : "Your store plan"}
          </h1>
          <p className="retail-muted">
            {relationship.goal || "Your next chapter starts with a plan."}
          </p>
        </div>
        {staff && (
          <Button primary onClick={() => setConsult(true)}>
            {draft ? "Continue consultation" : "Start consultation"}
          </Button>
        )}
      </div>
      <Alert error={error} />
      <div
        className="retail-tabbar"
        role="navigation"
        aria-label="Customer sections"
      >
        {[
          "Overview",
          "Intake",
          "Plan",
          "Food journal",
          "Progress",
          "Check-ins",
          "Messages",
          "History",
          ...(!staff ? ["Preferences"] : []),
        ].map((t) => (
          <Button
            key={t}
            primary={t === tab}
            aria-current={t === tab ? "page" : undefined}
            onClick={() => selectTab(t)}
          >
            {t === "Plan" ? "Nutrition" : t}
          </Button>
        ))}
      </div>
      {loading ? (
        <Empty>Loading customer workspace…</Empty>
      ) : !data ? (
        <Button onClick={() => run(refresh)}>Retry</Button>
      ) : (
        <>
          {tab === "Overview" && staff && (
            <div className="retail-care-actions">
              {[
                [
                  "Plan",
                  "Nutrition plan",
                  "Set calories, macros, habits and product guidance",
                ],
                [
                  "Food journal",
                  "Food journal",
                  "Review shared daily meals and intake",
                ],
                [
                  "Progress",
                  "Progress & assessments",
                  "Review measurements, scans and photos",
                ],
                [
                  "Check-ins",
                  "Check-ins",
                  "Review updates and keep customers on track",
                ],
              ].map(([target, title, description]) => (
                <button
                  className="retail-card"
                  key={target}
                  onClick={() => selectTab(target)}
                >
                  <h2>{title} →</h2>
                  <p className="retail-muted">{description}</p>
                </button>
              ))}
            </div>
          )}
          {tab === "Overview" && (
            <div className="retail-columns">
              <div>
                <section className="retail-card retail-banner">
                  <div className="retail-eyebrow">Next action</div>
                  <h2>
                    {staff
                      ? tasks[0]?.title || "Plan the next follow-up"
                      : plan
                        ? "Follow your plan and keep your team updated"
                        : "Your store is preparing your plan"}
                  </h2>
                  {staff && tasks[0] && (
                    <p>Due {displayDate(tasks[0].due_at)}</p>
                  )}
                  {!staff && (
                    <Button
                      primary
                      onClick={() => selectTab(plan ? "Check-ins" : "Messages")}
                    >
                      {plan ? "Complete check-in" : "Contact your store"}
                    </Button>
                  )}
                </section>
                {staff ? (
                  <section className="retail-card">
                    <h2>Follow-ups</h2>
                    {tasks.length === 0 && <Empty>No open follow-ups.</Empty>}
                    {tasks.map((t) => (
                      <div key={t.id} className="retail-card">
                        <strong>{t.title}</strong>
                        <p className="retail-muted">
                          {displayDate(t.due_at)} · {t.kind}
                        </p>
                        <Field
                          label="Completion or rescheduling note"
                          value={taskNotes[t.id] || ""}
                          onChange={(v) =>
                            setTaskNotes((n) => ({ ...n, [t.id]: v }))
                          }
                        />
                        <div className="retail-actions">
                          <Button
                            disabled={busy}
                            onClick={() =>
                              mutate("task", {
                                id: t.id,
                                revision: t.revision,
                                status: "done",
                                note: taskNotes[t.id],
                              })
                            }
                          >
                            Complete
                          </Button>
                          <Button
                            disabled={busy}
                            onClick={() =>
                              mutate("task", {
                                id: t.id,
                                revision: t.revision,
                                status: "canceled",
                                note: taskNotes[t.id],
                              })
                            }
                          >
                            Cancel
                          </Button>
                          <Field
                            label="New due date (your timezone)"
                            type="datetime-local"
                            value={taskDates[t.id] || ""}
                            onChange={(v) =>
                              setTaskDates((d) => ({ ...d, [t.id]: v }))
                            }
                          />
                          <Button
                            disabled={
                              busy ||
                              !taskDates[t.id] ||
                              !taskNotes[t.id]?.trim()
                            }
                            onClick={() =>
                              mutate("task", {
                                id: t.id,
                                revision: t.revision,
                                status: "open",
                                due_at: new Date(taskDates[t.id]).toISOString(),
                                note: taskNotes[t.id],
                              })
                            }
                          >
                            Reschedule
                          </Button>
                        </div>
                      </div>
                    ))}
                    <h3>Add follow-up</h3>
                    <Field
                      label="Title"
                      value={task.title}
                      onChange={(v) => setTask((t) => ({ ...t, title: v }))}
                    />
                    <div className="retail-fields">
                      <Select
                        label="Reason"
                        value={task.kind}
                        onChange={(v) => setTask((t) => ({ ...t, kind: v }))}
                      >
                        {["followup", "checkin", "scan", "product"].map((k) => (
                          <option key={k}>{k}</option>
                        ))}
                      </Select>
                      <Field
                        label="Due date and time (your device timezone)"
                        type="datetime-local"
                        value={task.due_at}
                        onChange={(v) => setTask((t) => ({ ...t, due_at: v }))}
                      />
                    </div>
                    <Button
                      disabled={busy || !task.title || !task.due_at}
                      onClick={() =>
                        mutate(
                          "task",
                          {
                            ...task,
                            due_at: new Date(task.due_at).toISOString(),
                          },
                          () =>
                            setTask({
                              title: "",
                              kind: "followup",
                              due_at: "",
                            }),
                        )
                      }
                    >
                      Create follow-up
                    </Button>
                  </section>
                ) : (
                  <section className="retail-card">
                    <h2>Updates</h2>
                    {data.notifications.length === 0 ? (
                      <Empty>No updates yet.</Empty>
                    ) : (
                      data.notifications.map((n) => (
                        <div className="retail-row" key={n.id}>
                          <div>
                            <p>{n.body}</p>
                            <small>{displayDate(n.created_at)}</small>
                          </div>
                        </div>
                      ))
                    )}
                  </section>
                )}
              </div>
              <aside>
                {staff && (
                  <section className="retail-card">
                    <div className="retail-eyebrow">Staff only</div>
                    <h2>Private notes</h2>
                    <Field
                      label="Add a note"
                      value={note}
                      onChange={setNote}
                      multiline
                    />
                    <Button
                      disabled={busy || !note.trim()}
                      onClick={() =>
                        mutate("note", { body: note }, () => setNote(""))
                      }
                    >
                      Save private note
                    </Button>
                    {[...data.notes].reverse().map((n) => (
                      <div className="retail-row" key={n.id}>
                        <div>
                          <p className="retail-pre">{n.body}</p>
                          <small>{displayDate(n.created_at)}</small>
                        </div>
                      </div>
                    ))}
                  </section>
                )}
                {manager && (
                  <section className="retail-card">
                    <h2>Store relationship</h2>
                    <Select
                      label="Assigned specialist"
                      value={assignment}
                      onChange={setAssignment}
                    >
                      <option value="">Unassigned</option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.user_id}>
                          {e.name || e.user_id.slice(0, 8)} · {e.role}
                        </option>
                      ))}
                    </Select>
                    <Select
                      label="Status"
                      value={relStatus}
                      onChange={setRelStatus}
                    >
                      {["invited", "active", "paused", "ended"].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </Select>
                    <p className="retail-muted">
                      Pausing or ending cancels open follow-ups and stops
                      sponsorship. Customer records are retained.
                    </p>
                    <Button
                      disabled={busy}
                      onClick={() =>
                        mutate("relationship", {
                          assigned_to: assignment,
                          status: relStatus,
                          revision: relationship.revision,
                        })
                      }
                    >
                      Update relationship
                    </Button>
                  </section>
                )}
              </aside>
            </div>
          )}
          {tab === "Intake" && (
            <section className="retail-card">
              <h2>Customer intake</h2>
              <p className="retail-muted">
                Shared with your authorized store team. Answer only what you are
                comfortable sharing.
              </p>
              {(staff && data.intakes?.[0]?.form_snapshot?.length
                ? data.intakes[0].form_snapshot
                : questions.length
                  ? questions
                  : [
                      { id: "goal", label: "What would you like to achieve?" },
                      {
                        id: "preferences",
                        label: "Food preferences and restrictions",
                      },
                      {
                        id: "barriers",
                        label: "What makes consistency difficult?",
                      },
                    ]
              ).map((q) => (
                <Field
                  key={q.id}
                  label={q.label}
                  value={intake[q.id] || ""}
                  onChange={(v) => setIntake((x) => ({ ...x, [q.id]: v }))}
                  multiline
                  readOnly={staff}
                />
              ))}
              {!staff && (
                <Button
                  primary
                  disabled={busy}
                  onClick={() =>
                    mutate("intake", {
                      answers: intake,
                      form_snapshot: questions,
                    })
                  }
                >
                  Save intake
                </Button>
              )}
            </section>
          )}
          {tab === "Plan" && (
            <section className="retail-card">
              <div className="retail-row">
                <div>
                  <h2>Nutrition plan</h2>
                  <p className="retail-muted">
                    Daily targets, practical meal guidance and agreed habits.
                  </p>
                </div>
                {staff && (
                  <Button
                    primary
                    onClick={() => {
                      setConsultStep(3);
                      setConsult(true);
                    }}
                  >
                    {draft
                      ? "Continue nutrition draft"
                      : plan
                        ? "Update nutrition plan"
                        : "Create nutrition plan"}
                  </Button>
                )}
              </div>
              {!plan ? (
                <Empty>
                  No nutrition plan published yet.{" "}
                  {staff
                    ? "Create a plan above, review it and publish it to your customer."
                    : "Your store team will share your targets and guidance here."}
                </Empty>
              ) : (
                <>
                  <div className="retail-eyebrow">
                    Published {displayDate(plan.published_at)}
                  </div>
                  <h2>{plan.content.goal}</h2>
                  <Button onClick={() => window.print()}>
                    Print / save plan
                  </Button>
                  <div className="retail-nutrition-targets">
                    {["calories", "protein", "carbs", "fat"].map((k) => (
                      <div key={k}>
                        <strong>
                          {plan.content[k] === ""
                            ? "—"
                            : (plan.content[k] ?? "—")}
                        </strong>
                        <small>
                          {k === "calories" ? "kcal / day" : `${k} · g / day`}
                        </small>
                      </div>
                    ))}
                  </div>
                  <h3>Meal & nutrition guidance</h3>
                  <p className="retail-pre">{plan.content.guidance}</p>
                  <h3>Habits</h3>
                  <p className="retail-pre">
                    {plan.content.habits || "None added"}
                  </p>
                  <h3>Product routine</h3>
                  <p className="retail-pre">
                    {plan.content.products || "None added"}
                  </p>
                  <p>
                    Check-in {displayDate(plan.content.checkin_date)} · Return
                    scan {displayDate(plan.content.next_scan)}
                  </p>
                  <details>
                    <summary>
                      Previous plans ({Math.max(0, plans.length - 1)})
                    </summary>
                    {plans.slice(1).map((p) => (
                      <article className="retail-card" key={p.id}>
                        <h3>{displayDate(p.published_at)}</h3>
                        <p>{p.content.goal}</p>
                        <p className="retail-pre">{p.content.guidance}</p>
                      </article>
                    ))}
                  </details>
                </>
              )}
            </section>
          )}
          {tab === "Food journal" && (
            <Progress
              relationship={relationship}
              mode="journal"
              targets={plan?.content}
            />
          )}
          {tab === "Progress" && (
            <>
              {staff && (
                <Button
                  disabled={busy}
                  onClick={() =>
                    mutate("task", {
                      title: "Please share updated progress photos",
                      kind: "followup",
                      due_at: new Date().toISOString(),
                    })
                  }
                >
                  Request progress photos
                </Button>
              )}
              <Progress relationship={relationship} mode="files" />
              <div className="retail-card">
                <h2>Assessment history</h2>
                <p className="retail-muted">
                  Measurements are recorded observations. Compare scans taken
                  under similar conditions.
                </p>
                <div className="retail-table-wrap">
                  <table className="retail-table">
                    <thead>
                      <tr>
                        {[
                          "Date",
                          "Weight",
                          "Body fat",
                          "Muscle mass",
                          "Source",
                        ].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...data.assessments]
                        .sort((a, b) =>
                          b.measured_on.localeCompare(a.measured_on),
                        )
                        .map((a) => (
                          <tr key={a.id}>
                            <td>{displayDate(a.measured_on)}</td>
                            <td>
                              {a.weight} {a.unit}
                            </td>
                            <td>
                              {a.body_fat == null ? "—" : `${a.body_fat}%`}
                            </td>
                            <td>
                              {a.muscle_mass == null
                                ? "—"
                                : `${a.muscle_mass} ${a.unit}`}
                            </td>
                            <td>{a.source}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {!data.assessments.length && (
                  <Empty>No assessments recorded.</Empty>
                )}
              </div>
              {staff && (
                <section className="retail-card">
                  <h2>Record assessment</h2>
                  <div className="retail-fields">
                    <Field
                      label="Date"
                      type="date"
                      value={assessment.measured_on}
                      onChange={(v) =>
                        setAssessment((a) => ({ ...a, measured_on: v }))
                      }
                    />
                    <Select
                      label="Units"
                      value={assessment.unit}
                      onChange={(v) =>
                        setAssessment((a) => ({ ...a, unit: v }))
                      }
                    >
                      <option>lbs</option>
                      <option>kg</option>
                    </Select>
                    {[
                      ["weight", "Weight"],
                      ["body_fat", "Body fat %"],
                      ["muscle_mass", "Muscle mass"],
                    ].map(([k, label]) => (
                      <Field
                        key={k}
                        label={label}
                        type="number"
                        step="0.1"
                        min="0"
                        value={assessment[k]}
                        onChange={(v) =>
                          setAssessment((a) => ({ ...a, [k]: v }))
                        }
                      />
                    ))}
                  </div>
                  <Field
                    label="Customer-visible note"
                    value={assessment.note}
                    onChange={(v) => setAssessment((a) => ({ ...a, note: v }))}
                  />
                  <Button
                    primary
                    disabled={busy || !assessment.weight}
                    onClick={() =>
                      mutate("assessment", assessment, () =>
                        setAssessment(blankAssessment),
                      )
                    }
                  >
                    Save assessment
                  </Button>
                  <hr
                    style={{
                      margin: "24px 0",
                      borderColor: "var(--color-border)",
                    }}
                  />
                  <h3>Import this customer’s scan history</h3>
                  <p className="retail-muted">
                    CSV header: date,weight,unit,body_fat,muscle_mass. ISO
                    dates; kg or lbs. Up to 100 rows. No automatic InBody
                    connection.
                  </p>
                  <input
                    aria-label="Import assessment CSV"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (!f) return;
                      try {
                        if (f.size > 100000)
                          throw new Error("Choose a CSV smaller than 100 KB.");
                        setRows(parseAssessmentCSV(await f.text()));
                      } catch (e) {
                        setError(e.message);
                      }
                    }}
                  />
                  {rows && (
                    <>
                      <div className="retail-table-wrap">
                        <table className="retail-table">
                          <tbody>
                            {rows.map((r) => (
                              <tr key={r.row}>
                                <td>Row {r.row}</td>
                                <td>{r.measured_on}</td>
                                <td>
                                  {r.weight} {r.unit}
                                </td>
                                <td>{r.errors.join(", ") || "Ready"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <Button
                        disabled={
                          busy ||
                          !rows.length ||
                          rows.some((r) => r.errors.length)
                        }
                        onClick={() =>
                          run(async () => {
                            for (const row of rows)
                              await command("assessment", {
                                relationship_id: relationship.id,
                                ...row,
                              });
                            setRows(null);
                            await refresh();
                          })
                        }
                      >
                        Confirm import to {relationship.name}
                      </Button>
                      <p className="retail-muted">
                        Exact duplicate imported rows are skipped. If
                        interrupted, retry the same file safely.
                      </p>
                    </>
                  )}
                </section>
              )}
            </>
          )}
          {tab === "Check-ins" && (
            <section className="retail-card">
              <h2>{staff ? "Customer check-ins" : "Your check-in"}</h2>
              {!staff && (
                <>
                  {[
                    ["progress", "What went well?"],
                    ["barriers", "What was difficult?"],
                    ["question", "What would you like help with?"],
                  ].map(([k, l]) => (
                    <Field
                      key={k}
                      label={l}
                      value={checkin[k]}
                      onChange={(v) => setCheckin((c) => ({ ...c, [k]: v }))}
                      multiline
                    />
                  ))}
                  <Button
                    primary
                    disabled={busy || !Object.values(checkin).some(Boolean)}
                    onClick={() =>
                      mutate(
                        "checkin",
                        { id: checkinId, answers: checkin },
                        () => {
                          setCheckin({
                            progress: "",
                            barriers: "",
                            question: "",
                          });
                          setCheckinId(crypto.randomUUID());
                        },
                      )
                    }
                  >
                    Send check-in
                  </Button>
                </>
              )}
              {[...data.checkins].reverse().map((c) => (
                <article className="retail-card" key={c.id}>
                  <h3>{displayDate(c.created_at)}</h3>
                  {Object.entries(c.answers).map(([k, v]) => (
                    <p key={k}>
                      <strong>{k}: </strong>
                      {String(v)}
                    </p>
                  ))}
                  {staff && !c.reviewed_at && (
                    <Button
                      disabled={busy}
                      onClick={() => mutate("review_checkin", { id: c.id })}
                    >
                      Mark reviewed
                    </Button>
                  )}
                </article>
              ))}
            </section>
          )}
          {tab === "Messages" && (
            <section className="retail-card">
              <h2>Your conversation</h2>
              {data.threads?.[0]?.composing_by &&
                data.threads[0].composing_by !== userId &&
                Date.parse(data.threads[0].composing_until) > now && (
                  <p className="retail-muted">
                    A store employee is working in this conversation.
                  </p>
                )}
              {staff && (
                <div className="retail-actions">
                  <Button
                    disabled={busy}
                    onClick={() =>
                      mutate("thread", {
                        revision: data.threads?.[0]?.revision,
                        assigned_to: assignment,
                        status: "resolved",
                      })
                    }
                  >
                    Resolve conversation
                  </Button>
                  <Button
                    disabled={busy}
                    onClick={() =>
                      mutate("thread", {
                        revision: data.threads?.[0]?.revision,
                        assigned_to: assignment,
                        status: "open",
                      })
                    }
                  >
                    Assign to selected specialist
                  </Button>
                </div>
              )}
              <div style={{ marginTop: 16 }}>
                {[...data.messages]
                  .sort((a, b) => a.created_at.localeCompare(b.created_at))
                  .map((m) => (
                    <div
                      key={m.id}
                      className={`retail-message${m.from_customer !== staff ? " mine" : ""}`}
                    >
                      {m.body}
                      <small>
                        {m.author_name} · {displayDate(m.created_at)}
                      </small>
                    </div>
                  ))}
              </div>
              <Field
                label="Message"
                value={message}
                onChange={(v) => {
                  setMessage(v);
                  if (staff && Date.now() - composingAt.current > 15000) {
                    composingAt.current = Date.now();
                    command("composing", {
                      relationship_id: relationship.id,
                    }).catch(() => {});
                  }
                }}
                multiline
                maxLength={10000}
              />
              <Button
                primary
                disabled={
                  busy || !message.trim() || relationship.status !== "active"
                }
                onClick={() =>
                  mutate("message", { id: messageId, body: message }, () => {
                    setMessage("");
                    setMessageId(crypto.randomUUID());
                  })
                }
              >
                Send message
              </Button>
            </section>
          )}
          {tab === "Preferences" && (
            <ContactPreferences relationship={relationship} />
          )}
          {tab === "History" && (
            <History relationship={relationship} staff={staff} />
          )}
          {tab === "Preferences" && (
            <section className="retail-card">
              <h2>Sharing and communication</h2>
              <p>
                Published plans, check-ins, assessments and store messages are
                shared with your authorized store team. Staff-only notes are not
                part of your customer view.
              </p>
              <Check
                checked={preferences.share_activity}
                onChange={(v) =>
                  setPreferences((p) => ({ ...p, share_activity: v }))
                }
              >
                Allow authorized store staff to read my nutrition and weight
                activity.
              </Check>
              <Check
                checked={preferences.service_reminders}
                onChange={(v) =>
                  setPreferences((p) => ({ ...p, service_reminders: v }))
                }
              >
                Receive in-app service reminders.
              </Check>
              <Check
                checked={preferences.marketing_consent}
                onChange={(v) =>
                  setPreferences((p) => ({ ...p, marketing_consent: v }))
                }
              >
                I would like promotional communication when those channels are
                available.
              </Check>
              <Button
                primary
                disabled={busy}
                onClick={() => mutate("preferences", preferences)}
              >
                Save preferences
              </Button>
              <Button
                disabled={busy || relationship.status === "ended"}
                onClick={() => {
                  if (
                    window.confirm(
                      "End this store connection? Store sponsorship and follow-ups will stop. Your personal account and published records stay available.",
                    )
                  )
                    mutate("disconnect", {});
                }}
              >
                End store connection
              </Button>
            </section>
          )}
        </>
      )}
    </section>
  );
}
