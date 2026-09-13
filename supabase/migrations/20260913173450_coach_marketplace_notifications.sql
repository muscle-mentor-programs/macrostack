begin;

create table public.coach_marketplace_notifications (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id),
  client_id uuid not null references public.clients(id),
  order_id uuid not null unique references public.marketplace_orders(id),
  client_name text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (coach_id, client_id)
);
create index coach_marketplace_notifications_feed_idx
  on public.coach_marketplace_notifications (coach_id, created_at desc);

alter table public.coach_marketplace_notifications enable row level security;
revoke all on public.coach_marketplace_notifications from public, anon, authenticated;
grant select on public.coach_marketplace_notifications to authenticated;
grant update (read_at) on public.coach_marketplace_notifications to authenticated;
grant all on public.coach_marketplace_notifications to service_role;

create policy "Coaches read their marketplace notifications"
  on public.coach_marketplace_notifications for select to authenticated
  using (coach_id = (select auth.uid()));
create policy "Coaches mark their marketplace notifications read"
  on public.coach_marketplace_notifications for update to authenticated
  using (coach_id = (select auth.uid()))
  with check (coach_id = (select auth.uid()));

create function public.notify_coach_marketplace_signup()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.state = 'paid' and old.state is distinct from 'paid' then
    -- Fulfillment holds the client row lock. Renewals and repeat purchases
    -- do not create a second new-client notification.
    if not exists (
      select 1 from public.marketplace_orders o
      where o.coach_id = new.coach_id and o.client_id = new.client_id
        and o.id <> new.id and o.state = 'paid'
    ) then
      insert into public.coach_marketplace_notifications
        (coach_id, client_id, order_id, client_name)
      select new.coach_id, new.client_id, new.id,
        coalesce(nullif(trim(c.name), ''), 'New client')
      from public.clients c
      where c.id = new.client_id and c.coach_id = new.coach_id
      on conflict do nothing;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.notify_coach_marketplace_signup() from public, anon, authenticated;
grant execute on function public.notify_coach_marketplace_signup() to service_role;

create trigger coach_marketplace_signup_notification
  after update of state on public.marketplace_orders
  for each row execute function public.notify_coach_marketplace_signup();

commit;
