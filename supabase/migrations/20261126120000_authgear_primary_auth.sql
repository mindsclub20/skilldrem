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


-- Link an existing Supabase account to Authgear on first login only when both
-- identity providers assert the same verified email. This preserves the
-- existing profile, saved chats, journeys, and progress without trusting
-- browser-supplied IDs or unverified email addresses.
drop function if exists public.link_authgear_identity();

create function public.link_authgear_identity()
returns text
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  authgear_subject uuid;
  verified_email text;
  legacy_user_id uuid;
begin
  if auth.jwt() ->> 'iss' <> 'https://hazard-vaa5a1.authgear.cloud' then
    raise exception 'Untrusted identity issuer';
  end if;

  if auth.jwt() ->> 'role' <> 'authenticated' then
    raise exception 'Authenticated role required';
  end if;

  authgear_subject := (auth.jwt() ->> 'sub')::uuid;
  verified_email := lower(trim(auth.jwt() ->> 'email'));

  if exists (select 1 from public.profiles p where p.id = authgear_subject) then
    return 'already_linked';
  end if;

  if verified_email is null or verified_email = '' then
    return 'new_user';
  end if;

  select u.id
    into legacy_user_id
    from auth.users u
   where lower(u.email) = verified_email
     and u.email_confirmed_at is not null
   limit 1;

  if legacy_user_id is null or legacy_user_id = authgear_subject then
    return 'new_user';
  end if;

  -- A verified Supabase account must not be silently duplicated when the
  -- Authgear token does not also assert that its email is verified.
  if auth.jwt() ->> 'email_verified' <> 'true' then
    return 'verification_required';
  end if;

  if not exists (select 1 from public.profiles p where p.id = legacy_user_id) then
    return 'new_user';
  end if;

  update public.user_preferences
     set user_id = authgear_subject
   where user_id = legacy_user_id;

  update public.user_journeys
     set user_id = authgear_subject
   where user_id = legacy_user_id;

  update public.ai_sessions
     set user_id = authgear_subject
   where user_id = legacy_user_id;

  update public.user_milestone_progress
     set user_id = authgear_subject
   where user_id = legacy_user_id;

  update public.journeys
     set created_by = authgear_subject
   where created_by = legacy_user_id;

  update public.profiles
     set id = authgear_subject,
         email = verified_email,
         updated_at = now()
   where id = legacy_user_id;

  return 'linked';
end;
$$;

revoke all on function public.link_authgear_identity() from public, anon;
grant execute on function public.link_authgear_identity() to authenticated;

-- A user's self-service profile update must never grant admin privileges.
create or replace function public.guard_profile_admin_flag()
returns trigger
language plpgsql
set search_path = public
as $
begin
  if new.is_admin is distinct from old.is_admin
     and current_user not in ('postgres', 'service_role', 'supabase_admin') then
    raise exception 'is_admin can only be changed by a trusted administrator';
  end if;
  return new;
end;
$;

drop trigger if exists guard_profile_admin_flag on public.profiles;
create trigger guard_profile_admin_flag
before update on public.profiles
for each row execute function public.guard_profile_admin_flag();

commit;
