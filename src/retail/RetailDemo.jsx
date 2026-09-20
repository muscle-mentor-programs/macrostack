import useViewport from "./useViewport";
import { useState } from "react";
import BrandWordmark from "../components/BrandWordmark";
import { Button, Field, Select } from "./ui";
import "./retail.css";
const customers = [
  {
    name: "Alex Morgan",
    goal: "Build a consistent routine",
    stage: "Check-in due",
    initials: "AM",
    visits: 3,
  },
  {
    name: "Jordan Lee",
    goal: "Prepare for a busy work schedule",
    stage: "Plan ready",
    initials: "JL",
    visits: 2,
  },
  {
    name: "Sam Rivera",
    goal: "Stay consistent while traveling",
    stage: "New customer",
    initials: "SR",
    visits: 1,
  },
];
const stores = [
  { name: "Demo · Northside", customers: 84, consultations: 28, returns: 19 },
  { name: "Demo · Downtown", customers: 62, consultations: 21, returns: 14 },
  { name: "Demo · Westside", customers: 47, consultations: 17, returns: 11 },
];
const steps = ["Listen", "Personalize", "Review"];
export default function RetailDemo() {
  useViewport();
  const [tab, setTab] = useState("Today"),
    [store, setStore] = useState("0"),
    [selected, setSelected] = useState(0),
    [step, setStep] = useState(0),
    [goal, setGoal] = useState(customers[0].goal),
    [plan, setPlan] = useState(
      "Choose one achievable next step together. Review how it went at the next check-in.",
    ),
    [published, setPublished] = useState(false),
    [message, setMessage] = useState(""),
    [messages, setMessages] = useState([]),
    [notice, setNotice] = useState("");
  const customer = customers[selected],
    location = stores[Number(store)];
  const choose = (i) => {
    setSelected(i);
    setGoal(customers[i].goal);
    setPlan(
      "Choose one achievable next step together. Review how it went at the next check-in.",
    );
    setPublished(false);
    setMessages([]);
    setMessage("");
    setStep(0);
    setTab("Consultation");
    setNotice("");
  };
  const reset = () => {
    setTab("Today");
    setStore("0");
    setSelected(0);
    setStep(0);
    setGoal(customers[0].goal);
    setPlan(
      "Choose one achievable next step together. Review how it went at the next check-in.",
    );
    setPublished(false);
    setMessages([]);
    setMessage("");
    setNotice("Demo reset. All example data is back to its starting point.");
  };
  return (
    <div className="retail retail-demo">
      <header className="retail-top">
        <div className="retail-brand">
          <BrandWordmark />
          <small>RETAIL EXPERIENCE · DEMO</small>
        </div>
        <div className="retail-actions">
          <a className="retail-button" href="/retail">
            Open workspace
          </a>
          <Button onClick={reset}>Reset demo</Button>
        </div>
      </header>
      <div className="retail-demo-label">
        Interactive demo · All names, stores and results are fictional. Changes
        stay in this tab; no messages, payments or accounts are created.
      </div>
      <nav className="retail-nav" aria-label="Demo navigation">
        {["Today", "Customers", "Consultation", "Member view", "Results"].map(
          (t) => (
            <button
              key={t}
              aria-current={t === tab ? "page" : undefined}
              onClick={() => {
                setTab(t);
                setNotice("");
              }}
            >
              {t}
            </button>
          ),
        )}
      </nav>
      <main className="retail-main">
        <section className="retail-demo-hero">
          <span className="retail-demo-watermark" aria-hidden="true">
            <BrandWordmark />
          </span>
          <div className="retail-eyebrow">FROM FIRST VISIT TO THE NEXT</div>
          <h1>
            {tab === "Today"
              ? "A clear next step."
              : tab === "Member view"
                ? "Support that comes home."
                : tab === "Results"
                  ? "A view across your stores."
                  : tab === "Consultation"
                    ? "Turn a conversation into a plan."
                    : "Know who needs you next."}
          </h1>
          <p>Explore the store workflow, then switch to the customer’s view.</p>
          <Select label="Example store" value={store} onChange={setStore}>
            {stores.map((s, i) => (
              <option value={String(i)} key={s.name}>
                {s.name}
              </option>
            ))}
          </Select>
        </section>
        {notice && (
          <p className="retail-card" role="status">
            {notice}
          </p>
        )}
        {tab === "Today" && (
          <>
            <div className="retail-stats">
              {[
                [3, "Follow-ups due"],
                [2, "New check-ins"],
                [1, "New conversation"],
              ].map(([n, l]) => (
                <div className="retail-card" key={l}>
                  <strong>{n}</strong>
                  <small>{l}</small>
                </div>
              ))}
            </div>
            <div className="retail-columns">
              <section className="retail-card">
                <div className="retail-eyebrow">YOUR NEXT CONVERSATION</div>
                <h2>{customer.name}</h2>
                <p>{customer.goal}</p>
                <div className="retail-row">
                  <span className="retail-badge">{customer.stage}</span>
                  <span>{customer.visits} example visits</span>
                </div>
                <p>
                  Review context, agree on the next step, and keep the
                  customer’s plan easy to follow.
                </p>
                <Button primary onClick={() => choose(selected)}>
                  Start demo consultation →
                </Button>
              </section>
              <aside className="retail-card">
                <h2>Try the full journey</h2>
                <ol className="retail-training-list">
                  <li>Choose a customer.</li>
                  <li>Personalize and publish a sample plan.</li>
                  <li>Open Member view to see what they receive.</li>
                  <li>Review sample store results.</li>
                </ol>
                <p className="retail-muted">
                  Private staff observations are separate from the
                  customer-facing plan.
                </p>
              </aside>
            </div>
          </>
        )}
        {tab === "Customers" && (
          <div className="retail-grid">
            {customers.map((c, i) => (
              <button
                className="retail-card retail-customer-card"
                key={c.name}
                onClick={() => choose(i)}
              >
                <div className="retail-avatar" aria-hidden="true">
                  {c.initials}
                </div>
                <span className="retail-badge">{c.stage}</span>
                <h2>{c.name}</h2>
                <p>{c.goal}</p>
                <div className="retail-row">
                  <small>Fictional customer</small>
                  <span>Open →</span>
                </div>
              </button>
            ))}
          </div>
        )}
        {tab === "Consultation" && (
          <section className="retail-card">
            <div className="retail-row">
              <h2>{customer.name}</h2>
              <span className="retail-badge">Practice consultation</span>
            </div>
            <div className="retail-tabbar" aria-label="Consultation steps">
              {steps.map((s, i) => (
                <Button
                  key={s}
                  primary={step === i}
                  aria-current={step === i ? "step" : undefined}
                  onClick={() => setStep(i)}
                >
                  {i + 1}. {s}
                </Button>
              ))}
            </div>
            {step === 0 ? (
              <>
                <h3>Start with the customer’s priorities</h3>
                <Field
                  label="Sample customer goal"
                  value={goal}
                  onChange={setGoal}
                  maxLength={300}
                />
                <p>
                  Ask what has worked before and what support would be useful.
                  In the real workspace, staff observations are saved
                  separately.
                </p>
              </>
            ) : step === 1 ? (
              <>
                <h3>One manageable next step</h3>
                <Field
                  label="Sample customer-facing plan"
                  multiline
                  value={plan}
                  onChange={setPlan}
                  maxLength={2000}
                />
                <p className="retail-muted">
                  This is a practice outline, not individualized nutrition
                  guidance.
                </p>
              </>
            ) : (
              <>
                <h3>Customer preview</h3>
                <div className="retail-card">
                  <h3>{goal || "Add a goal"}</h3>
                  <p className="retail-pre">{plan || "Add a next step"}</p>
                  <span className="retail-badge">
                    Example follow-up · in 7 days
                  </span>
                </div>
                <p>Review what the customer will see before publishing.</p>
              </>
            )}
            <div className="retail-actions">
              {step > 0 && (
                <Button onClick={() => setStep((s) => s - 1)}>Previous</Button>
              )}
              {step < 2 ? (
                <Button primary onClick={() => setStep((s) => s + 1)}>
                  Continue →
                </Button>
              ) : (
                <Button
                  primary
                  disabled={!goal.trim() || !plan.trim()}
                  onClick={() => {
                    setPublished(true);
                    setTab("Member view");
                    setNotice(
                      "Sample plan published in this demo only. This is what the customer would see.",
                    );
                  }}
                >
                  Publish sample plan
                </Button>
              )}
            </div>
          </section>
        )}
        {tab === "Member view" && (
          <div className="retail-columns">
            <section className="retail-card">
              <div className="retail-eyebrow">
                {customer.name.toUpperCase()} · CUSTOMER VIEW
              </div>
              <h2>{published ? goal : "Your next step, in one place."}</h2>
              <p className="retail-pre">
                {published
                  ? plan
                  : "Publish a sample consultation to see your personalized demo plan here."}
              </p>
              <div className="retail-row">
                <span>Next check-in</span>
                <span className="retail-badge">Example · in 7 days</span>
              </div>
              <p>
                Customers can keep tracking in MacroStack, review their plan,
                and contact their store.
              </p>
              {!published && (
                <Button onClick={() => setTab("Consultation")}>
                  Build the sample plan
                </Button>
              )}
            </section>
            <section className="retail-card">
              <h2>Stay connected</h2>
              <p>Sample conversation · No messages leave this demo.</p>
              <div aria-live="polite">
                {messages.map((m, i) => (
                  <p className="retail-card" key={i}>
                    {m}
                  </p>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (message.trim()) {
                    setMessages((m) => [...m, message.trim()]);
                    setMessage("");
                    setNotice("Demo reply added locally. Nothing was sent.");
                  }
                }}
              >
                <Field
                  label="Practice a customer reply"
                  multiline
                  value={message}
                  onChange={setMessage}
                  maxLength={500}
                />
                <Button type="submit" disabled={!message.trim()}>
                  Add demo reply
                </Button>
              </form>
            </section>
          </div>
        )}
        {tab === "Results" && (
          <>
            <div className="retail-card">
              <span className="retail-badge">
                Illustrative data · not actual performance
              </span>
              <h2>{location.name}</h2>
              <p>
                Example 30-day view. These numbers demonstrate the reporting
                layout and do not imply business outcomes.
              </p>
            </div>
            <div className="retail-stats">
              {[
                [location.customers, "Connected customers"],
                [location.consultations, "Consultations"],
                [location.returns, "Return visits"],
              ].map(([n, l]) => (
                <div className="retail-card" key={l}>
                  <strong>{n}</strong>
                  <small>{l}</small>
                </div>
              ))}
            </div>
            <section className="retail-card">
              <h2>Keep each location accountable</h2>
              <p>
                Corporate teams see aggregate results. Access to an individual
                customer’s records requires a separate store membership.
              </p>
              {stores.map((s) => (
                <div className="retail-row" key={s.name}>
                  <span>{s.name}</span>
                  <span>{s.consultations} sample consultations</span>
                </div>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
