import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
const {PGlite}=createRequire(import.meta.url)(process.env.PGLITE_MODULE || '@electric-sql/pglite')
const db=new PGlite()
const coach='11111111-1111-4111-8111-111111111111',admin='22222222-2222-4222-8222-222222222222'
try {
 await db.exec(`create role anon;create role authenticated;create role service_role;
 create schema auth;create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth,public to authenticated;grant execute on function auth.uid() to authenticated;
 create table public.profiles(id uuid primary key,role text);
 insert into profiles values('${coach}','coach'),('${admin}','superadmin');`)
 const original=readFileSync('supabase/migrations/20260909143652_coach_marketplace_payments.sql','utf8')
 await db.exec(original.slice(original.indexOf('create table public.marketplace_profiles'),original.indexOf('create table public.marketplace_orders')))
 await db.exec(`alter table marketplace_profiles add column cover_url text not null default '';
 alter table marketplace_profiles enable row level security;
 grant select on marketplace_profiles to authenticated;
 create policy owner on marketplace_profiles for select to authenticated using(coach_id=auth.uid());
 insert into marketplace_profiles(coach_id,name,headline,bio,price_cents,billing_mode,published,stripe_ready) values('${coach}','Test coach','Test coaching','A complete coaching package description',10000,'monthly',true,true);`)
 await db.exec(readFileSync('supabase/migrations/20260918035453_marketplace_profile_approval.sql','utf8'))
 const row=async()=> (await db.query('select * from marketplace_profiles')).rows[0]
 assert.equal((await row()).approval_status,'pending','Existing listings need approval')
 await db.exec(`set request.jwt.claim.sub='${coach}';set role authenticated;`)
 assert.equal((await db.query('select * from public.get_coach_directory()')).rows.length,0)
 await assert.rejects(()=>db.exec("update marketplace_profiles set approval_status='approved'"),/permission denied/)
 await db.exec('reset role')
 await db.exec(`update marketplace_profiles set approval_status='approved',reviewed_by='${admin}',reviewed_at=now() where revision=1`)
 assert.equal((await row()).revision,2)
 await db.exec('set role authenticated')
 assert.equal((await db.query('select * from public.get_coach_directory()')).rows.length,1)
 await db.exec('reset role')
 await db.exec("update marketplace_profiles set stripe_ready=false")
 assert.equal((await row()).approval_status,'approved');assert.equal((await row()).revision,2)
 assert.equal((await db.query('select * from public.get_coach_directory()')).rows.length,0)
 await db.exec("update marketplace_profiles set bio='Changed coaching package requiring another review',stripe_ready=true")
 assert.equal((await row()).approval_status,'pending');assert.equal((await row()).reviewed_by,null);assert.equal((await row()).revision,3)
 const stale=await db.query(`update marketplace_profiles set approval_status='approved',reviewed_by='${admin}',reviewed_at=now() where revision=2 returning *`)
 assert.equal(stale.rows.length,0,'Stale review cannot approve edited profile')
 await db.exec(`update marketplace_profiles set approval_status='approved',reviewed_by='${admin}',reviewed_at=now() where revision=3`)
 await db.exec("update marketplace_profiles set published=false")
 assert.equal((await row()).approval_status,'draft')
 await db.exec("update marketplace_profiles set published=true")
 assert.equal((await row()).approval_status,'pending','Republishing requires approval')
 await db.exec(`update marketplace_profiles set approval_status='rejected',reviewed_by='${admin}',reviewed_at=now(),review_note='Clarify your credentials'`)
 assert.equal((await db.query('select * from public.get_coach_directory()')).rows.length,0)
 await db.exec(`set request.jwt.claim.sub='';`)
 assert.equal((await db.query('select * from private.approved_coach_directory()')).rows.length,0)
 await db.exec('set role anon')
 await assert.rejects(()=>db.query('select * from public.get_coach_directory()'),/permission denied/)
 console.log('PASS approval migration: existing listings, direct-write denial, approved directory, edit resets, stale decisions, Stripe updates, withdrawal and republishing')
} finally {await db.close()}
