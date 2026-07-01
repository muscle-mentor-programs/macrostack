-- ════════════════════════════════════════════════════════════════════════════
-- AUTOMATED REMINDERS
-- Per-client opt-out + once-per-day guard, and a pg_cron job that invokes the
-- send-reminders edge function daily at 22:30 UTC (~late afternoon US).
-- ════════════════════════════════════════════════════════════════════════════

alter table public.clients
  add column if not exists reminders_enabled  boolean not null default true,
  add column if not exists reminder_last_sent date;

-- ── Schedule the daily run ────────────────────────────────────────────────────
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Re-schedule idempotently
do $$
begin
  if exists (select 1 from cron.job where jobname = 'send-daily-reminders') then
    perform cron.unschedule('send-daily-reminders');
  end if;
end $$;

select cron.schedule(
  'send-daily-reminders',
  '30 22 * * *',   -- 22:30 UTC daily
  $$
  select net.http_post(
    url     := 'https://ryvsbidtwhxfmashwsqt.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dnNiaWR0d2h4Zm1hc2h3c3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNzE5ODIsImV4cCI6MjA5MzY0Nzk4Mn0.fsqJFT9q-EJdfbRlCiZ4guT_HU5vmS728kUQxCS0PNw'
    ),
    body    := '{}'::jsonb
  );
  $$
);
