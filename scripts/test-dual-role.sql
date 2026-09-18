begin;
do $$
declare uid uuid := gen_random_uuid(); cid uuid; original_count int; p public.profiles; code text;
begin
 insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data) values(uid,'dual-role-test-'||uid||'@example.invalid','{"name":"Dual Role Test"}','{}');
 select id into cid from public.clients where profile_id=uid;
 if cid is null then raise exception 'Member fixture missing'; end if;
 update public.profiles set subscription_status='active',subscription_plan='annual',stripe_subscription_id='sub_test_member',stripe_customer_id='cus_test' where id=uid;
 perform set_config('request.jwt.claim.sub',uid::text,true);
 execute 'set local role authenticated';
 perform public.activate_coach_workspace();
 perform public.activate_coach_workspace();
 select * into p from public.get_my_account();
 if p.role <> 'coach' or not p.dual_role or p.coach_code is null then raise exception 'Activation failed'; end if;
 if p.subscription_status <> 'inactive' or p.stripe_subscription_id is not null or p.admin_override is not null then raise exception 'Coach inherited paid access'; end if;
 if p.member_subscription->>'subscription_status' <> 'active' or p.member_subscription->>'stripe_subscription_id' <> 'sub_test_member' then raise exception 'Member subscription lost'; end if;
 if not public.member_weight_access() then raise exception 'Paid member access lost'; end if;
 code := p.coach_code;
 begin
   update public.profiles set dual_role=false where id=uid;
   raise exception 'Protected field was writable';
 exception when insufficient_privilege then null;
 end;
 execute 'reset role';
 if (select count(*) from public.clients where profile_id=uid) <> 1 or not exists(select 1 from public.clients where id=cid and profile_id=uid) then raise exception 'Member record changed'; end if;
 perform public.sync_account_subscription(uid,'sub_test_coach','cus_test','active','t_2_10',null,'coach');
 perform public.sync_account_subscription(uid,'sub_test_member','cus_test','canceled','annual',null,'user');
 select * into p from public.profiles where id=uid;
 if p.subscription_plan <> 't_2_10' or p.subscription_status <> 'active' then raise exception 'Member event overwrote coach'; end if;
 if public.member_weight_access() then raise exception 'Coach paid plan bypasses member Pro'; end if;
 perform public.sync_account_subscription(uid,'sub_test_member','cus_test','active','annual',null,null);
 if not public.member_weight_access() then raise exception 'Legacy member webhook routing failed'; end if;
 if (select coach_code from public.profiles where id=uid) <> code then raise exception 'Coach code changed'; end if;
 perform set_config('request.jwt.claim.sub','',true);
 begin
   perform public.activate_coach_workspace();
   raise exception 'Unauthenticated activation succeeded';
 exception when others then
   if sqlerrm <> 'Sign in required' then raise; end if;
 end;
end $$;
rollback;
