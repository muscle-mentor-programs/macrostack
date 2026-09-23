begin;
-- These read-only RPCs already check the caller's team/resource scope and
-- query tables with matching RLS policies. They do not need elevated rights.
alter function public.retail_team_impact(uuid) security invoker;
alter function public.retail_resource_review_queue(uuid) security invoker;
commit;
