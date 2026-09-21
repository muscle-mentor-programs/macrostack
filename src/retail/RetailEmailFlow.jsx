import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import BrandWordmark from "../components/BrandWordmark";
import { accountEmail } from "./accountEmail";
import { Button, Field, Alert, useAction } from "./ui";
import "./retail.css";
import "./retail-signup.css";
export default function RetailEmailFlow() {
  const params = new URLSearchParams(window.location.search);
  const [token] = useState(() => {
    const values = new URLSearchParams(window.location.hash.slice(1));
    const token = {
      token_hash: values.get("token_hash"),
      type: values.get("type"),
    };
    return token;
  });
  useEffect(() => {
    window.history.replaceState(
      {},
      "",
      window.location.pathname + window.location.search,
    );
  }, []);
  const reset = params.get("flow") === "reset";
  const [stage, setStage] = useState("verify");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const { busy, error, run } = useAction();
  const destination = params.has("invite")
    ? `/retail?staff=1&invite=${encodeURIComponent(params.get("invite"))}`
    : "/retailers";
  return (
    <div className="retail retail-signup">
      <main className="retail-email-page">
        <a href="/" aria-label="MacroStack home">
          <BrandWordmark />
        </a>
        <section className="retail-card retail-signup-form">
          <span className="retail-signup-eyebrow">
            MACROSTACK FOR RETAILERS
          </span>
          <h1>
            {stage === "done"
              ? "You’re all set."
              : reset
                ? "Reset your password."
                : "Confirm your email."}
          </h1>
          <Alert error={error} />
          {stage === "verify" && (
            <>
              <p>
                {reset
                  ? "Verify your secure link, then choose a new retailer password."
                  : "Confirm your work email to unlock your retailer account."}
              </p>
              <Button
                primary
                disabled={busy || !token.token_hash}
                onClick={() =>
                  run(async () => {
                    const data = await accountEmail("verify", token);
                    const result = await supabase.auth.setSession(data.session);
                    if (result.error)
                      throw new Error(
                        "Email confirmed. Please sign in to continue.",
                      );
                    setStage(reset ? "password" : "done");
                  })
                }
              >
                {busy
                  ? "Verifying…"
                  : reset
                    ? "Verify reset link"
                    : "Confirm my email"}
              </Button>
              {!token.token_hash && (
                <p role="status">
                  Open the full link from your email. If it has expired, request
                  a new one below.
                </p>
              )}
            </>
          )}
          {stage === "password" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(async () => {
                  if (password !== repeat)
                    throw new Error("Passwords do not match.");
                  const result = await supabase.auth.updateUser({ password });
                  if (result.error) throw result.error;
                  const signedOut = await supabase.auth.signOut({ scope: "global" });
                  if (signedOut.error) throw new Error("Password updated. Please sign out and sign in again.");
                  setPassword("");
                  setRepeat("");
                  setStage("done");
                });
              }}
            >
              <Field
                label="New password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                value={password}
                onChange={setPassword}
              />
              <Field
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={repeat}
                onChange={setRepeat}
              />
              <Button primary type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save new password"}
              </Button>
            </form>
          )}
          {stage === "done" && (
            <>
              <p>
                {reset
                  ? "Your password has been updated. Sign in with your new password."
                  : "Your work email is verified. You can now set up your business or accept your team invitation."}
              </p>
              <a
                className="retail-button primary"
                href={reset ? "/retailers?signin=1" : destination}
              >
                {reset ? "Retailer sign in" : "Continue →"}
              </a>
            </>
          )}
          {stage !== "done" && (
            <p>
              <a href={`/retailers?${reset ? "recover=1" : "confirm=1"}`}>
                {reset
                  ? "Request a new reset email"
                  : "Resend confirmation email"}
              </a>
            </p>
          )}
        </section>
        <p className="retail-muted">
          Need help?{" "}
          <a href="mailto:getmacrostack@gmail.com">getmacrostack@gmail.com</a>
        </p>
      </main>
    </div>
  );
}
