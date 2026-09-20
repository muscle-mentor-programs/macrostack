import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const { PGlite } = createRequire(import.meta.url)(
  process.env.PGLITE_MODULE || "@electric-sql/pglite",
);
const db = new PGlite();
const ids = {
  admin: "11111111-1111-4111-8111-111111111111",
  manager: "22222222-2222-4222-8222-222222222222",
  specialist: "33333333-3333-4333-8333-333333333333",
  member: "44444444-4444-4444-8444-444444444444",
  other: "55555555-5555-4555-8555-555555555555",
  corporate: "66666666-6666-4666-8666-666666666666",
};
const as = async (who) =>
  db.exec(
    `reset role;set request.jwt.claim.sub='${ids[who] || ""}';set role authenticated`,
  );
const call = async (action, payload = {}) =>
  (
    await db.query("select public.retail_command($1,$2::jsonb) result", [
      action,
      JSON.stringify(payload),
    ])
  ).rows[0].result;
try {
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid,bucket_id text,name text);alter table storage.objects enable row level security;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
 create table public.profiles(id uuid primary key,name text,role text,admin_override text,member_subscription jsonb default '{}');
 create table public.clients(id uuid primary key,profile_id uuid,coach_id uuid);
 create table public.food_log(id uuid,client_id uuid,date date,name text,meal text,quantity numeric,serving_unit text,calories numeric,protein numeric,carbs numeric,fat numeric);create table public.weight_log(id uuid,client_id uuid,date date,value numeric,unit text);create table public.checkins(id uuid,weight numeric);
 create function public.member_weight_access() returns boolean language sql as $$select false$$;
 alter table weight_log enable row level security;alter table food_log enable row level security;alter table checkins enable row level security;
 create policy member_weight_requires_pro on weight_log as restrictive for all to authenticated using(public.member_weight_access());
 create policy checkin_weight_insert_requires_pro on checkins as restrictive for insert to authenticated with check(weight is null or public.member_weight_access());
 create policy checkin_weight_update_requires_pro on checkins as restrictive for update to authenticated using(true) with check(weight is null or public.member_weight_access());
 grant usage on schema auth,public to authenticated;grant select on profiles to authenticated;`);
  for (const [key, id] of Object.entries(ids))
    await db.query("insert into profiles(id,name,role) values($1,$2,$3)", [
      id,
      key,
      key === "admin" ? "superadmin" : "client",
    ]);
  for (const [key, id] of Object.entries(ids))
    await db.query("insert into auth.users values($1,$2,now())", [
      id,
      `${key}@example.invalid`,
    ]);
  await db.exec(
    readFileSync(
      "supabase/migrations/20260920193515_retail_store_platform.sql",
      "utf8",
    ),
  );
  await as("other");
  await assert.rejects(
    () => call("provision", { name: "Forbidden" }),
    /Superadmin/,
  );
  await as("admin");
  const a = await call("provision", {
    name: "Test Network",
    operator_name: "Corporate",
    location_name: "Store A",
    timezone: "America/Chicago",
  });
  const b = await call("provision", {
    name: "Other Network",
    operator_name: "Other",
    location_name: "Store B",
    timezone: "America/Chicago",
  });
  const invite = await call("invite_staff", {
    organization_id: a.organization_id,
    location_id: a.location_id,
    role: "manager",
    email: "manager@example.invalid",
  });
  await as("other");
  await assert.rejects(
    () => call("accept_invite", { token: invite.token, consent: true }),
    /invited email/,
  );
  await as("manager");
  await call("accept_invite", { token: invite.token, consent: true });
  const spec = await call("invite_staff", {
    organization_id: a.organization_id,
    location_id: a.location_id,
    role: "specialist",
    email: "specialist@example.invalid",
  });
  await as("specialist");
  await call("accept_invite", { token: spec.token, consent: true });
  const prospect = await call("prospect", {
    location_id: a.location_id,
    name: "Member",
    email: "member@example.invalid",
    goal: "Build consistent habits",
  });
  const rid = prospect.relationship_id;
  await as("other");
  assert.equal(
    (await db.query("select * from retail_relationships")).rows.length,
    0,
  );
  await assert.rejects(
    () => call("note", { relationship_id: rid, body: "No access" }),
    /Customer unavailable/,
  );
  await as("member");
  await call("accept_invite", { token: prospect.token, consent: true });
  assert.equal((await db.query("select retail_sponsored() x")).rows[0].x, true);
  await assert.rejects(
    () => call("note", { relationship_id: rid, body: "Forged staff note" }),
    /Store staff/,
  );
  await assert.rejects(
    () =>
      db.query("update retail_relationships set assigned_to=$1 where id=$2", [
        ids.member,
        rid,
      ]),
    /permission denied/,
  );
  await as("specialist");
  const draft = await call("consultation", {
    relationship_id: rid,
    draft: {
      goal: "Goal",
      guidance: "Guidance",
      private_note: "PRIVATE",
      checkin_date: "2026-10-01",
      next_scan: "2026-10-20",
    },
    step: 5,
  });
  await assert.rejects(
    () => call("publish", { relationship_id: rid, id: draft.id }),
    /Draft changed/,
  );
  await call("publish", {
    relationship_id: rid,
    id: draft.id,
    revision: draft.revision,
  });
  await call("publish", {
    relationship_id: rid,
    id: draft.id,
    revision: draft.revision,
  });
  assert.equal(
    (await db.query("select count(*)::int n from retail_plans")).rows[0].n,
    1,
  );
  await call("note", { relationship_id: rid, body: "PRIVATE" });
  await as("member");
  assert.equal((await db.query("select * from retail_notes")).rows.length, 0);
  assert.equal(
    (await db.query("select * from retail_consultations")).rows.length,
    0,
  );
  assert.equal(
    JSON.stringify(
      (await db.query("select * from retail_plans")).rows,
    ).includes("PRIVATE"),
    false,
  );
  const msg = {
    id: crypto.randomUUID(),
    relationship_id: rid,
    body: "Help please",
  };
  await call("message", msg);
  await call("message", msg);
  assert.equal(
    (await db.query("select count(*)::int n from retail_messages")).rows[0].n,
    1,
  );
  // Consent-bound activity and private storage paths.
  await db.exec(
    "reset role;grant usage on schema storage to authenticated;grant select,insert,delete on storage.objects to authenticated;",
  );
  await db.query("insert into clients values($1,$2,null)", [
    crypto.randomUUID(),
    ids.member,
  ]);
  await as("member");
  const fileId = crypto.randomUUID(),
    filePath = `${rid}/${ids.member}/${fileId}`;
  await db.query("insert into storage.objects values($1,'retail-files',$2)", [
    fileId,
    filePath,
  ]);
  await call("file", {
    relationship_id: rid,
    id: fileId,
    object_path: filePath,
    label: "Progress.png",
    kind: "photo",
  });
  assert.equal(
    (
      await db.query(
        "select * from storage.objects where bucket_id='retail-files'",
      )
    ).rows.length,
    1,
  );
  await as("other");
  assert.equal((await db.query("select * from retail_files")).rows.length, 0);
  assert.equal(
    (
      await db.query(
        "select * from storage.objects where bucket_id='retail-files'",
      )
    ).rows.length,
    0,
  );
  await assert.rejects(
    () =>
      db.query("insert into storage.objects values($1,'retail-files',$2)", [
        crypto.randomUUID(),
        `${rid}/${ids.other}/forbidden`,
      ]),
    /row-level security/,
  );
  await as("specialist");
  assert.equal(
    (await db.query("select retail_activity($1) x", [rid])).rows[0].x.shared,
    false,
  );
  await as("member");
  await call("preferences", {
    relationship_id: rid,
    share_activity: true,
    service_reminders: true,
    marketing_consent: false,
  });
  await as("specialist");
  assert.equal(
    (await db.query("select retail_activity($1) x", [rid])).rows[0].x.shared,
    true,
  );
  const retryId = crypto.randomUUID(),
    retryPayload = {
      relationship_id: rid,
      id: retryId,
      draft: { goal: "Safe retry" },
      step: 0,
    };
  const retry1 = await call("consultation", retryPayload),
    retry2 = await call("consultation", retryPayload);
  assert.equal(retry1.id, retry2.id);
  assert.equal(retry1.revision, retry2.revision);
  await assert.rejects(
    () => call("consultation", { ...retryPayload, revision: 99 }),
    /Draft changed/,
  );
  await call("task", {
    relationship_id: rid,
    title: "Due reminder",
    kind: "followup",
    due_at: "2020-01-01T10:00:00Z",
  });
  await assert.rejects(
    () => db.query("select retail_process_reminders()"),
    /permission denied/,
  );
  await db.exec("reset role");
  const delivered = (await db.query("select retail_process_reminders() n"))
    .rows[0].n;
  assert.ok(delivered >= 1);
  assert.equal(
    (await db.query("select retail_process_reminders() n")).rows[0].n,
    0,
  );
  await as("member");
  await call("preferences", {
    relationship_id: rid,
    share_activity: false,
    service_reminders: false,
    marketing_consent: false,
  });
  await as("specialist");
  await call("task", {
    relationship_id: rid,
    title: "Opted out",
    kind: "followup",
    due_at: "2020-01-01T10:00:00Z",
  });
  await db.exec("reset role");
  assert.equal(
    (await db.query("select retail_process_reminders() n")).rows[0].n,
    0,
  );
  await as("manager");
  const r = (
    await db.query("select * from retail_relationships where id=$1", [rid])
  ).rows[0];
  await assert.rejects(
    () => call("relationship", { relationship_id: rid, status: "paused" }),
    /Record changed/,
  );
  await call("relationship", {
    relationship_id: rid,
    status: "paused",
    assigned_to: ids.specialist,
    revision: r.revision,
  });
  await as("member");
  assert.equal(
    (await db.query("select retail_sponsored() x")).rows[0].x,
    false,
  );
  await assert.rejects(
    () =>
      call("message", {
        id: crypto.randomUUID(),
        relationship_id: rid,
        body: "Blocked",
      }),
    /not active/,
  );
  await as("admin");
  const ci = await call("invite_staff", {
    organization_id: a.organization_id,
    role: "organization_admin",
    email: "corporate@example.invalid",
  });
  await as("corporate");
  await call("accept_invite", { token: ci.token, consent: true });
  assert.equal(
    (await db.query("select * from retail_relationships")).rows.length,
    0,
  );
  const report = (
    await db.query("select retail_reports($1,now()-interval '30 days') x", [
      a.location_id,
    ])
  ).rows[0].x;
  assert.equal(report.customers, 1);
  await assert.rejects(
    () => db.query("select retail_reports($1,now())", [b.location_id]),
    /Manager required/,
  );
  console.log(
    "PASS retail database: provisioning, invitation identity, store isolation, staff/private visibility, immutable publishing, retry deduplication, sponsorship pause and corporate aggregate-only reporting",
  );
} finally {
  await db.close();
}
