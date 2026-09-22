import { supabase } from "../lib/supabase";
function check(result) {
  if (result.error)
    throw new Error(result.error.message || "Could not save. Please retry.");
  return result.data;
}
export async function command(action, payload) {
  if (!supabase) throw new Error("The account service is unavailable.");
  return check(await supabase.rpc("retail_command", { action, payload }));
}
export async function list(table, filters = {}, limit = 200) {
  if (!supabase) throw new Error("The account service is unavailable.");
  let query = supabase.from(`retail_${table}`).select("*").limit(limit);
  const order = {
    consultations: "updated_at",
    plans: "published_at",
    assessments: "measured_on",
    tasks: "due_at",
    notes: "created_at",
    messages: "created_at",
    checkins: "created_at",
    notifications: "created_at",
    templates: "updated_at",
    relationships: "created_at",
  }[table];
  if (order) query = query.order(order, { ascending: table === "tasks" });
  for (const [key, value] of Object.entries(filters))
    query = query.eq(key, value);
  return check(await query) || [];
}
export async function context(userId) {
  if (!userId) throw new Error("Sign in to open the store workspace.");
  const [locations, organizations, staff, operators] = await Promise.all([
    list("locations"),
    list("organizations"),
    list("staff", { user_id: userId, active: true }),
    list("operators"),
  ]);
  return { locations, organizations, staff, operators };
}
export async function customer(id) {
  const tables = [
    "consultations",
    "plans",
    "assessments",
    "tasks",
    "notes",
    "messages",
    "threads",
    "checkins",
    "notifications",
    "read_receipts",
    "intakes",
  ];
  const entries = await Promise.all(
    tables.map(async (table) => [
      table,
      await list(table, { relationship_id: id }, 300),
    ]),
  );
  return Object.fromEntries(entries);
}
export async function reports(lid, days = 30) {
  return check(
    await supabase.rpc("retail_reports", {
      lid,
      since_at: new Date(Date.now() - days * 86400000).toISOString(),
    }),
  );
}
export async function joinInfo(code) {
  return check(await supabase.rpc("retail_join_info", { code }));
}
export async function directory(lid) {
  return check(await supabase.rpc("retail_staff_directory", { lid })) || [];
}
export async function inbox(lid, { offset = 0, state = "all" } = {}) {
  return (
    check(
      await supabase.rpc("retail_inbox_page", {
        lid,
        page_offset: offset,
        thread_state: state,
      }),
    ) || []
  );
}
export async function intakeForm(rid) {
  return check(await supabase.rpc("retail_intake_form", { rid })) || [];
}
export async function relationships(
  lid,
  { search = "", filter = "all", userId, offset = 0 } = {},
) {
  let q = supabase
    .from("retail_relationships")
    .select("*", { count: "exact" })
    .eq("location_id", lid)
    .order("created_at", { ascending: false })
    .order("id")
    .range(offset, offset + 49);
  if (filter === "mine") q = q.eq("assigned_to", userId);
  else if (filter !== "all") q = q.eq("status", filter);
  if (search.trim()) {
    // Escape PostgREST filter grammar; wildcards remain literal user text.
    const safe = search
      .trim()
      .replace(/[,%()*"\\]/g, " ")
      .slice(0, 100);
    q = q.or(
      `name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`,
    );
  }
  const result = await q;
  check(result);
  return { rows: result.data || [], count: result.count || 0 };
}
export async function queue(lid, offset = 0) {
  const r = await supabase
    .from("retail_tasks")
    .select("*,retail_relationships!inner(location_id,name)")
    .eq("retail_relationships.location_id", lid)
    .eq("status", "open")
    .order("due_at")
    .order("id")
    .range(offset, offset + 25);
  return check(r) || [];
}
export async function activity(rid) {
  return check(await supabase.rpc("retail_activity", { rid }));
}
export async function uploadFile(rid, file, kind, userId) {
  if (
    !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
      file.type,
    )
  )
    throw new Error("Choose a JPG, PNG, WebP or PDF file.");
  if (file.size > 10 * 1024 * 1024)
    throw new Error("Choose a file smaller than 10 MB.");
  const id = crypto.randomUUID(),
    path = `${rid}/${userId}/${id}`;
  check(
    await supabase.storage
      .from("retail-files")
      .upload(path, file, { contentType: file.type, upsert: false }),
  );
  try {
    await command("file", {
      relationship_id: rid,
      id,
      object_path: path,
      label: file.name,
      kind,
    });
  } catch (error) {
    // A lost response may follow a successful registration. Preserve the object in
    // that case; otherwise clean up the unregistered upload.
    const saved = await list("files", { id }).catch(() => null);
    if (saved?.length) return;
    if (saved) await supabase.storage.from("retail-files").remove([path]);
    throw error;
  }
}
export async function fileURL(path) {
  return check(
    await supabase.storage.from("retail-files").createSignedUrl(path, 120),
  ).signedUrl;
}

export async function queueCounts(lid) {
  return check(await supabase.rpc("retail_queue_counts", { lid }));
}

const archiveColumns = {
  consultations: "updated_at",
  plans: "published_at",
  assessments: "created_at",
  tasks: "created_at",
  notes: "created_at",
  messages: "created_at",
  checkins: "created_at",
  files: "created_at",
  deliveries: "created_at",
};
export async function historyPage(
  table,
  rid,
  { cursor = null, from = "", to = "", size = 50 } = {},
) {
  if (
    (from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) ||
    (to && !/^\d{4}-\d{2}-\d{2}$/.test(to)) ||
    (from && to && from > to)
  )
    throw new Error("Choose a valid date range.");
  size = Math.max(
    1,
    Math.min(200, Number.isFinite(size) ? Math.floor(size) : 50),
  );
  const column = archiveColumns[table];
  if (!column) throw new Error("Unsupported history category");
  let q = supabase
    .from(`retail_${table}`)
    .select("*")
    .eq("relationship_id", rid)
    .order(column, { ascending: false })
    .order("id", { ascending: false })
    .limit(size + 1);
  if (from) q = q.gte(column, `${from}T00:00:00Z`);
  if (to)
    q = q.lt(
      column,
      new Date(Date.parse(`${to}T00:00:00Z`) + 86400000).toISOString(),
    );
  if (cursor) {
    if (
      !/^[0-9a-f-]{36}$/i.test(cursor.id) ||
      !Number.isFinite(Date.parse(cursor.time))
    )
      throw new Error("Invalid history cursor");
    q = q.or(
      `${column}.lt.${cursor.time},and(${column}.eq.${cursor.time},id.lt.${cursor.id})`,
    );
  }
  const rows = check(await q) || [],
    more = rows.length > size,
    items = rows.slice(0, size),
    last = items.at(-1);
  return { items, next: more ? { id: last.id, time: last[column] } : null };
}
export async function billing(contractId, action) {
  const result = await supabase.functions.invoke("retail-billing", {
    body: { contract_id: contractId, action },
  });
  if (result.error) {
    let detail;
    try {
      detail = await result.error.context?.json();
    } catch {
      /* safe fallback */
    }
    throw new Error(detail?.error || result.error.message);
  }
  if (result.data?.error) throw new Error(result.data.error);
  return result.data;
}
export async function verifyPhone(phone, token) {
  if (token)
    return check(
      await supabase.auth.verifyOtp({ phone, token, type: "phone_change" }),
    );
  return check(await supabase.auth.updateUser({ phone }));
}

export async function operations(locationId) {
  const result = await supabase.functions.invoke("retail-health", {
    body: { location_id: locationId },
  });
  if (result.error || result.data?.error)
    throw new Error(
      result.data?.error || "Could not load store health. Please retry.",
    );
  return result.data;
}
export async function retryDelivery(id) {
  return check(await supabase.rpc("retail_retry_delivery", { did: id }));
}

export async function conversation(id) {
  return Object.fromEntries(
    await Promise.all(
      ["messages", "threads", "notifications", "read_receipts"].map(
        async (table) => [
          table,
          await list(table, { relationship_id: id }, 300),
        ],
      ),
    ),
  );
}

export async function appRecords(rid, kind, pageOffset = 0) {
  return check(
    await supabase.rpc("retail_app_records", {
      rid,
      kind,
      page_offset: pageOffset,
    }),
  );
}
export async function shareAppRecords(rid, enabled) {
  return check(
    await supabase.rpc("retail_share_app_records", { rid, enabled }),
  );
}
export async function appPhotoURL(path) {
  return check(
    await supabase.storage.from("progress-photos").createSignedUrl(path, 120),
  ).signedUrl;
}
