import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import useStore from "../store";
import LoadingSplash from "../components/LoadingSplash";
import { BrandIdentity } from "./StoreBrand";
import { brandLogoURL, command, shareAppRecords } from "./api";
import { Alert, Button, Field, Check, Modal, useAction } from "./ui";
import "./retail.css";
import "./retail-signup.css";
export default function CustomerInvite() {
  const token = new URLSearchParams(window.location.search).get("invite");
  const [invite, setInvite] = useState(null),
    [loaded, setLoaded] = useState(false),
    [user, setUser] = useState(null);
  const [mode, setMode] = useState("login"),
    [name, setName] = useState(""),
    [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false),
    [share, setShare] = useState(false),
    [notice, setNotice] = useState("");
  const { busy, error, run, setError } = useAction();
  useEffect(() => {
    let active = true;
    if (!supabase) return;
    Promise.all([
      supabase.rpc("retail_customer_invitation", { invite_token: token }),
      supabase.auth.getUser(),
    ])
      .then(([result, auth]) => {
        if (!active) return;
        if (result.error) throw result.error;
        setInvite(result.data);
        setMode(result.data?.has_account ? "login" : "signup");
        setUser(auth.data.user);
        setLoaded(true);
      })
      .catch(() => {
        if (active) {
          setError(
            "This invitation could not be loaded. Ask your store for a new invitation.",
          );
          setLoaded(true);
        }
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user || null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [token, setError]);
  const exit = () => window.location.assign("/dashboard");
  const matches =
    user?.email?.toLowerCase() === invite?.email?.toLowerCase() &&
    user?.app_metadata?.account_type !== "retailer";
  return (
    <div className="retail retail-signup retail-invite-page">
      {!loaded ? (
        <LoadingSplash fullScreen label="Opening your store invitation…" />
      ) : !invite ? (
        <section className="retail-card">
          <h1>Invitation unavailable</h1>
          <Alert error={error} />
          <p>
            This link may have expired. Ask your store to send another
            invitation.
          </p>
          <a className="retail-button" href="/">
            Back to MacroStack
          </a>
        </section>
      ) : (
        <section className="retail-card retail-invite-card">
          <BrandIdentity
            name={invite.brand}
            logo={brandLogoURL(invite.logo_path)}
          />
          <h1>
            {user
              ? "Your store connection"
              : mode === "signup"
                ? "Create your customer account"
                : "Welcome back"}
          </h1>
          <p>
            {invite.store} invited you to connect for meal plans, nutrition
            targets and direct support.
          </p>
          <Alert error={error} />
          {notice && <p role="status">{notice}</p>}
          {!user ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(async () => {
                  const result =
                    mode === "signup"
                      ? await useStore
                          .getState()
                          .signup(name.trim(), invite.email, password, "client")
                      : await useStore.getState().login(invite.email, password);
                  if (!result.ok) throw new Error(result.error);
                  if (result.needsConfirmation)
                    setNotice(
                      "Check your email to confirm your account, then reopen this store invitation.",
                    );
                });
              }}
            >
              {mode === "signup" && (
                <Field
                  label="Your name"
                  value={name}
                  onChange={setName}
                  required
                  autoComplete="name"
                />
              )}
              <Field
                label="Invited email"
                type="email"
                value={invite.email}
                readOnly
                onChange={() => {}}
                autoComplete="email"
              />
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                required
                minLength={mode === "signup" ? 8 : undefined}
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
              />
              <div className="retail-actions">
                <Button primary type="submit" disabled={busy}>
                  {busy
                    ? "Please wait…"
                    : mode === "signup"
                      ? "Create user account"
                      : "Sign in"}
                </Button>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setMode(mode === "signup" ? "login" : "signup");
                    setError("");
                  }}
                >
                  {mode === "signup"
                    ? "Already have an account? Sign in"
                    : "Create an account"}
                </Button>
              </div>
              <a href="/login" className="retail-invite-help">
                Need help signing in? Open account recovery
              </a>
            </form>
          ) : !matches ? (
            <>
              <p>
                Sign in with {invite.email} using your customer account to
                accept this invitation.
              </p>
              <Button
                onClick={() =>
                  run(async () => {
                    await supabase.auth.signOut();
                  })
                }
              >
                Use the invited account
              </Button>
            </>
          ) : (
            <Modal title={`Connect with ${invite.brand}`} onClose={exit}>
              <BrandIdentity
                name={invite.brand}
                logo={brandLogoURL(invite.logo_path)}
              />
              <p>
                Connect your MacroStack account to {invite.store}. Your store
                can send meal plans, set your daily calories and macros, and
                chat with you in Messages.
              </p>
              <p className="retail-muted">
                Published store plans become your active plan and targets. Your
                coach connection stays separate; the latest published targets
                replace your current targets.
              </p>
              <Alert error={error} />
              <Check checked={consent} onChange={setConsent}>
                I agree to link my account and receive nutrition plans and
                messages from this store.
              </Check>
              <Check checked={share} onChange={setShare}>
                Share my app records, including food and weight history, photos,
                plans and check-ins, with the authorized store team.
              </Check>
              <div className="retail-actions">
                <Button
                  primary
                  disabled={!consent || busy}
                  onClick={() =>
                    run(async () => {
                      const result = await command("accept_invite", {
                        token,
                        consent: true,
                        share_activity: share,
                      });
                      if (share && result.relationship_id)
                        await shareAppRecords(result.relationship_id, true);
                      await useStore.getState().loadAllData();
                      window.location.assign("/messages?store=1");
                    })
                  }
                >
                  {busy ? "Connecting…" : "Link my account"}
                </Button>
                <Button onClick={exit} disabled={busy}>
                  Not now
                </Button>
              </div>
            </Modal>
          )}
        </section>
      )}
    </div>
  );
}
