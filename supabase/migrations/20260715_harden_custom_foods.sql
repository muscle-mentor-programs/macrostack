-- Harden the shared community food pool.
-- Before: any signed-in user could insert ANY row — including source='deleted'
-- markers (hide built-in foods for everyone) and source='override' rows
-- (rewrite built-in macros for everyone).
-- After: normal users may only contribute 'custom'/'scanned' rows tagged with
-- their own id, and may update/delete only their own contributions.
-- The existing superadmin-manages-all policy is untouched.

drop policy if exists "Clients insert scanned foods" on custom_foods;

create policy "Users insert own community foods"
  on custom_foods for insert
  with check (
    auth.uid() is not null
    and source in ('custom', 'scanned')
    and (added_by is null or added_by = auth.uid())
  );

create policy "Users update own community foods"
  on custom_foods for update
  using (added_by = auth.uid())
  with check (source in ('custom', 'scanned'));

create policy "Users delete own community foods"
  on custom_foods for delete
  using (added_by = auth.uid());
