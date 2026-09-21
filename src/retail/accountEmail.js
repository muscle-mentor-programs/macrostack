import { supabase } from "../lib/supabase";
export async function accountEmail(action, payload = {}) {
  if (!supabase) throw new Error("Account service unavailable.");
  const result = await supabase.functions.invoke("retail-auth", {
    body: { action, ...payload },
  });
  if (result.error || result.data?.error) {
    let detail = result.data;
    try {
      if (result.error?.context) detail = await result.error.context.json();
    } catch {
      /* safe fallback */
    }
    throw new Error(
      detail?.error || "Could not send your email. Please retry.",
    );
  }
  return result.data;
}
