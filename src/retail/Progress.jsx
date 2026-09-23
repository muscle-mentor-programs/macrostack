import { useEffect, useState } from "react";
import useStore from "../store";
import { activity, list, uploadFile, fileURL } from "./api";
import { Button, Select, Empty, Alert, useAction } from "./ui";
import { displayDate } from "./model";
export default function Progress({ relationship, mode = "all", targets, editable = true }) {
  const userId = useStore((s) => s.currentUser?.id),
    [shared, setShared] = useState(null),
    [files, setFiles] = useState([]),
    [kind, setKind] = useState("photo"),
    [preview, setPreview] = useState(null);
  const { busy, error, run, setError } = useAction();
  useEffect(() => {
    let active = true;
    Promise.all([
      activity(relationship.id),
      list("files", { relationship_id: relationship.id }),
    ])
      .then(([a, f]) => {
        if (active) {
          setShared(a);
          setFiles(f);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [relationship.id, relationship.share_activity, setError]);
  const days = Object.values(
    (shared?.foods || []).reduce((acc, f) => {
      const d = acc[f.date] || {
        date: f.date,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        foods: [],
      };
      for (const k of ["calories", "protein", "carbs", "fat"])
        d[k] += Number(f[k]) || 0;
      d.foods.push(f);
      acc[f.date] = d;
      return acc;
    }, {}),
  );
  return (
    <>
      {mode !== "journal" && (
        <section className="retail-card">
          <h2>Shared files & photos</h2>
          <Alert error={error} />
          <p className="retail-muted">
            Files uploaded here are shared with this customer and their
            authorized store team. Customer app photos are shown separately above when shared.
          </p>
          {editable && relationship.status === "active" && (
            <>
              <Select label="File type" value={kind} onChange={setKind}>
                <option value="photo">Progress photo</option>
                <option value="assessment">Scan report</option>
                <option value="document">Document</option>
              </Select>
              <input
                aria-label="Upload store file"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file)
                    run(async () => {
                      await uploadFile(relationship.id, file, kind, userId);
                      setFiles(
                        await list("files", {
                          relationship_id: relationship.id,
                        }),
                      );
                    });
                }}
              />
              <p className="retail-muted">
                JPG, PNG, WebP or PDF · up to 10 MB
              </p>
            </>
          )}
          {files.map((f) => (
            <div className="retail-row" key={f.id}>
              <div>
                <strong>{f.label}</strong>
                <p>
                  {f.kind} · {displayDate(f.created_at)}
                </p>
              </div>
              <Button
                disabled={busy}
                onClick={() =>
                  run(async () =>
                    setPreview({
                      url: await fileURL(f.object_path),
                      label: f.label,
                    }),
                  )
                }
              >
                View file
              </Button>
            </div>
          ))}
          {!files.length && <Empty>No shared files yet.</Empty>}
          {preview && (
            <div className="retail-card">
              <a href={preview.url} target="_blank" rel="noopener noreferrer">
                Open {preview.label}
              </a>
              <p className="retail-muted">
                This private link expires after two minutes. Reopen the file for
                a fresh link.
              </p>
              <Button onClick={() => setPreview(null)}>Close</Button>
            </div>
          )}
        </section>
      )}
      {mode !== "files" && (
        <section className="retail-card">
          <h2>Food journal</h2>
          <Alert error={error} />
          {shared?.shared ? (
            <>
              <p className="retail-muted">
                Up to 500 entries from the last 30 days. Partial logs are not
                proof of actual intake.
              </p>
              {targets && (
                <div className="retail-nutrition-targets">
                  {["calories", "protein", "carbs", "fat"].map((k) => (
                    <div key={k}>
                      <strong>
                        {targets[k] === "" ? "—" : (targets[k] ?? "—")}
                      </strong>
                      <small>
                        {k === "calories"
                          ? "Daily kcal target"
                          : `${k} target · g`}
                      </small>
                    </div>
                  ))}
                </div>
              )}
              {days
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((d) => (
                  <details key={d.date}>
                    <summary>
                      {displayDate(d.date)} · {Math.round(d.calories)} kcal ·{" "}
                      {Math.round(d.protein)} g protein · {Math.round(d.carbs)}{" "}
                      g carbs · {Math.round(d.fat)} g fat
                    </summary>
                    {d.foods.map((f, i) => (
                      <p key={i}>
                        {f.meal} · {f.name} · {f.quantity} {f.serving_unit}
                      </p>
                    ))}
                  </details>
                ))}
              {!days.length && <Empty>No recent food entries.</Empty>}
            </>
          ) : (
            <Empty>The customer has not enabled activity sharing.</Empty>
          )}
        </section>
      )}
      {mode !== "files" && shared?.shared && (
        <section className="retail-card">
          <h2>Recent weight activity</h2>
          {shared.weights?.map((w, i) => (
            <div className="retail-row" key={i}>
              <span>{displayDate(w.date)}</span>
              <strong>
                {w.value} {w.unit}
              </strong>
            </div>
          ))}
          {!shared.weights?.length && (
            <Empty>No weight entries in the last 90 days.</Empty>
          )}
        </section>
      )}
    </>
  );
}
