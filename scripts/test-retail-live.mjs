// Opt-in hosted acceptance test. Use synthetic accounts only. Never runs in CI.
// See docs/retail/hosted-acceptance.md for setup and mandatory cleanup.
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { randomUUID, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const [mode, statePath] = process.argv.slice(2);
assert(
  statePath?.startsWith("/"),
  "Supply an absolute, private temporary state path",
);
const state = JSON.parse(await readFile(statePath, "utf8"));
assert(
  state.url === "https://ryvsbidtwhxfmashwsqt.supabase.co",
  "Unexpected test target",
);
const save = () => writeFile(statePath, JSON.stringify(state), { mode: 0o600 });
const client = () =>
  createClient(state.url, state.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
function ok(result, label) {
  assert(!result.error, `${label}: ${result.error?.message || ""}`);
  return result.data;
}
async function login(account) {
  const c = client();
  ok(await c.auth.signInWithPassword(account), "Password sign-in");
  return c;
}
const command = async (c, action, payload) =>
  ok(await c.rpc("retail_command", { action, payload }), action);
if (mode === "register") {
  assert(!state.accounts, "Use a new state file for registration");
  assert(
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.retailTestEmail || ""),
    "Supply an unused controlled retailTestEmail for confirmation delivery",
  );
  state.run = randomUUID();
  state.accounts = {};
  await save();
  for (const role of ["admin", "manager", "member", "outsider"]) {
    const account = {
      email:
        role === "manager"
          ? state.retailTestEmail
          : `retail-live-${state.run}-${role}@example.invalid`,
      password: randomBytes(32).toString("base64url"),
    };
    state.accounts[role] = account;
    await save(); // Retain the exact email even if registration loses its response.
    const c = client();
    const registered = ok(
      await c.functions.invoke(
        role === "manager" ? "retail-auth" : "register",
        {
          body: {
            ...account,
            action: "register",
            name: "Synthetic retail acceptance",
            role: "client",
            account_type: role === "manager" ? "retailer" : "personal",
          },
        },
      ),
      "Registration",
    );
    assert(!registered.error, "Registration rejected");
    if (role === "manager") {
      assert(
        (await c.auth.signInWithPassword(account)).error,
        "Unconfirmed retailer signed in",
      );
      continue;
    }
    const signed = ok(
      await c.auth.signInWithPassword(account),
      "Password sign-in",
    );
    account.id = signed.user.id;
    await save();
    await c.auth.signOut();
  }
  console.log(
    "PASS registration; confirm the controlled retailer email before running verify",
  );
  console.log(
    JSON.stringify(
      Object.fromEntries(
        Object.entries(state.accounts).map(([k, v]) => [k, v.id]),
      ),
    ),
  );
} else if (mode === "verify") {
  assert(
    !state.organization,
    "Clean up the previous run and start with fresh accounts",
  );
  const sessions = {};
  try {
    for (const [role, account] of Object.entries(state.accounts)) {
      sessions[role] = await login(account);
      account.id = ok(
        await sessions[role].auth.getUser(),
        "User identity",
      ).user.id;
      await save();
    }
    const { admin, manager, member, outsider } = sessions;
    if (!state.organization)
      state.organization = await command(admin, "provision", {
        name: `Synthetic acceptance ${state.run}`,
        operator_name: "Synthetic QA",
        location_name: "Synthetic QA store",
        timezone: "America/Boise",
      });
    await save();
    const org = state.organization;
    if (!state.relationship) {
      const invite = await command(admin, "invite_staff", {
        ...org,
        role: "manager",
        email: state.accounts.manager.email,
      });
      assert(
        (
          await outsider.rpc("retail_command", {
            action: "accept_invite",
            payload: { token: invite.token, consent: true },
          })
        ).error,
        "Wrong-email staff claim accepted",
      );
      await command(manager, "accept_invite", {
        token: invite.token,
        consent: true,
      });
      const prospect = await command(manager, "prospect", {
        location_id: org.location_id,
        name: "Synthetic customer",
        email: state.accounts.member.email,
        goal: "Acceptance test",
      });
      state.relationship = prospect.relationship_id;
      await save();
      assert(
        (
          await outsider.rpc("retail_command", {
            action: "accept_invite",
            payload: { token: prospect.token, consent: true },
          })
        ).error,
        "Wrong-email customer claim accepted",
      );
      await command(member, "accept_invite", {
        token: prospect.token,
        consent: true,
      });
    }
    const base = { relationship_id: state.relationship };
    await command(member, "intake", {
      ...base,
      answers: { goal: "Acceptance test" },
      form_snapshot: [],
    });
    const future = (days) =>
      new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
    const draft = await command(manager, "consultation", {
      ...base,
      step: 5,
      draft: {
        goal: "Synthetic goal",
        guidance: "Synthetic guidance",
        private_note: "PRIVATE_ACCEPTANCE_NOTE",
        checkin_date: future(7),
        next_scan: future(30),
      },
    });
    for (let i = 0; i < 2; i++)
      await command(manager, "publish", {
        ...base,
        id: draft.id,
        revision: draft.revision,
      });
    const plans = ok(
      await member
        .from("retail_plans")
        .select("*")
        .eq("relationship_id", state.relationship),
      "Member plan",
    );
    assert.equal(plans.length, 1);
    assert(!JSON.stringify(plans).includes("PRIVATE_ACCEPTANCE_NOTE"));
    for (const table of ["retail_notes", "retail_consultations"])
      assert.equal(
        ok(
          await member
            .from(table)
            .select("*")
            .eq("relationship_id", state.relationship),
          "Private records",
        ).length,
        0,
      );
    assert.equal(
      ok(
        await outsider
          .from("retail_plans")
          .select("*")
          .eq("relationship_id", state.relationship),
        "Unrelated plan",
      ).length,
      0,
    );
    await command(member, "message", {
      ...base,
      id: randomUUID(),
      body: "Synthetic check-in message",
    });
    await command(member, "checkin", {
      ...base,
      id: randomUUID(),
      answers: { progress: "Synthetic response" },
    });
    await command(member, "contact_preferences", {
      ...base,
      email_enabled: false,
      sms_enabled: false,
    });
    assert(
      (
        await member.rpc("retail_command", {
          action: "contact_preferences",
          payload: { ...base, sms_enabled: true },
        })
      ).error,
      "Unverified SMS consent accepted",
    );
    console.log(
      "PASS hosted invitations, intake, publication, privacy, messaging, check-in and consent",
    );
    const bytes = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7LsAAAAASUVORK5CYII=",
      "base64",
    );
    state.objects ||= [];
    for (const [role, c, reader] of [
      ["manager", manager, member],
      ["member", member, manager],
    ]) {
      const id = randomUUID(),
        path = `${state.relationship}/${state.accounts[role].id}/${id}`;
      state.objects.push({ role, path });
      await save();
      ok(
        await c.storage
          .from("retail-files")
          .upload(path, bytes, { contentType: "image/png" }),
        "Binary upload",
      );
      await command(c, "file", {
        ...base,
        id,
        object_path: path,
        label: "Synthetic acceptance.png",
        kind: "photo",
      });
      const signed = ok(
        await reader.storage.from("retail-files").createSignedUrl(path, 120),
        "Authorized signed URL",
      );
      const response = await fetch(signed.signedUrl);
      assert.equal(response.status, 200);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
      assert(
        (await outsider.storage.from("retail-files").createSignedUrl(path, 120))
          .error,
        "Unrelated file access allowed",
      );
      assert(
        (await client().storage.from("retail-files").createSignedUrl(path, 120))
          .error,
        "Anonymous file access allowed",
      );
    }
    console.log(
      "PASS real binary upload/download in both directions; anonymous/unrelated file access denied",
    );
    const health = ok(
      await manager.functions.invoke("retail-health", {
        body: { location_id: org.location_id },
      }),
      "Manager health",
    );
    assert(!health.error);
    assert(
      (
        await member.functions.invoke("retail-health", {
          body: { location_id: org.location_id },
        })
      ).error,
      "Member health access allowed",
    );
    console.log(
      "Provider configuration (presence only):",
      JSON.stringify(health.configuration),
    );
  } finally {
    for (const c of Object.values(sessions)) await c.auth.signOut();
  }
} else if (mode === "remove-files") {
  for (const { role, path } of state.objects || []) {
    const c = await login(state.accounts[role]);
    try {
      ok(
        await c.storage.from("retail-files").remove([path]),
        "Remove synthetic object",
      );
    } finally {
      await c.auth.signOut();
    }
  }
  console.log(
    "Synthetic object cleanup complete; database/account cleanup still required",
  );
} else if (mode === "cleanup-sql") {
  assert(/^[0-9a-f-]{36}$/.test(state.run), "Invalid run ID");
  // Exact run identity only. Storage bytes must be removed with remove-files first.
  console.log(`begin;
create temporary table qa_users as select id from auth.users where email in (${Object.values(
    state.accounts,
  )
    .map((account) => "'" + account.email.replaceAll("'", "''") + "'")
    .join(",")});
create temporary table qa_orgs as select id from public.retail_organizations where name='Synthetic acceptance ${state.run}';
create temporary table qa_locations as select id from public.retail_locations where organization_id in(select id from qa_orgs);
create temporary table qa_relationships as select id from public.retail_relationships where location_id in(select id from qa_locations);
do $$begin
if exists(select 1 from storage.objects where bucket_id='retail-files' and split_part(name,'/',1) in(select id::text from qa_relationships)) then raise exception 'Remove test storage objects through Storage API first';end if;
end$$;
${["deliveries", "notifications", "contact_preferences", "files", "plans", "consultations", "assessments", "notes", "messages", "read_receipts", "threads", "checkins", "intakes", "tasks", "invitations"].map((table) => `delete from public.retail_${table} where relationship_id in(select id from qa_relationships);`).join("\n")}
delete from public.retail_relationships where id in(select id from qa_relationships);
${["invitations", "staff", "templates", "pilot_settings", "audit"].map((table) => `delete from public.retail_${table} where organization_id in(select id from qa_orgs);`).join("\n")}
delete from public.retail_contracts where location_id in(select id from qa_locations);
delete from public.retail_locations where id in(select id from qa_locations);
delete from public.retail_operators where organization_id in(select id from qa_orgs);
delete from public.retail_organizations where id in(select id from qa_orgs);
delete from public.clients where profile_id in(select id from qa_users);
delete from auth.sessions where user_id in(select id from qa_users);
delete from auth.users where id in(select id from qa_users);
commit;
select count(*) as remaining_test_accounts from auth.users where email in (${Object.values(
    state.accounts,
  )
    .map((account) => "'" + account.email.replaceAll("'", "''") + "'")
    .join(",")});`);
} else {
  throw new Error("Use register, verify, remove-files, or cleanup-sql");
}
