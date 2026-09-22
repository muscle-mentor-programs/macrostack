import { useEffect, useState } from "react";
import useStore from "../store";
import LoadingSplash from "../components/LoadingSplash";
import {
  list,
  storeBranding,
  brandLogoURL,
  conversation,
  command,
} from "./api";
import { BrandIdentity } from "./StoreBrand";
import { Alert, Button, Field, useAction } from "./ui";
import "./retail.css";
function StoreConversation({ connection, onBack }) {
  const userId = useStore((s) => s.currentUser?.id);
  const [rows, setRows] = useState(null),
    [body, setBody] = useState(""),
    [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const { busy, error, run, setError } = useAction();
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const data = await conversation(connection.id);
        if (active) {
          setRows(data.messages || []);
          await command("read", { relationship_id: connection.id });
          window.dispatchEvent(new Event("retail-messages-read"));
        }
      } catch (e) {
        if (active) setError(e.message);
      }
    };
    refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 10000);
    const focus = () => refresh();
    window.addEventListener("focus", focus);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [connection.id, setError]);
  return (
    <section className="retail retail-member-chat">
      <div className="retail-header">
        <Button onClick={onBack}>← Messages</Button>
        <BrandIdentity
          name={connection.brand?.name || "Your store"}
          logo={brandLogoURL(connection.brand?.logo_path)}
        />
      </div>
      <Alert error={error} />
      {!rows && !error ? (
        <LoadingSplash label="Opening your conversation…" />
      ) : (
        <div className="retail-member-thread" role="log" aria-live="polite">
          {[...(rows || [])]
            .sort((a, b) => a.created_at.localeCompare(b.created_at))
            .map((m) => (
              <article
                key={m.id}
                className={`retail-message ${m.author_id === userId ? "retail-message-self" : ""}`}
              >
                <strong>
                  {m.author_id === userId
                    ? "You"
                    : connection.brand?.name || "Store team"}
                </strong>
                <p className="retail-pre">{m.body}</p>
                <small>{new Date(m.created_at).toLocaleString()}</small>
              </article>
            ))}
          {rows && !rows.length && <p>Start a conversation with your store team.</p>}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!body.trim()) return;
          run(async () => {
            await command("message", {
              relationship_id: connection.id,
              id: requestId,
              body: body.trim(),
            });
            setBody("");
            setRequestId(crypto.randomUUID());
            const data = await conversation(connection.id);
            setRows(data.messages || []);
          });
        }}
      >
        <Field
          label="Message your store"
          multiline
          value={body}
          onChange={setBody}
          maxLength={10000}
          required
        />
        <Button primary type="submit" disabled={busy || !body.trim()}>
          {busy ? "Sending…" : "Send message"}
        </Button>
      </form>
    </section>
  );
}
export default function CustomerMessages({ CoachConversation }) {
  const userId = useStore((s) => s.currentUser?.id);
  const [connections, setConnections] = useState(null),
    [selected, setSelected] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    if (userId)
      list("relationships", { profile_id: userId, status: "active" })
        .then(async (rows) =>
          Promise.all(
            rows.map(async (r) => ({
              ...r,
              brand: await storeBranding(r.location_id),
            })),
          ),
        )
        .then((rows) => {
          if (active) setConnections(rows);
        })
        .catch(() => {
          if (active)
            setError(
              "Could not load store conversations. Please refresh to try again.",
            );
        });
    return () => {
      active = false;
    };
  }, [userId]);
  if (selected === "coach")
    return (
      <>
        <CoachConversation />
        <button
          className="retail-chat-back retail-button"
          onClick={() => setSelected(null)}
        >
          ← All messages
        </button>
      </>
    );
  if (selected)
    return (
      <StoreConversation
        key={selected.id}
        connection={selected}
        onBack={() => setSelected(null)}
      />
    );
  return (
    <section className="retail retail-member-inbox">
      <h1>Messages</h1>
      <p>Stay connected with your coach and store team.</p>
      <Alert error={error} />
      <Button onClick={() => setSelected("coach")}>Your coach →</Button>
      {!connections && !error ? (
        <LoadingSplash label="Loading conversations…" />
      ) : (
        connections?.map((r) => (
          <button
            className="retail-card retail-conversation-card"
            key={r.id}
            onClick={() => setSelected(r)}
          >
            <BrandIdentity
              name={r.brand?.name || "Your store"}
              logo={brandLogoURL(r.brand?.logo_path)}
            />
            <span>Open store chat →</span>
          </button>
        ))
      )}
    </section>
  );
}
