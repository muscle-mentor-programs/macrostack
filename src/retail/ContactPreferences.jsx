import { useEffect, useState } from "react";
import { command, list, verifyPhone } from "./api";
import { Alert, Button, Check, Field, useAction } from "./ui";
export default function ContactPreferences({ relationship }) {
  const [prefs, setPrefs] = useState(null),
    [phone, setPhone] = useState(""),
    [token, setToken] = useState(""),
    [sent, setSent] = useState(false),
    [notice, setNotice] = useState("");
  const { busy, error, run, setError } = useAction();
  useEffect(() => {
    let active = true;
    list("contact_preferences", { relationship_id: relationship.id })
      .then((rows) => {
        if (active)
          setPrefs(rows[0] || { email_enabled: false, sms_enabled: false });
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [relationship.id, setError]);
  return (
    <section className="retail-card">
      <h2>Reminder delivery</h2>
      <p>
        Choose optional service reminders for this store. These are separate
        from marketing and require service reminders to be enabled in
        Preferences.
      </p>
      <Alert error={error} />
      {notice && <p role="status">{notice}</p>}
      {prefs && (
        <>
          <Check
            checked={prefs.email_enabled}
            onChange={(v) => setPrefs((p) => ({ ...p, email_enabled: v }))}
          >
            Email me service reminders
          </Check>
          <Check
            checked={prefs.sms_enabled}
            onChange={(v) => setPrefs((p) => ({ ...p, sms_enabled: v }))}
          >
            Text me service reminders at my verified phone number
          </Check>
          <p className="retail-muted">
            Message frequency varies. Message and data rates may apply. Reply
            STOP to stop texts. Consent is optional and is not a condition of
            purchase. Delivery starts once the sender is configured.
          </p>
          <Button
            disabled={busy || relationship.status !== "active"}
            onClick={() =>
              run(async () => {
                await command("contact_preferences", {
                  relationship_id: relationship.id,
                  email_enabled: prefs.email_enabled,
                  sms_enabled: prefs.sms_enabled,
                });
                setNotice("Reminder preferences saved.");
              })
            }
          >
            Save delivery preferences
          </Button>
          <details>
            <summary>Verify a phone number for texts</summary>
            <Field
              label="Phone number including country code"
              type="tel"
              value={phone}
              onChange={setPhone}
              placeholder="+12025550123"
            />
            <Button
              disabled={busy}
              onClick={() =>
                run(async () => {
                  if (!/^\+[1-9]\d{7,14}$/.test(phone))
                    throw new Error("Include + and your country code.");
                  await verifyPhone(phone);
                  setSent(true);
                  setNotice("Enter the verification code sent to your phone.");
                })
              }
            >
              Send verification code
            </Button>
            {sent && (
              <>
                <Field
                  label="Verification code"
                  value={token}
                  onChange={setToken}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
                <Button
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await verifyPhone(phone, token);
                      setNotice(
                        "Phone verified. You can now save text reminder consent.",
                      );
                      setSent(false);
                      setToken("");
                    })
                  }
                >
                  Verify phone
                </Button>
              </>
            )}
          </details>
        </>
      )}
    </section>
  );
}
