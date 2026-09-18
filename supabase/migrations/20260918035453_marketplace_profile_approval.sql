begin;

alter table public.marketplace_profiles
  add column approval_status text not null default 'draft'
    check (approval_status in ('draft','pending','approved','rejected')),
  add column review_note text not null default '' check (char_length(review_note) <= 2000),
  add column reviewed_by uuid references public.profiles(id),
  add column reviewed_at timestamptz,
  add column revision integer not null default 1;

-- Existing listings also require an explicit superadmin decision.
update public.marketplace_profiles
set approval_status = case when published then 'pending' else 'draft' end;

-- All writes continue through the authenticated Edge Function. Clients cannot
-- grant themselves approval by writing directly to PostgREST.
revoke insert, update, delete on public.marketplace_profiles from public, anon, authenticated;

create or replace function public.marketplace_profile_review_guard()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.approval_status := case when new.published then 'pending' else 'draft' end;
    new.revision := 1;
    new.review_note := ''; new.reviewed_by := null; new.reviewed_at := null;
  else
    if new.coach_id is distinct from old.coach_id then
      raise exception 'Marketplace profile ownership cannot change';
    end if;
    if row(new.name,new.headline,new.bio,new.specialties,new.credentials,new.photo_url,new.cover_url,new.price_cents,new.billing_mode,new.duration_days,new.published)
      is distinct from row(old.name,old.headline,old.bio,old.specialties,old.credentials,old.photo_url,old.cover_url,old.price_cents,old.billing_mode,old.duration_days,old.published) then
      new.approval_status := case when new.published then 'pending' else 'draft' end;
      new.review_note := ''; new.reviewed_by := null; new.reviewed_at := null;
      new.revision := old.revision + 1;
    elsif row(new.approval_status,new.review_note,new.reviewed_by,new.reviewed_at)
      is distinct from row(old.approval_status,old.review_note,old.reviewed_by,old.reviewed_at) then
      new.revision := old.revision + 1;
    else
      -- Stripe readiness updates and unchanged saves retain the approval.
      new.revision := old.revision;
    end if;
  end if;
  if new.approval_status = 'approved' and
    (not new.published or new.reviewed_by is null or new.reviewed_at is null) then
    raise exception 'Approval requires a submitted profile and reviewer';
  end if;
  return new;
end;
$$;
revoke all on function public.marketplace_profile_review_guard() from public, anon, authenticated;
create trigger marketplace_profile_review_guard before insert or update on public.marketplace_profiles
for each row execute function public.marketplace_profile_review_guard();

-- Preserve the legacy directory API, exposing only approved public fields.
-- The definer lookup lives in an unexposed schema and checks authentication.
create schema if not exists private;
create or replace function private.approved_coach_directory()
returns table(id uuid,name text,bio text,specialties text,credentials text,website text,client_count bigint)
language sql stable security definer set search_path = '' as $$
  select m.coach_id,m.name,m.bio,m.specialties,m.credentials,''::text,0::bigint
  from public.marketplace_profiles m
  where (select auth.uid()) is not null and m.published and m.stripe_ready
    and m.approval_status='approved' order by m.name;
$$;
revoke all on function private.approved_coach_directory() from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.approved_coach_directory() to authenticated;
create or replace function public.get_coach_directory()
returns table(id uuid,name text,bio text,specialties text,credentials text,website text,client_count bigint)
language sql stable security invoker set search_path = '' as $$
  select * from private.approved_coach_directory();
$$;
revoke all on function public.get_coach_directory() from public,anon;
grant execute on function public.get_coach_directory() to authenticated;

commit;
