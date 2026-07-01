-- ════════════════════════════════════════════════════════════════════════════
-- CUSTOMIZABLE WEEKLY CHECK-INS
-- Coaches build their own check-in form (add/remove/edit questions). Each
-- submitted check-in stores a snapshot of the questions + answers, so history
-- survives later edits to the form. Also adds reviewed-tracking so coaches
-- can see which check-ins are new.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Coach question sets ───────────────────────────────────────────────────────
create table if not exists public.checkin_questions (
  id         uuid primary key default gen_random_uuid(),
  coach_id   uuid not null references public.profiles(id) on delete cascade,
  label      text not null,
  type       text not null default 'scale' check (type in ('scale', 'yesno', 'text')),
  low_label  text default '',
  high_label text default '',
  slug       text,               -- 'adherence' | 'hunger' | 'energy' | null (ties to legacy columns)
  sort_order int  not null default 0,
  created_at timestamptz default now()
);

alter table public.checkin_questions enable row level security;

do $$
begin
  -- Coaches manage their own question set
  if not exists (select 1 from pg_policies where policyname = 'checkin_questions_coach' and tablename = 'checkin_questions') then
    create policy "checkin_questions_coach" on public.checkin_questions for all
      using (coach_id = auth.uid()
             or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'))
      with check (coach_id = auth.uid()
             or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));
  end if;

  -- Clients can read their own coach's questions (to render the form)
  if not exists (select 1 from pg_policies where policyname = 'checkin_questions_client_read' and tablename = 'checkin_questions') then
    create policy "checkin_questions_client_read" on public.checkin_questions for select
      using (exists (
        select 1 from public.clients c
        where c.profile_id = auth.uid()
          and c.coach_id = checkin_questions.coach_id
      ));
  end if;
end $$;

create index if not exists idx_checkin_questions_coach
  on public.checkin_questions(coach_id, sort_order);

-- ── Check-in answers snapshot + reviewed tracking ─────────────────────────────
alter table public.checkins
  add column if not exists answers  jsonb   not null default '[]',
  add column if not exists reviewed boolean not null default false;

-- Existing check-ins were already handled — only new ones should show as NEW
update public.checkins set reviewed = true where reviewed = false;
