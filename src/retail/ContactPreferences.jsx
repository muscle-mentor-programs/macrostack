import useDraftProtection from "./useDraftProtection";
import { useEffect, useState, useRef } from "react";
import { command, list, verifyPhone, shareAppRecords } from "./api";
import { Alert, Button, Check, Field, useAction } from "./ui";
export default function ContactPreferences({ relationship, onRefresh }) {
  const [dirty,setDirty]=useState(false);
  const [main, setMain] = useState({
    share_activity: relationship.share_activity,
    service_reminders: relationship.service_reminders,
    marketing_consent: relationship.marketing_consent,
    share_app_records: relationship.share_app_records,
  });
  const saved=useRef({main,prefs:null});
  const [prefs, setPrefs] = useState(null),
    [phone, setPhone] = useState(""),
    [token, setToken] = useState(""),
    [sent, setSent] = useState(false),
    [notice, setNotice] = useState("");
  const { busy, error, run, setError } = useAction();
  useDraftProtection(dirty,setError);
  useEffect(() => {
    let active = true;
    list("contact_preferences", { relationship_id: relationship.id })
      .then((rows) => {
        if (active) {const next=rows[0] || { email_enabled: false, sms_enabled: false };setPrefs(next);saved.current.prefs=next;}
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [relationship.id, setError]);
  return (
    <section className="retail-card">
      <h2>Sharing & reminders</h2>
      <p>
        Choose what your store can see and how you receive reminders. You
        control these permissions.
      </p>
      <Alert error={error} />
      {notice && <p role="status">{notice}</p>}
      {prefs && (
        <>
          <h3>App sharing</h3>
          <Check
            checked={main.share_activity}
            onChange={(v) => {setDirty(true);setMain((p) => ({ ...p, share_activity: v }));}}
          >
            Share food and weight activity
          </Check>
          <Check
            checked={main.share_app_records}
            onChange={(v) => {setDirty(true);setMain((p) => ({ ...p, share_app_records: v }));}}
          >
            Share app profile, targets, plans, photos, check-ins, forms, and
            schedules
          </Check>
          <p className="retail-muted">
            Private coach conversations and staff notes stay separate.
          </p>
          <h3>Service reminders</h3>
          <Check
            checked={main.service_reminders}
            onChange={(v) => {setDirty(true);setMain((p) => ({ ...p, service_reminders: v }));}}
          >
            Enable service reminders
          </Check>
          <Check
            checked={main.marketing_consent}
            onChange={(v) => {setDirty(true);setMain((p) => ({ ...p, marketing_consent: v }));}}
          >
            Allow optional promotional communication
          </Check>
          <Check
            checked={prefs.email_enabled}
            onChange={(v) => {setDirty(true);setPrefs((p) => ({ ...p, email_enabled: v }));}}
          >
            Email me service reminders
          </Check>
          <Check
            checked={prefs.sms_enabled}
            onChange={(v) => {setDirty(true);setPrefs((p) => ({ ...p, sms_enabled: v }));}}
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
                setNotice("");
                await command("preferences", {
                  relationship_id: relationship.id,
                  share_activity: main.share_activity,
                  service_reminders: main.service_reminders,
                  marketing_consent: main.marketing_consent,
                });
                saved.current.main={...saved.current.main,share_activity:main.share_activity,service_reminders:main.service_reminders,marketing_consent:main.marketing_consent};
                setNotice("Activity and reminder settings saved.");
                await shareAppRecords(relationship.id, main.share_app_records);
                saved.current.main={...main};
                setNotice(
                  "Sharing and reminder settings saved. Delivery channels are still being saved.",
                );
                await command("contact_preferences", {
                  relationship_id: relationship.id,
                  email_enabled: prefs.email_enabled,
                  sms_enabled: prefs.sms_enabled,
                });
                saved.current.prefs={...prefs};
                setDirty(false);
                setNotice("All sharing and reminder preferences saved.");
                await onRefresh?.();
              })
            }
          >
            Save settings
          </Button>
          {dirty&&<Button onClick={()=>{setMain({...saved.current.main});setPrefs({...saved.current.prefs});setDirty(false);setNotice("Unsaved changes discarded.");}}>Discard unsaved changes</Button>}
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
