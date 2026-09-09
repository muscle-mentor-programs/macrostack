begin;

create function public.feedback_can_access(target_forum text)
returns boolean language sql stable security invoker set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and (role = 'superadmin'
        or (role = 'coach' and target_forum = 'coach')
        or (role = 'client' and target_forum = 'user'))
  ) and target_forum in ('coach', 'user');
$$;
revoke all on function public.feedback_can_access(text) from public, anon;
grant execute on function public.feedback_can_access(text) to authenticated;

create table public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  forum text not null check (forum in ('coach', 'user')),
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('feature', 'bug')),
  title text not null check (char_length(btrim(title)) between 3 and 120),
  body text not null check (char_length(btrim(body)) between 10 and 5000),
  created_at timestamptz not null default now(),
  unique (id, forum)
);
create index feedback_submissions_forum_date on public.feedback_submissions(forum, created_at, id);
create index feedback_submissions_author on public.feedback_submissions(author_id);

create table public.feedback_votes (
  submission_id uuid not null,
  forum text not null,
  voter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  primary key (submission_id, voter_id),
  foreign key (submission_id, forum) references public.feedback_submissions(id, forum) on delete cascade
);
create index feedback_votes_forum on public.feedback_votes(forum);
create index feedback_votes_voter on public.feedback_votes(voter_id);

alter table public.feedback_submissions enable row level security;
alter table public.feedback_votes enable row level security;
revoke all on public.feedback_submissions, public.feedback_votes from public, anon, authenticated;
grant select on public.feedback_submissions, public.feedback_votes to authenticated;
grant insert (id, forum, kind, title, body) on public.feedback_submissions to authenticated;
grant insert (submission_id, forum) on public.feedback_votes to authenticated;
grant delete on public.feedback_votes to authenticated;

create policy feedback_read on public.feedback_submissions for select to authenticated
using (public.feedback_can_access(forum));
create policy feedback_submit on public.feedback_submissions for insert to authenticated
with check (author_id = (select auth.uid()) and public.feedback_can_access(forum));
create policy feedback_votes_read on public.feedback_votes for select to authenticated
using (public.feedback_can_access(forum));
create policy feedback_vote on public.feedback_votes for insert to authenticated
with check (voter_id = (select auth.uid()) and public.feedback_can_access(forum));
create policy feedback_unvote on public.feedback_votes for delete to authenticated
using (voter_id = (select auth.uid()) and public.feedback_can_access(forum));

create view public.feedback_ranked with (security_invoker = true) as
select s.id, s.forum, s.kind, s.title, s.body, s.created_at,
  s.author_id = (select auth.uid()) as is_author,
  count(v.voter_id)::integer as vote_count,
  coalesce(bool_or(v.voter_id = (select auth.uid())), false) as has_voted
from public.feedback_submissions s
left join public.feedback_votes v on v.submission_id = s.id and v.forum = s.forum
group by s.id;
revoke all on public.feedback_ranked from public, anon, authenticated;
grant select on public.feedback_ranked to authenticated;

commit;
