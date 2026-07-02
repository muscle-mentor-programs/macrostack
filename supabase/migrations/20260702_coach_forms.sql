-- ════════════════════════════════════════════════════════════════════════════
-- COACH FORMS
-- Coaches build forms that are auto-sent to clients in-app:
--   • kind 'intro'  — intake questionnaire, shown to every client until they
--                     submit it once (one intro form per coach)
--   • kind 'custom' — extra forms, shown until submitted once
--   • kind 'weekly' — settings row for the weekly check-in (questions live in
--                     checkin_questions; this row holds allow_photos etc.)
-- Submissions snapshot the questions + answers. Weekly check-ins additionally
-- get photo attachments (photo_urls) that also land in the client's
-- progress-photo timeline.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.coach_forms (
  id           uuid primary key default gen_random_uuid(),
  coach_id     uuid not null references public.profiles(id) on delete cascade,
  kind         text not null default 'custom' check (kind in ('intro', 'custom', 'weekly')),
  title        text not null default '',
  description  text not null default '',
  questions    jsonb not null default '[]',
  allow_photos boolean not null default false,
  active       boolean not null default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- One intro form and one weekly settings row per coach
create unique index if not exists uniq_coach_intro_form
  on public.coach_forms(coach_id) where (kind = 'intro');
create unique index if not exists uniq_coach_weekly_form
  on public.coach_forms(coach_id) where (kind = 'weekly');
create index if not exists idx_coach_forms_coach on public.coach_forms(coach_id, created_at);

alter table public.coach_forms enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'coach_forms_coach' and tablename = 'coach_forms') then
    create policy "coach_forms_coach" on public.coach_forms for all
      using (coach_id = auth.uid()
             or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'))
      with check (coach_id = auth.uid()
             or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));
  end if;

  -- Clients can read their own coach's forms (to render them)
  if not exists (select 1 from pg_policies where policyname = 'coach_forms_client_read' and tablename = 'coach_forms') then
    create policy "coach_forms_client_read" on public.coach_forms for select
      using (exists (
        select 1 from public.clients c
        where c.profile_id = auth.uid()
          and c.coach_id = coach_forms.coach_id
      ));
  end if;
end $$;

-- ── Submissions ───────────────────────────────────────────────────────────────
create table if not exists public.form_submissions (
  id         uuid primary key default gen_random_uuid(),
  form_id    uuid not null references public.coach_forms(id) on delete cascade,
  client_id  uuid not null references public.clients(id) on delete cascade,
  form_kind  text not null default 'custom',
  form_title text not null default '',
  answers    jsonb not null default '[]',
  photo_urls jsonb not null default '[]',
  reviewed   boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists idx_form_submissions_client on public.form_submissions(client_id, created_at desc);

alter table public.form_submissions enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'form_submissions_access' and tablename = 'form_submissions') then
    create policy "form_submissions_access" on public.form_submissions for all
      using (
        exists (
          select 1 from public.clients c
          where c.id = form_submissions.client_id
            and (c.coach_id = auth.uid() or c.profile_id = auth.uid())
        )
        or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
      )
      with check (
        exists (
          select 1 from public.clients c
          where c.id = form_submissions.client_id
            and (c.coach_id = auth.uid() or c.profile_id = auth.uid())
        )
        or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
      );
  end if;
end $$;

-- ── Weekly check-ins: photo attachments ──────────────────────────────────────
alter table public.checkins
  add column if not exists photo_urls jsonb not null default '[]';
