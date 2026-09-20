import { useEffect, useState, useRef } from "react";
import { historyPage } from "./api";
import { Button, Field, Select, Alert, Empty, useAction } from "./ui";
import { csvDownload, displayDate } from "./model";
const labels = {
  plans: "Published plans",
  assessments: "Assessments",
  checkins: "Check-ins",
  messages: "Messages",
  files: "Shared files",
  consultations: "Private consultations",
  notes: "Private notes",
  tasks: "Follow-ups",
  deliveries: "Email / SMS delivery",
};
function summary(row) {
  return (
    row.label ||
    row.title ||
    row.body ||
    row.content?.goal ||
    row.draft?.goal ||
    (row.weight ? `${row.weight} ${row.unit}` : null) ||
    row.status ||
    "Record"
  );
}
export default function History({ relationship, staff }) {
  const [category, setCategory] = useState("plans"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [rows, setRows] = useState([]),
    [cursor, setCursor] = useState(null),
    [pages, setPages] = useState([]),
    [next, setNext] = useState(null),
    [loading, setLoading] = useState(true);
  const cancel = useRef(false);
  useEffect(
    () => () => {
      cancel.current = true;
    },
    [],
  );
  const { busy, error, run, setError } = useAction();
  useEffect(() => {
    let active = true;
    historyPage(category, relationship.id, { cursor, from, to })
      .then((r) => {
        if (active) {
          setRows(r.items);
          setNext(r.next);
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
  }, [category, relationship.id, cursor, from, to, setError]);
  const reset = () => {
    setCursor(null);
    setPages([]);
    setLoading(true);
  };
  const exportAll = () =>
    run(async () => {
      cancel.current = false;
      let cursor = null;
      const all = [];
      do {
        const page = await historyPage(category, relationship.id, {
          cursor,
          from,
          to,
        });
        if (cancel.current) return;
        all.push(...page.items);
        cursor = page.next;
        if (all.length > 50000)
          throw new Error(
            "Choose a narrower date range to export up to 50,000 records.",
          );
      } while (cursor);
      csvDownload(
        [
          ["Date", "Description", "Details"],
          ...all.map((r) => [
            r.created_at || r.published_at || r.updated_at,
            summary(r),
            JSON.stringify(
              r.content ||
                r.answers ||
                r.draft || { ...r, object_path: undefined },
            ),
          ]),
        ],
        `macrostack-${category}-history.csv`,
      );
    });
  const exportPage = () =>
    csvDownload(
      [
        ["Date", "Description", "Details"],
        ...rows.map((r) => [
          r.created_at || r.published_at || r.updated_at,
          summary(r),
          JSON.stringify(
            r.content ||
              r.answers ||
              r.draft || { ...r, object_path: undefined },
          ),
        ]),
      ],
      `macrostack-${category}-${pages.length + 1}.csv`,
    );
  return (
    <section className="retail-card">
      <h2>History & exports</h2>
      <p className="retail-muted">
        Browse every available record, 50 at a time. Date filters use UTC.
        Export a page or the full selected date range (up to 50,000 records).
      </p>
      <Alert error={error} />
      <div className="retail-fields">
        <Select
          label="History category"
          value={category}
          onChange={(v) => {
            reset();
            setCategory(v);
          }}
        >
          {Object.entries(labels)
            .filter(
              ([k]) =>
                staff ||
                [
                  "plans",
                  "assessments",
                  "checkins",
                  "messages",
                  "files",
                ].includes(k),
            )
            .map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
        </Select>
        <Field
          label="From date"
          type="date"
          value={from}
          onChange={(v) => {
            reset();
            setFrom(v);
          }}
        />
        <Field
          label="Through date"
          type="date"
          value={to}
          onChange={(v) => {
            reset();
            setTo(v);
          }}
        />
      </div>
      <Button disabled={!rows.length || loading} onClick={exportPage}>
        Export this page
      </Button>
      <Button disabled={busy || loading} onClick={exportAll}>
        Export date range
      </Button>
      {busy && (
        <Button
          onClick={() => {
            cancel.current = true;
          }}
        >
          Cancel export
        </Button>
      )}
      {loading ? (
        <Empty>Loading history…</Empty>
      ) : rows.length ? (
        rows.map((r) => (
          <details key={r.id} className="retail-card">
            <summary>
              {displayDate(r.created_at || r.published_at || r.updated_at)} ·{" "}
              {summary(r)}
            </summary>
            {Object.entries(r.content || r.answers || r.draft || r)
              .filter(
                ([k]) =>
                  ![
                    "id",
                    "relationship_id",
                    "object_path",
                    "author_id",
                    "created_by",
                    "published_by",
                    "provider_id",
                    "notification_id",
                  ].includes(k),
              )
              .map(([k, v]) => (
                <p key={k}>
                  <strong>{k.replaceAll("_", " ")}: </strong>
                  {typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")}
                </p>
              ))}
          </details>
        ))
      ) : (
        <Empty>No records in this date range.</Empty>
      )}
      <div className="retail-actions">
        <Button
          disabled={!pages.length || busy || loading}
          onClick={() => {
            setLoading(true);
            setCursor(pages.at(-1));
            setPages((p) => p.slice(0, -1));
          }}
        >
          Previous
        </Button>
        <span>Page {pages.length + 1}</span>
        <Button
          disabled={!next || busy || loading}
          onClick={() => {
            setLoading(true);
            setPages((p) => [...p, cursor]);
            setCursor(next);
          }}
        >
          Next
        </Button>
        <Button
          disabled={busy}
          onClick={() =>
            run(async () => {
              const r = await historyPage(category, relationship.id, {
                cursor,
                from,
                to,
              });
              setRows(r.items);
              setNext(r.next);
              setLoading(false);
            })
          }
        >
          Refresh
        </Button>
      </div>
    </section>
  );
}
