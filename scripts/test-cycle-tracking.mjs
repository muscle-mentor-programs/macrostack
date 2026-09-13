import { PGlite } from '../outputs/notification-qa/node_modules/@electric-sql/pglite/dist/index.js'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { validatePeriod, isPeriodDay } from '../src/lib/cycleTracking.js'

const owner = '00000000-0000-0000-0000-000000000001'
const other = '00000000-0000-0000-0000-000000000002'
const period = { start_date: '2026-09-01', end_date: '2026-09-05', symptoms: ['Bloating'], notes: '' }
assert.equal(validatePeriod(period, [], '2026-09-13'), '')
assert.ok(validatePeriod({ ...period, end_date: '2026-08-31' }, [], '2026-09-13'))
assert.ok(validatePeriod({ ...period, end_date: '2026-09-14' }, [], '2026-09-13'))
assert.ok(validatePeriod({ ...period, start_date: '2026-02-30' }, [], '2026-09-13'))
assert.ok(validatePeriod(period, [{ ...period, id: 'old' }], '2026-09-13'))
assert.equal(validatePeriod({ ...period, id: 'old' }, [{ ...period, id: 'old' }], '2026-09-13'), '')
assert.equal(isPeriodDay('2026-09-01', [period]), true)
assert.equal(isPeriodDay('2026-09-05', [period]), true)
assert.equal(isPeriodDay('2026-09-06', [period]), false)
const db = new PGlite()
try {
  await db.exec(`create role anon; create role authenticated;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema public,auth to authenticated,anon;
    create table public.profiles(id uuid primary key);
    insert into public.profiles values('${owner}'),('${other}');`)
  await db.exec(readFileSync(new URL('../supabase/migrations/20260913205812_cycle_tracking.sql', import.meta.url), 'utf8'))
  await db.exec(`set role authenticated; set request.jwt.claim.sub='${owner}';
    insert into cycle_tracking_settings values('${owner}',true);
    insert into cycle_periods(user_id,start_date,end_date) values('${owner}','2026-09-01','2026-09-05');`)
  assert.equal((await db.query('select * from cycle_periods')).rows.length, 1)
  await db.exec(`update cycle_tracking_settings set enabled=false;`)
  assert.equal((await db.query('select * from cycle_periods')).rows.length, 1)
  await db.exec(`update cycle_periods set notes='Private',end_date='2026-09-06';`)
  assert.equal((await db.query('select notes from cycle_periods')).rows[0].notes, 'Private')
  await assert.rejects(db.exec(`update cycle_periods set user_id='${other}';`), /row-level security/)
  await assert.rejects(db.exec(`update cycle_periods set end_date='2026-08-31';`), /check constraint/)
  await db.exec(`set request.jwt.claim.sub='${other}';`)
  assert.equal((await db.query('select * from cycle_periods')).rows.length, 0)
  assert.equal((await db.query('select * from cycle_tracking_settings')).rows.length, 0)
  assert.equal((await db.query('update cycle_periods set notes=\'forged\' returning id')).rows.length, 0)
  assert.equal((await db.query('delete from cycle_periods returning id')).rows.length, 0)
  await assert.rejects(db.exec(`insert into cycle_periods(user_id,start_date,end_date) values('${owner}','2026-08-01','2026-08-02');`), /row-level security/)
  await db.exec(`reset role; set role anon;`)
  await assert.rejects(db.query('select * from cycle_periods'), /permission denied/)
  await db.exec(`reset role; set role authenticated; set request.jwt.claim.sub='${owner}'; delete from cycle_tracking_settings;`)
  assert.equal((await db.query('select * from cycle_periods')).rows.length, 0)
  console.log('21 cycle checks passed: validation, chart dates, owner CRUD, disabled retention, isolation, anonymous denial and deletion cascade.')
} finally { await db.close() }
