import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import BrandWordmark from "../components/BrandWordmark";
import { Alert, Button, Field, Select, useAction } from "./ui";
import useViewport from "./useViewport";
import "./retail.css";
import "./retail-signup.css";

const features = [
  [
    "01",
    "Consultations that carry forward",
    "Intake forms, private notes and personalized plans in one customer record.",
  ],
  [
    "02",
    "Support between store visits",
    "Customer messaging, check-ins, follow-up tasks and shared progress files.",
  ],
  [
    "03",
    "One team. Every location.",
    "Staff permissions, store workspaces and reporting across your business.",
  ],
];
export default function RetailSignup() {
  useViewport();
  const [user, setUser] = useState(null),
    [checking, setChecking] = useState(Boolean(supabase));
  const [mode, setMode] = useState(
      new URLSearchParams(window.location.search).has("signin")
        ? "login"
        : "signup",
    ),
    [name, setName] = useState("");
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  const [business, setBusiness] = useState(""),
    [store, setStore] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago",
  );
  const [billingName, setBillingName] = useState(""),
    [billingEmail, setBillingEmail] = useState("");
  const [existing, setExisting] = useState(false);
  const { busy, error, run, setError } = useAction();
  useEffect(() => {
    let active = true;
    if (!supabase) return;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (active) {
          setUser(data.user);
          setChecking(false);
        }
      })
      .catch(() => {
        if (active) {
          setChecking(false);
          setError("Could not check your account. Please sign in again.");
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
  }, [setError]);
  useEffect(() => {
    let active = true;
    if (user)
      supabase
        .from("retail_staff")
        .select("id")
        .eq("user_id", user.id)
        .eq("active", true)
        .limit(1)
        .then(({ data, error: e }) => {
          if (active) {
            setExisting(Boolean(data?.length));
            if (
              data?.length &&
              new URLSearchParams(window.location.search).has("signin")
            )
              window.location.replace("/retail");
            if (e)
              setError(
                "Could not check your existing workspace. Refresh before continuing.",
              );
          }
        });
    return () => {
      active = false;
    };
  }, [user, setError]);
  const authenticate = (event) => {
    event.preventDefault();
    run(async () => {
      if (!supabase) throw new Error("Account service unavailable");
      if (mode === "signup") {
        const result = await supabase.functions.invoke("register", {
          body: {
            name: name.trim(),
            email: email.trim(),
            password,
            role: "client",
          },
        });
        if (result.error || result.data?.error) {
          let detail = result.data;
          try {
            if (result.error?.context)
              detail = await result.error.context.json();
          } catch {
            /* fallback */
          }
          throw new Error(
            detail?.error ||
              "Could not create your account. If you already have one, sign in below.",
          );
        }
      }
      const result = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (result.error)
        throw new Error(
          mode === "signup"
            ? "Account created. Sign in to continue setting up your business."
            : result.error.message,
        );
      setUser(result.data.user);
      setPassword("");
      setBillingName(name);
      setBillingEmail(email.trim());
    });
  };
  const createWorkspace = (event) => {
    event.preventDefault();
    run(async () => {
      const { error: e } = await supabase.rpc("retail_command", {
        action: "start_workspace",
        payload: {
          name: business.trim(),
          location_name: store.trim(),
          timezone,
          billing_name: billingName.trim(),
          billing_email: (billingEmail || user.email).trim(),
        },
      });
      if (e) throw e;
      window.location.assign("/retail?setup=1");
    });
  };
  const zones = [
    ...new Set([
      timezone,
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Boise",
      "America/Los_Angeles",
      "America/Phoenix",
      "Pacific/Honolulu",
      "America/Anchorage",
      "Europe/London",
      "UTC",
    ]),
  ];
  return (
    <div className="retail retail-signup">
      <header className="retail-top">
        <a className="retail-brand" href="/" aria-label="MacroStack home">
          <BrandWordmark />
        </a>
        <div className="retail-actions">
          <a href="/retailers?signin=1">Retailer sign in ↗</a>
        </div>
      </header>
      <main className="retail-signup-main">
        <section className="retail-signup-intro">
          <span className="retail-signup-eyebrow">
            MACROSTACK FOR RETAILERS
          </span>
          <h1>
            Turn a store visit into <em>lasting progress.</em>
          </h1>
          <p className="retail-signup-lead">
            Your nutrition services, customer relationships and store team. One
            connected workspace.
          </p>
          <a className="retail-button primary" href="#retailer-account">
            Get started →
          </a>
          <div className="retail-signup-features">
            {features.map(([number, title, body]) => (
              <div key={number}>
                <span>{number}</span>
                <div>
                  <h2>{title}</h2>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="retail-signup-price">
            <strong>
              $599<span> / store / month</span>
            </strong>
            <p>
              Billed by MacroStack, LLC. Includes your store tools and sponsored
              Pro access for connected customers while your subscription is
              active.
            </p>
          </div>
          <p className="retail-muted">
            Manual assessments and CSV imports are available. Automated
            InBody/POS connections are not included yet. Email/text reminders
            require provider setup.
          </p>
        </section>
        <section
          id="retailer-account"
          className="retail-card retail-signup-form"
          aria-label="Retailer account setup"
        >
          <ol className="retail-signup-steps">
            <li aria-current={!user ? "step" : undefined}>01 Account</li>
            <li aria-current={user ? "step" : undefined}>02 Business</li>
            <li>03 Workspace</li>
          </ol>
          <Alert
            error={
              !supabase
                ? "Account service unavailable. Please try again shortly."
                : error
            }
          />
          {checking ? (
            <p role="status">Checking your account…</p>
          ) : !user ? (
            <>
              <h2>
                {mode === "signup"
                  ? "Create your retailer account"
                  : "Welcome back"}
              </h2>
              <p>
                {mode === "signup"
                  ? "Start with your account. Add your business and first store next."
                  : "Use your existing MacroStack account to set up or return to your business."}
              </p>
              <form onSubmit={authenticate}>
                {mode === "signup" && (
                  <Field
                    label="Your name"
                    autoComplete="name"
                    required
                    maxLength={120}
                    value={name}
                    onChange={setName}
                  />
                )}
                <Field
                  label="Work email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={setEmail}
                />
                <Field
                  label="Password"
                  type="password"
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  minLength={mode === "signup" ? 8 : undefined}
                  required
                  value={password}
                  onChange={setPassword}
                />
                <Button primary type="submit" disabled={busy}>
                  {busy
                    ? "Please wait…"
                    : mode === "signup"
                      ? "Create account →"
                      : "Sign in →"}
                </Button>
              </form>
              <Button
                disabled={busy}
                onClick={() => {
                  setMode(mode === "signup" ? "login" : "signup");
                  setError("");
                }}
              >
                {mode === "signup"
                  ? "Already have an account? Sign in"
                  : "New to MacroStack? Create account"}
              </Button>
              <a href="/login">Need to reset your password?</a>
            </>
          ) : (
            <>
              <h2>Set up your business</h2>
              <p>Signed in as {user.email}</p>
              {existing && (
                <div className="retail-signup-existing">
                  <p>You already have access to a store workspace.</p>
                  <a className="retail-button primary" href="/retail">
                    Open your workspace →
                  </a>
                </div>
              )}
              <form onSubmit={createWorkspace}>
                <Field
                  label="Business name"
                  placeholder="e.g. Peak Nutrition"
                  required
                  maxLength={120}
                  value={business}
                  onChange={setBusiness}
                />
                <Field
                  label="First store name"
                  placeholder="e.g. Downtown location"
                  required
                  maxLength={120}
                  value={store}
                  onChange={setStore}
                />
                <Select
                  label="Store timezone"
                  value={timezone}
                  onChange={setTimezone}
                >
                  {zones.map((z) => (
                    <option key={z} value={z}>
                      {z.replaceAll("_", " ")}
                    </option>
                  ))}
                </Select>
                <Field
                  label="Billing contact name"
                  required
                  maxLength={150}
                  value={billingName}
                  onChange={setBillingName}
                />
                <Field
                  label="Billing email"
                  type="email"
                  required
                  value={billingEmail || user.email}
                  onChange={setBillingEmail}
                />
                <p className="retail-muted">
                  Creating a workspace does not charge you. Prepare your team
                  and resources, then activate your first store through the
                  $599/month checkout. Add more locations from your workspace.
                </p>
                <Button primary type="submit" disabled={busy}>
                  {busy ? "Creating workspace…" : "Create my workspace →"}
                </Button>
              </form>
              <Button
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const { error: e } = await supabase.auth.signOut();
                    if (e) throw e;
                    setUser(null);
                    setExisting(false);
                  })
                }
              >
                Use a different account
              </Button>
            </>
          )}
        </section>
      </main>
      <footer className="retail-signup-footer">
        Questions before getting started?{" "}
        <a href="mailto:getmacrostack@gmail.com">getmacrostack@gmail.com</a>
      </footer>
    </div>
  );
}
