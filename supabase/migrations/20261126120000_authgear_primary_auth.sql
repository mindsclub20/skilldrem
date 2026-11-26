-- Move application identity from Supabase Auth to Authgear.
-- Authgear's documented user subject (sub) is a UUID, so the existing UUID
-- ownership columns and auth.uid()-based policies can remain in place.
-- Supabase Auth remains enabled by the platform, but is no longer the login provider.

begin;

-- Third-party Authgear users do not have rows in auth.users. Remove only the
-- foreign keys to auth.users; keep UUID columns, data, and all other relations.
alter table public.profiles
  drop constraint if exists profiles_id_fkey;

alter table public.user_preferences
  drop constraint if exists user_preferences_user_id_fkey;

alter table public.user_journeys
  drop constraint if exists user_journeys_user_id_fkey;

alter table public.ai_sessions
  drop constraint if exists ai_sessions_user_id_fkey;

alter table public.user_milestone_progress
  drop constraint if exists user_milestone_progress_user_id_fkey;

alter table public.journeys
  drop constraint if exists journeys_created_by_fkey;

-- Published learning content remains publicly readable. Private ownership
-- checks continue to use auth.uid(), which reads the UUID Authgear sub claim.
drop policy if exists journeys_read_published_or_owned on public.journeys;
create policy journeys_read_published_or_owned
  on public.journeys
  for select
  to anon, authenticated
  using (is_published or created_by = (select auth.uid()));

drop policy if exists milestones_read_accessible_journey on public.milestones;
create policy milestones_read_accessible_journey
  on public.milestones
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.journeys j
      where j.id = milestones.journey_id
        and (j.is_published or j.created_by = (select auth.uid()))
    )
  );

drop policy if exists resources_read_published on public.resources;
create policy resources_read_published
  on public.resources
  for select
  to anon, authenticated
  using (is_published);

commit;
