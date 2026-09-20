import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
const {PGlite}=createRequire(import.meta.url)(process.env.PGLITE_MODULE||'@electric-sql/pglite')
const db=new PGlite()
const member='11111111-1111-4111-8111-111111111111',coach='22222222-2222-4222-8222-222222222222',admin='33333333-3333-4333-8333-333333333333',other='44444444-4444-4444-8444-444444444444'
const client='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',foreign='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
try {
 await db.exec(`create role authenticated;create role anon;create schema auth;create schema storage;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table public.profiles(id uuid,role text);create table public.clients(id uuid,name text,profile_id uuid,coach_id uuid);
 create table storage.objects(bucket_id text,name text);alter table storage.objects enable row level security;
 grant usage on schema storage,auth,public to authenticated,anon;grant select on public.clients,public.profiles to authenticated,anon;grant all on storage.objects to authenticated,anon;
 insert into profiles values('${member}','client'),('${coach}','coach'),('${admin}','superadmin'),('${other}','client');
 insert into clients values('${client}','Normal Client Name','${member}','${coach}'),('${foreign}','Other Name','${other}',null);`)
 const original=readFileSync('supabase/migrations/20260904172403_security_hardening.sql','utf8')
 const start=original.indexOf('create policy "progress photos scoped access"')
 const end=original.indexOf('\n);',original.indexOf('create policy "chat attachments scoped access"'))+4
 await db.exec(original.slice(start,end))
 const as=async(id,role='authenticated')=>db.exec(`reset role;set request.jwt.claim.sub='${id}';set role ${role};`)
 await as(member)
 await assert.rejects(()=>db.exec(`insert into storage.objects values('progress-photos','clients/${client}/before.jpg')`),/row-level security/)
 await db.exec('reset role')
 await db.exec(readFileSync('supabase/migrations/20260920192019_fix_storage_object_path_scope.sql','utf8'))
 for(const bucket of ['progress-photos','chat-attachments']){
  const path=id=>bucket==='progress-photos'?`clients/${id}/test.jpg`:`${id}/test.jpg`
  for(const identity of [member,coach,admin]){
   await as(identity)
   await db.exec(`insert into storage.objects values('${bucket}','${path(client)}')`)
   assert.equal((await db.query(`select * from storage.objects where bucket_id='${bucket}'`)).rows.length,1)
   await db.exec(`update storage.objects set name=name||'.updated' where bucket_id='${bucket}'`)
   assert.equal((await db.query(`delete from storage.objects where bucket_id='${bucket}' returning *`)).rows.length,1)
  }
  await as(member)
  await assert.rejects(()=>db.exec(`insert into storage.objects values('${bucket}','${path(foreign)}')`),/row-level security/)
  await as(admin);await db.exec(`insert into storage.objects values('${bucket}','${path(foreign)}')`)
  await as(member);assert.equal((await db.query(`select * from storage.objects where bucket_id='${bucket}'`)).rows.length,0)
  assert.equal((await db.query(`delete from storage.objects where bucket_id='${bucket}' returning *`)).rows.length,0)
  await as('', 'anon');await assert.rejects(()=>db.exec(`insert into storage.objects values('${bucket}','${path(client)}')`),/row-level security/)
  await as(admin);await db.exec(`delete from storage.objects where bucket_id='${bucket}'`)
  console.log(`PASS ${bucket}: original failure reproduced; owner/coach/admin CRUD works; unrelated and anonymous access denied`)
 }
}finally{await db.close()}
