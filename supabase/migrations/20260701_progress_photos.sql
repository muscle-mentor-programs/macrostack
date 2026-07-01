-- ════════════════════════════════════════════════════════════════════════════
-- PROGRESS PHOTOS
-- Clients upload progress photos over time; they and their coach see a
-- timeline. Files live in the public 'progress-photos' storage bucket and
-- each row records one photo.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.progress_photos (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients(id) on delete cascade,
  url        text not null,
  path       text not null,          -- storage object path (for deletes)
  note       text default '',
  taken_at   date default current_date,
  created_at timestamptz default now()
);

alter table public.progress_photos enable row level security;

-- Accessible to the client (their own) and their coach; superadmin sees all.
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'progress_photos_access' and tablename = 'progress_photos') then
    create policy "progress_photos_access" on public.progress_photos for all
      using (
        exists (
          select 1 from public.clients c
          where c.id = progress_photos.client_id
            and (c.coach_id = auth.uid() or c.profile_id = auth.uid())
        )
        or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
      )
      with check (
        exists (
          select 1 from public.clients c
          where c.id = progress_photos.client_id
            and (c.coach_id = auth.uid() or c.profile_id = auth.uid())
        )
        or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
      );
  end if;
end $$;

create index if not exists idx_progress_photos_client
  on public.progress_photos(client_id, taken_at desc);

-- ── Storage bucket (public read, 10 MB, images only) ─────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'progress-photos',
  'progress-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Progress photos upload' and tablename = 'objects') then
    create policy "Progress photos upload"
      on storage.objects for insert to authenticated
      with check (bucket_id = 'progress-photos');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Progress photos delete' and tablename = 'objects') then
    create policy "Progress photos delete"
      on storage.objects for delete to authenticated
      using (bucket_id = 'progress-photos');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Progress photos public read' and tablename = 'objects') then
    create policy "Progress photos public read"
      on storage.objects for select to public
      using (bucket_id = 'progress-photos');
  end if;
end $$;
