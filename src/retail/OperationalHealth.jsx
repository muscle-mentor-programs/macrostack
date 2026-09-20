import useClock from "./useClock";
import { useEffect, useState } from "react";
import { operations, retryDelivery } from "./api";
import { Alert, Button, Empty, useAction } from "./ui";
import { displayDate } from "./model";
const reasons = {
  email_not_configured: "Email sender is not configured",
  sms_not_configured: "Text sender is not configured",
  network_uncertain: "Provider result is uncertain — review before resending",
  retries_exhausted: "Temporary delivery attempts were exhausted",
  delivery_window_expired: "The reminder is too old to resend safely",
  sms_delivery_failed: "The text provider reported delivery failure",
  consent_changed: "Customer preferences changed",
  unsubscribed: "Customer unsubscribed",
};
export default function OperationalHealth({ location, onNavigate }) {
  const now = useClock();
  const [data, setData] = useState(null);
  const { busy, error, run, setError } = useAction();
  const refresh = async () => setData(await operations(location.id));
  useEffect(() => {
    let active = true;
    const load = () =>
      operations(location.id)
        .then((d) => active && setData(d))
        .catch((e) => active && setError(e.message));
    load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [location.id, setError]);
  const steps = data
    ? [
        ["Staff access", data.setup.staff > 0, "Store"],
        ["Published resources", data.setup.resources > 0, "Library"],
        [
          "Billing arranged",
          ["active", "trialing"].includes(data.setup.billing),
          "Store",
        ],
      ]
    : [];
  const worker = data?.worker;
  const stale =
    worker?.last_started_at &&
    now - Date.parse(worker.last_started_at) > 15 * 60000;
  return (
    <>
      <section className="retail-card">
        <div className="retail-row">
          <div>
            <h2>Launch checklist</h2>
            <p>Prepare the store, then rehearse the customer journey.</p>
          </div>
        </div>
        {data && (
          <>
            <progress
              aria-label="Store setup progress"
              max={3}
              value={steps.filter((x) => x[1]).length}
            />
            <div className="retail-grid">
              {steps.map(([title, done, target]) => (
                <div key={title}>
                  <span className="retail-badge">
                    {done ? "Ready" : "To do"}
                  </span>
                  <h3>{title}</h3>
                  <Button onClick={() => onNavigate(target)}>
                    {done ? "Review" : "Set up"}
                  </Button>
                </div>
              ))}
            </div>
            <p className="retail-muted">
              Partner approval, staff training, and a hosted pilot remain part
              of launch sign-off.
            </p>
          </>
        )}
      </section>
      <section className="retail-card">
        <div className="retail-row">
          <div>
            <h2>Operations health</h2>
            <p>Reminder activity over the last 30 days.</p>
          </div>
          <Button disabled={busy} onClick={() => run(refresh)}>
            Refresh health
          </Button>
        </div>
        <Alert error={error} />
        {!data ? (
          <Empty>
            {error
              ? "Health could not be loaded. Try refreshing."
              : "Checking store operations…"}
          </Empty>
        ) : (
          <>
            <div className="retail-stats">
              {[
                ["failed", "Failed"],
                ["unknown", "Needs review"],
                ["stalled", "Queue delayed"],
              ].map(([key, label]) => (
                <div className="retail-card" key={key}>
                  <strong>{data.counts[key] || 0}</strong>
                  <small>{label}</small>
                </div>
              ))}
            </div>
            <div className="retail-status-list">
              {[
                ["Email", data.configuration.email],
                ["Text messages", data.configuration.sms],
                ["Billing provider", data.configuration.billing],
                [
                  "Reminder scheduler",
                  data.configuration.worker && data.scheduler_credential,
                ],
              ].map(([label, ready]) => (
                <div className="retail-row" key={label}>
                  <span>{label}</span>
                  <span className="retail-badge">
                    {ready ? "Configured" : "Setup needed"}
                  </span>
                </div>
              ))}
            </div>
            <p role="status">
              {!worker
                ? "No reminder worker run recorded yet."
                : worker.status === "failed"
                  ? "The last worker run failed. Review delivery setup before retrying."
                  : stale
                    ? "The reminder worker has not checked in for over 15 minutes."
                    : worker.status === "running"
                      ? "Reminder processing is running."
                      : `Last worker check: ${displayDate(worker.last_finished_at, location.timezone)} · ${worker.processed} processed.`}
            </p>
            <p className="retail-muted">
              {data.counts.delivered || 0} confirmed delivered ·{" "}
              {data.counts.accepted || 0} accepted by provider ·{" "}
              {data.counts.queued || 0} queued. Provider configuration is not a
              successful delivery test.
            </p>
            <details className="retail-help">
              <summary>
                Delivery issues and queued reminders ({data.items.length}
                {data.items.length === 50 ? "+" : ""})
              </summary>
              <p>
                Only temporary email failures within the safe retry window can
                be queued again. Unknown outcomes, texts, bounces, and opt-outs
                require review. View older records in each customer’s History.
              </p>
              {data.items.length ? (
                data.items.map((item) => (
                  <div className="retail-row" key={item.id}>
                    <div>
                      <h3>{item.name}</h3>
                      <p>
                        {item.channel === "sms" ? "Text" : "Email"} ·{" "}
                        {item.status}
                      </p>
                      <small>
                        {reasons[item.error_code] ||
                          (item.error_code?.startsWith("provider_")
                            ? "The delivery provider rejected this attempt"
                            : item.error_code ||
                              "Waiting for the next processing run")}
                      </small>
                    </div>
                    {item.retryable && (
                      <Button
                        disabled={busy}
                        onClick={() =>
                          run(async () => {
                            await retryDelivery(item.id);
                            await refresh();
                          })
                        }
                      >
                        Queue retry
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <Empty>No delivery issues visible for your access.</Empty>
              )}
            </details>
          </>
        )}
      </section>
    </>
  );
}
