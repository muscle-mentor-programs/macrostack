-- Synthetic hosted-database smoke test. All writes are rolled back.
-- No external providers or object-storage uploads are invoked.
begin;
do $qa$
declare
 admin_id uuid:=gen_random_uuid(); manager_id uuid:=gen_random_uuid(); member_id uuid:=gen_random_uuid(); outsider_id uuid:=gen_random_uuid();
 person uuid; org jsonb; invite jsonb; customer jsonb; draft jsonb; rid uuid; message_id uuid:=gen_random_uuid(); rejected boolean:=false;
begin
 foreach person in array array[admin_id,manager_id,member_id,outsider_id] loop
  insert into auth.users(id,email,email_confirmed_at) values(person,'retail-qa-'||person||'@example.invalid',now());
  insert into public.profiles(id,name,role) values(person,'Synthetic retail QA','client') on conflict(id) do nothing;
 end loop;
 update public.profiles set role='superadmin' where id=admin_id;
 execute 'set local role authenticated';
 perform set_config('request.jwt.claim.sub',admin_id::text,true);
 org:=public.retail_command('provision',jsonb_build_object('name','Synthetic QA — rollback','operator_name','QA','location_name','Synthetic QA store','timezone','America/Chicago'));
 invite:=public.retail_command('invite_staff',jsonb_build_object('organization_id',org->>'organization_id','location_id',org->>'location_id','role','manager','email','retail-qa-'||manager_id||'@example.invalid'));
 perform set_config('request.jwt.claim.sub',manager_id::text,true);
 perform public.retail_command('accept_invite',jsonb_build_object('token',invite->>'token','consent',true));
 customer:=public.retail_command('prospect',jsonb_build_object('location_id',org->>'location_id','name','Synthetic customer','email','retail-qa-'||member_id||'@example.invalid','goal','Practice workflow'));
 rid:=(customer->>'relationship_id')::uuid;
 perform set_config('request.jwt.claim.sub',member_id::text,true);
 perform public.retail_command('accept_invite',jsonb_build_object('token',customer->>'token','consent',true));
 perform public.retail_command('intake',jsonb_build_object('relationship_id',rid,'answers',jsonb_build_object('goal','Practice'),'form_snapshot','[]'::jsonb));
 if not public.retail_sponsored() then raise exception 'QA: sponsorship missing';end if;
 perform set_config('request.jwt.claim.sub',manager_id::text,true);
 draft:=public.retail_command('consultation',jsonb_build_object('relationship_id',rid,'step',5,'draft',jsonb_build_object('goal','Practice goal','guidance','Practice guidance','private_note','QA_PRIVATE','checkin_date',current_date+7,'next_scan',current_date+30)));
 perform public.retail_command('publish',jsonb_build_object('relationship_id',rid,'id',draft->>'id','revision',draft->'revision'));
 perform public.retail_command('publish',jsonb_build_object('relationship_id',rid,'id',draft->>'id','revision',draft->'revision'));
 if (select count(*) from public.retail_plans where relationship_id=rid)<>1 then raise exception 'QA: publication duplicated';end if;
 perform public.retail_command('note',jsonb_build_object('relationship_id',rid,'body','QA_PRIVATE'));
 perform public.retail_command('assessment',jsonb_build_object('relationship_id',rid,'measured_on',current_date,'weight','170','unit','lbs','source','manual'));
 perform set_config('request.jwt.claim.sub',member_id::text,true);
 if exists(select 1 from public.retail_notes where relationship_id=rid) or exists(select 1 from public.retail_consultations where relationship_id=rid) then raise exception 'QA: private notes exposed';end if;
 if exists(select 1 from public.retail_plans where relationship_id=rid and content::text like '%QA_PRIVATE%') then raise exception 'QA: private draft content published';end if;
 if (select count(*) from public.retail_assessments where relationship_id=rid)<>1 then raise exception 'QA: shared assessment missing';end if;
 perform public.retail_command('message',jsonb_build_object('relationship_id',rid,'id',message_id,'body','Synthetic QA reply'));
 perform public.retail_command('message',jsonb_build_object('relationship_id',rid,'id',message_id,'body','Synthetic QA reply'));
 if (select count(*) from public.retail_messages where relationship_id=rid)<>1 then raise exception 'QA: message duplicated';end if;
 perform public.retail_command('checkin',jsonb_build_object('relationship_id',rid,'id',gen_random_uuid(),'answers',jsonb_build_object('progress','Practice')));
 perform public.retail_command('contact_preferences',jsonb_build_object('relationship_id',rid,'email_enabled',false,'sms_enabled',false));
 begin perform public.retail_operations((org->>'location_id')::uuid);exception when others then rejected:=sqlerrm like '%manager%';end;
 if not rejected then raise exception 'QA: member reached manager operations';end if;
 perform set_config('request.jwt.claim.sub',manager_id::text,true);
 if jsonb_array_length(public.retail_inbox_page((org->>'location_id')::uuid,0,'all'))<>1 then raise exception 'QA: inbox missing reply';end if;
 perform public.retail_operations((org->>'location_id')::uuid);
 if (select count(*) from public.retail_checkins where relationship_id=rid)<>1 then raise exception 'QA: staff cannot review check-in';end if;
 perform set_config('request.jwt.claim.sub',outsider_id::text,true);
 if exists(select 1 from public.retail_relationships where id=rid) or exists(select 1 from public.retail_plans where relationship_id=rid) then raise exception 'QA: unrelated account reached customer data';end if;
 execute 'reset role';
end $qa$;
rollback;
select 'PASS hosted retail workflow; all synthetic records rolled back' as result;
