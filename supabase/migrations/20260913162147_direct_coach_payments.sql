begin;
alter table public.marketplace_orders
  add column if not exists payment_flow text not null default 'destination'
  check (payment_flow in ('destination', 'direct'));
commit;
