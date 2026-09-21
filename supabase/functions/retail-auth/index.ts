import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.3";
import { handleRetailAuth } from "../_shared/retail-auth.mjs";
const url = Deno.env.get("SUPABASE_URL")!;
const settings = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};
serve((req) =>
  handleRetailAuth(req, {
    admin: createClient(
      url,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      settings,
    ),
    authClient: (authorization?: string) =>
      createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
        ...settings,
        ...(authorization
          ? { global: { headers: { Authorization: authorization } } }
          : {}),
      }),
    env: {
      RESEND_API_KEY: Deno.env.get("RESEND_API_KEY"),
      RESEND_FROM_EMAIL: Deno.env.get("RESEND_FROM_EMAIL"),
    },
  }),
);
