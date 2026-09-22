import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const { PGlite } = createRequire(import.meta.url)(process.env.PGLITE_MODULE || '@electric-sql/pglite')
const db = new PGlite()
const coach = '11111111-1111-4111-8111-111111111111'
const first = '22222222-2222-4222-8222-222222222222', second = '33333333-3333-4333-8333-333333333333'
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create table profiles(id uuid primary key);
    insert into profiles values('${coach}');
    create table marketplace_profiles(coach_id uuid primary key, stripe_ready boolean);
    create table coach_billing(coach_id uuid primary key, connect_ready boolean, subscription_id text);
    insert into marketplace_profiles values('${coach}',true);
    insert into coach_billing values('${coach}',true,'preserved');`)
  await db.exec(readFileSync('supabase/migrations/20260913160540_stripe_existing_account_connections.sql', 'utf8'))
  await db.exec(readFileSync('supabase/migrations/20260922174015_coach_stripe_unlink.sql', 'utf8'))
  await db.exec(`grant select,update on marketplace_profiles,coach_billing to service_role;
    insert into coach_stripe_connections(coach_id,stripe_account_id,livemode,charges_enabled,payouts_enabled) values('${coach}','acct_test',true,true,true);
    insert into stripe_connect_oauth_states(state_hash,coach_id) values(repeat('a',64),'${coach}');`)
  for (const role of ['anon', 'authenticated']) {
    await db.exec(`set role ${role}`)
    await assert.rejects(db.query(`select acquire_coach_stripe_lock('${coach}','${first}')`), /permission denied/)
    await assert.rejects(db.query('select * from coach_stripe_operation_locks'), /permission denied/)
    await db.exec('reset role')
  }
  await db.exec('set role service_role')
  const acquire = async token => (await db.query(`select acquire_coach_stripe_lock('${coach}','${token}') as ok`)).rows[0].ok
  assert.equal(await acquire(first), true)
  assert.equal(await acquire(second), false)
  await db.exec(`delete from coach_stripe_operation_locks where coach_id='${coach}' and token='${second}'`)
  assert.equal(await acquire(second), false, 'Another request cannot release the lease')
  await db.exec(`delete from coach_stripe_operation_locks where coach_id='${coach}' and token='${first}'`)
  assert.equal(await acquire(second), true)
  await db.exec(`update coach_stripe_connections set disconnect_pending=true where coach_id='${coach}'`)
  assert.equal((await db.query('select stripe_ready from marketplace_profiles')).rows[0].stripe_ready, false)
  const billing = (await db.query('select * from coach_billing')).rows[0]
  assert.equal(billing.connect_ready, false); assert.equal(billing.subscription_id, 'preserved')
  assert.ok((await db.query('select consumed_at from stripe_connect_oauth_states')).rows[0].consumed_at)
  await db.exec(`update coach_stripe_connections set charges_enabled=true,payouts_enabled=true where coach_id='${coach}'`)
  assert.equal((await db.query('select charges_enabled from coach_stripe_connections')).rows[0].charges_enabled, false)
  await db.exec(`update coach_stripe_connections set disconnected_at=now(),disconnect_pending=false where coach_id='${coach}'`)
  assert.equal((await db.query('select stripe_account_id from coach_stripe_connections')).rows[0].stripe_account_id, 'acct_test')
  console.log('PASS unlink migration: scoped leases, role restrictions, atomic eligibility cleanup, OAuth invalidation, billing/history preservation')
} finally { await db.close() }
