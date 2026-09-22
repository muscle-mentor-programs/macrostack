import { CurrentNutrition, ConsultationNotes } from "./CustomerDetails";
import FoodJournal from "./FoodJournal";
import CustomerNav from "./CustomerNav";
import {normalizeSection} from "./customerNavigation";
import CustomerAvatar from "./CustomerAvatar";
import NutritionEditor from "./NutritionEditor";
import History from "./History";
import AppRecords from "./AppRecords";
import ContactPreferences from "./ContactPreferences";
import useClock from "./useClock";
import { useEffect, useRef, useState } from "react";
import useStore from "../store";
import { command, customer, intakeForm, conversation, deleteCustomer } from "./api";
import { displayDate, parseAssessmentCSV } from "./model";
import { Button, Field, Select, Empty, Alert, Modal, useAction } from "./ui";
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
  const [avatarPath, setAvatarPath] = useState(relationship.avatar_path);
  const [deleteOpen,setDeleteOpen]=useState(false);
  const [deleteName,setDeleteName]=useState("");
  const [nutritionEditor, setNutritionEditor] = useState(false);
  const [nutritionRevision,setNutritionRevision]=useState(0);
  const userId = useStore((s) => s.currentUser?.id);
  const composingAt = useRef(0);
  const [data, setData] = useState(null),
    [tab, setTab] = useState(normalizeSection(initialTab)),
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
  const [task, setTask] = useState({ title: "", kind: "followup", due_at: "" }),
    [taskNotes, setTaskNotes] = useState({}),
    [taskDates, setTaskDates] = useState({}),
    [assignment, setAssignment] = useState(relationship.assigned_to || ""),
    [threadOwner, setThreadOwner] = useState(null),
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
      if (action === "task" && payload.id) {
        setTaskNotes((n) => ({ ...n, [payload.id]: "" }));
        setTaskDates((n) => ({ ...n, [payload.id]: "" }));
      }
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
  const pendingProfileEdits = Boolean(
    note.trim() ||
    message.trim() ||
    task.title.trim() || task.due_at ||
    Object.values(checkin).some(Boolean) ||
    [assessment.weight,assessment.body_fat,assessment.muscle_mass,assessment.note].some(Boolean) ||
    (!staff && data && JSON.stringify(intake)!==JSON.stringify(data.intakes?.[0]?.answers || {})) ||
    Object.values(taskNotes).some(Boolean) ||
    Object.values(taskDates).some(Boolean),
  );
  useEffect(() => {
    const protect = (e) => {
      if (pendingProfileEdits) {
        e.preventDefault();
        setError(
          "Save or clear your unfinished profile edits before leaving this customer.",
        );
        if (e.type === "beforeunload") e.returnValue = "";
      }
    };
    window.addEventListener("retail-before-leave", protect);
    window.addEventListener("beforeunload", protect);
    return () => {
      window.removeEventListener("retail-before-leave", protect);
      window.removeEventListener("beforeunload", protect);
    };
  }, [pendingProfileEdits, setError]);
  const leaveProfile = () => {
    if (pendingProfileEdits) {
      setError(
        "Save or clear your unfinished profile edits before leaving this customer.",
      );
      return;
    }
    if(!window.dispatchEvent(new Event("retail-section-leave",{cancelable:true})))return;
    onBack();
  };
  if (consult)
    return (
      <Consultation
        relationship={relationship}
        existing={draft}
        previousPlan={plan?.content}
        intake={data?.intakes?.[0]?.answers}
        followups={tasks}
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
    if(!window.dispatchEvent(new Event("retail-section-leave",{cancelable:true})))return;
    setTab(name);
    if (name === "Messages")
      command("read", { relationship_id: relationship.id }).catch((e) =>
        setError(e.message),
      );
  };
  return (
    <section>
      <div className="retail-header retail-page-header retail-customer-header glass-panel accent-line anim-fade-in-down">
        <div>
          <Button onClick={leaveProfile}>
            ← {staff ? "Customers" : "My stores"}
          </Button>
          <CustomerAvatar
            customer={{ ...relationship, avatar_path: avatarPath }}
            editable={staff}
            onSaved={async (path) => {
              setAvatarPath(path);
              await onRefresh?.();
            }}
          />
          <h1>{staff ? relationship.name : "Your store plan"}</h1>
          <p className="retail-muted">
            {relationship.status} ·{" "}
            {employees.find((e) => e.user_id === relationship.assigned_to)
              ?.name || "No specialist assigned"}
          </p>
        </div>
        {staff && (
          <Button primary onClick={() => setConsult(true)}>
            {draft ? "Continue consultation" : "Start consultation"}
          </Button>
        )}
      </div>
      <Alert error={error} />
      <CustomerNav tab={tab} onChange={selectTab} staff={staff} />
      {loading ? (
        <p role="status" className="retail-inline-loading">
          Loading customer workspace…
        </p>
      ) : !data ? (
        <Button onClick={() => run(refresh)}>Retry</Button>
      ) : (
        <>
          {tab === "Overview" && (
            <div className="retail-columns">
              <div>
                <section className="retail-section">
                  <h2>Customer focus</h2>
                  <p>
                    {relationship.goal ||
                      "Add a goal during your first consultation."}
                  </p>
                  <CurrentNutrition
                    relationship={relationship}
                    compact
                    staff={staff}
                  />
                </section>
                {staff ? (
                  <section className="retail-section">
                    <h2>Follow-ups</h2>
                    {tasks.length === 0 && <Empty>No open follow-ups.</Empty>}
                    {tasks.map((t, index) => (
                      <div
                        key={t.id}
                        className={`retail-followup${index === 0 ? " next" : ""}`}
                      >
                        {index === 0 && (
                          <span className="retail-eyebrow">Next follow-up</span>
                        )}
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
                  <section className="retail-section">
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
                <section className="retail-section">
                  <h2>Recent updates</h2>
                  {[
                    ...(data.checkins || []).map((r) => ({
                      ...r,
                      label: "Check-in received",
                      target: "Check-ins",
                    })),
                    ...(data.files || []).map((r) => ({
                      ...r,
                      label: "File shared",
                      target: "Progress",
                    })),
                    ...(data.plans || []).map((r) => ({
                      ...r,
                      created_at: r.published_at,
                      label: "Guidance published",
                      target: "Plan",
                    })),
                  ]
                    .sort((a, b) =>
                      String(b.created_at).localeCompare(String(a.created_at)),
                    )
                    .slice(0, 5)
                    .map((r) => (
                      <div className="retail-row" key={`${r.target}:${r.id}`}>
                        <div>
                          <strong>{r.label}</strong>
                          <p>{displayDate(r.created_at)}</p>
                        </div>
                        <Button onClick={() => selectTab(r.target)}>
                          View
                        </Button>
                      </div>
                    ))}
                  {!data.checkins?.length &&
                    !data.files?.length &&
                    !data.plans?.length && <Empty>No recent updates.</Empty>}
                </section>
              </aside>
            </div>
          )}
          {tab === "Private notes" && staff && (
            <div>
              {" "}
              {staff && (
                <section className="retail-section">
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
                  <ConsultationNotes
                    consultations={data.consultations || []}
                    notes={data.notes || []}
                  />
                </section>
              )}
            </div>
          )}
          {tab === "Preferences" && (
            <div>
              {" "}
              {manager && (
                <section className="retail-section">
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
                  <div className="retail-delete-customer"><h3>Remove customer</h3><p>Remove this customer from this store and end their connection. Their personal account and other connections stay active. Store history is retained.</p><Button onClick={()=>{setDeleteName("");setDeleteOpen(true)}}>Delete customer</Button></div>
                  {deleteOpen&&<Modal title="Delete customer" onClose={()=>{if(!busy)setDeleteOpen(false)}}><p>Remove {relationship.name} from this store? Open follow-ups and store access will end. Their personal MacroStack account is not deleted. Historical store records are retained.</p><Field label="Type customer name to confirm" value={deleteName} onChange={setDeleteName}/><Alert error={error}/><div className="retail-actions"><Button disabled={busy} onClick={()=>setDeleteOpen(false)}>Keep customer</Button><Button disabled={busy||deleteName.trim()!==relationship.name.trim()} onClick={()=>run(async()=>{await deleteCustomer(relationship.id,relationship.revision);setDeleteOpen(false);onBack();await onRefresh?.();})}>Confirm deletion</Button></div></Modal>}

                </section>
              )}
              <AppRecords
                key="sharing"
                relationship={relationship}
                staff={staff}
                onRefresh={onRefresh}
                recordTypes={["profile"]}
                title="App profile"
              />
            </div>
          )}
          {tab === "Intake" && (
            <section className="retail-section">
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
            <section className="retail-section">
              <CurrentNutrition key={`targets:${nutritionRevision}`} relationship={relationship} staff={staff} />
              <div className="retail-nutrition-builder-entry">
                <div>
                  <h2>Food database & meal plan builder</h2>
                  <p>
                    Search foods, set portions and build meals with calculated
                    macros. Publish the plan and daily targets directly to this
                    customer's app.
                  </p>
                </div>
                {staff && (
                  <Button
                    primary
                    disabled={relationship.status !== "active"}
                    onClick={() => setNutritionEditor(true)}
                  >
                    Build nutrition plan
                  </Button>
                )}
                {staff && relationship.status !== "active" && (
                  <p className="retail-muted">
                    The customer must accept their store invitation before you
                    can assign an app meal plan.
                  </p>
                )}
              </div>
              <AppRecords
                key={`plans:${nutritionRevision}`}
                relationship={relationship}
                staff={staff}
                recordTypes={["plans", "schedules"]}
                title="App meal plans & scheduled targets"
              />
              {nutritionEditor && (
                <NutritionEditor
                  relationship={relationship}
                  onClose={() => {setNutritionEditor(false);setNutritionRevision(v=>v+1)}}
                />
              )}
              <div className="retail-row">
                <div>
                  <h2>Consultation guidance</h2>
                  <p className="retail-muted">
                    Daily targets, practical meal guidance and agreed habits.
                  </p>
                </div>
                {staff && (
                  <Button
                    primary
                    onClick={() => {
                      setConsultStep(1);
                      setConsult(true);
                    }}
                  >
                    {draft
                      ? "Continue guidance draft"
                      : plan
                        ? "Update guidance"
                        : "Add consultation guidance"}
                  </Button>
                )}
              </div>
              {!plan ? (
                <Empty>
                  No consultation guidance published yet.{" "}
                  {staff
                    ? "Add goals, habits and practical guidance to accompany their meal plan."
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
                  <p className="retail-muted">
                    Targets recorded when this guidance was published. Current
                    app targets are shown above.
                  </p>
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
            <FoodJournal relationship={relationship} />
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
              <AppRecords
                key="progress"
                relationship={relationship}
                staff={staff}
                recordTypes={["weights", "photos"]}
                title="App weight & progress photos"
              />
              <Progress relationship={relationship} mode="files" />
              <div className="retail-section">
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
                <section className="retail-section">
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
                    dates; kg or lbs. Up to 100 rows.
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
            <section className="retail-section">
              <h2>{staff ? "Store check-ins" : "Your check-in"}</h2>
              <AppRecords
                key="checkins"
                relationship={relationship}
                staff={staff}
                recordTypes={["checkins", "forms"]}
                title="App check-ins & form responses"
              />
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
            <section className="retail-section">
              <h2>{staff ? "Customer chat" : "Chat with your store"}</h2>
              <p className="retail-muted">
                A direct conversation between this customer and their authorized
                store team.
              </p>
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
                        assigned_to:
                          data.threads?.[0]?.assigned_to || assignment,
                        status: "resolved",
                      })
                    }
                  >
                    Resolve conversation
                  </Button>
                  <Select
                    label="Conversation owner"
                    value={
                      threadOwner ??
                      data.threads?.[0]?.assigned_to ??
                      assignment
                    }
                    onChange={setThreadOwner}
                  >
                    <option value="">Customer’s assigned specialist</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.user_id}>
                        {e.name || e.role}
                      </option>
                    ))}
                  </Select>
                  <Button
                    disabled={busy}
                    onClick={() =>
                      mutate("thread", {
                        revision: data.threads?.[0]?.revision,
                        assigned_to: threadOwner === "" ? assignment : (threadOwner ?? data.threads?.[0]?.assigned_to ?? assignment),
                        status: "open",
                      })
                    }
                  >
                    Save conversation owner
                  </Button>
                </div>
              )}
              <div
                className="retail-chat-log"
                role="log"
                aria-label="Store conversation"
                aria-live="polite"
              >
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
          {tab === "Preferences" && !staff && (
            <ContactPreferences
              relationship={relationship}
              onRefresh={onRefresh}
            />
          )}

          {tab === "History" && (
            <History relationship={relationship} staff={staff} />
          )}
          {tab === "Preferences" && !staff && (
            <section className="retail-section">
              <h2>Store connection</h2>
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
