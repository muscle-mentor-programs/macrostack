import LoadingSplash from "../components/LoadingSplash";
import { useEffect, useState } from "react";
import { accountEmail } from "./accountEmail";
import { supabase } from "../lib/supabase";
import useStore from "../store";
import { isVerifiedRetailAccount } from "./authRouting.mjs";
import RetailApp from "./RetailApp";
export default function RetailEntry() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(
    supabase ? "" : "Account service unavailable. Please try again shortly.",
  );
  useEffect(() => {
    let active = true;
    const login = () => {
      const params = new URLSearchParams({ signin: "1" });
      const invite = new URLSearchParams(window.location.search).get("invite");
      if (invite) params.set("invite", invite);
      window.location.replace(`/retailers?${params}`);
    };
    if (!supabase) return;
    supabase.auth
      .getUser()
      .then(async ({ data, error: e }) => {
        if (!active) return;
        if (!data?.user) {
          login();
          return;
        }
        if (e) throw e;
        if (!isVerifiedRetailAccount(data.user)) {
          await supabase.auth.signOut({ scope: "local" });
          login();
          return;
        }
        const { data: profiles, error: profileError } =
          await supabase.rpc("get_my_account");
        if (profileError) throw profileError;
        const profile = profiles?.[0];
        if (!profile || profile.admin_override === "locked")
          throw new Error(
            "Your retailer account is unavailable. Contact support.",
          );
        if (!active) return;
        useStore.setState({
          currentUser: {
            id: data.user.id,
            email: data.user.email,
            name: profile.name,
            role: profile.role,
          },
          isAuthenticated: true,
        });
        setReady(true);
        // Confirmation remains valid if the optional welcome delivery needs retry.
        if (!data.user.app_metadata.retail_welcome_sent)
          void accountEmail("welcome").catch(() => {});
      })
      .catch((e) => {
        if (active)
          setError(e.message || "Could not open your retailer account.");
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && active) {
        setReady(false);
        useStore.setState({ currentUser: null, isAuthenticated: false });
        login();
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  if (error)
    return (
      <main className="retail">
        <p role="alert">{error}</p>
        <a href="/retailers?signin=1">Retailer sign in</a>
      </main>
    );
  return ready ? (
    <RetailApp retailerSession />
  ) : (
    <LoadingSplash fullScreen label="Opening retailer workspace…" />
  );
}
