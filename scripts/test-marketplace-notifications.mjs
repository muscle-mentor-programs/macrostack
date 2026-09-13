// Isolated PostgreSQL tests. Test-only runtime (not an app dependency):
// npm install --prefix outputs/notification-qa --no-save --no-package-lock @electric-sql/pglite
import { PGlite } from '../outputs/notification-qa/node_modules/@electric-sql/pglite/dist/index.js'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const db = new PGlite()
const coach = '00000000-0000-0000-0000-000000000001'
const other = '00000000-0000-0000-0000-000000000002'
const client = '00000000-0000-0000-0000-000000000003'
const order = '00000000-0000-0000-0000-000000000004'
const renewal = '00000000-0000-0000-0000-000000000005'
let checks = 0
async function count(expected) {
  const result = await db.query('select count(*)::int as n from public.coach_marketplace_notifications')
  assert.equal(result.rows[0].n, expected); checks++
}
try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema public,auth to authenticated,anon,service_role;
    grant execute on function auth.uid() to authenticated;
    create table public.profiles(id uuid primary key);
    create table public.clients(id uuid primary key, coach_id uuid, name text);
    create table public.marketplace_orders(id uuid primary key, coach_id uuid, client_id uuid, state text);
    grant all on public.profiles,public.clients,public.marketplace_orders to service_role;
    insert into public.profiles values ('${coach}'),('${other}');
    insert into public.clients values ('${client}','${coach}','Test Client');
    insert into public.marketplace_orders values ('${order}','${coach}','${client}','pending');
  `)
  await db.exec(readFileSync(new URL('../supabase/migrations/20260913173450_coach_marketplace_notifications.sql', import.meta.url), 'utf8'))
  await count(0) // no historical/backfill alerts
  await db.exec(`set role service_role; update public.marketplace_orders set state='expired' where id='${order}';`)
  await count(0) // no abandoned checkout alerts
  await db.exec(`begin; update public.marketplace_orders set state='paid' where id='${order}'; rollback;`)
  await count(0) // payment rollback rolls back notification too
  await db.exec(`update public.marketplace_orders set state='paid' where id='${order}';`)
  await count(1)
  await db.exec(`update public.marketplace_orders set state='paid' where id='${order}';`)
  await count(1) // webhook retry
  await db.exec(`insert into public.marketplace_orders values ('${renewal}','${coach}','${client}','pending');
    update public.marketplace_orders set state='paid' where id='${renewal}';`)
  await count(1) // renewal is not a new client
  await db.exec(`reset role; set role authenticated; set request.jwt.claim.sub='${other}';`)
  await count(0) // other coach cannot see alert
  const deniedUpdate = await db.query('update public.coach_marketplace_notifications set read_at=now() returning id')
  assert.equal(deniedUpdate.rows.length, 0); checks++
  await db.exec(`set request.jwt.claim.sub='${coach}';`)
  await count(1)
  const read = await db.query('update public.coach_marketplace_notifications set read_at=now() returning id')
  assert.equal(read.rows.length, 1); checks++
  await assert.rejects(db.exec("update public.coach_marketplace_notifications set client_name='Forged'"), /permission denied/); checks++
  await assert.rejects(db.exec(`insert into public.coach_marketplace_notifications(coach_id,client_id,order_id,client_name)
    values('${coach}','${client}','${renewal}','Forged')`), /permission denied/); checks++
  await db.exec('reset role; set role anon;')
  await assert.rejects(db.query('select * from public.coach_marketplace_notifications'), /permission denied/); checks++
  console.log(`${checks} notification database checks passed: first payment, retry, renewal, rollback, ownership and write protection.`)
} finally { await db.close() }
