-- Move application identity from Supabase Auth to Authgear.
-- Authgear's documented user subject (sub) is a UUID, so the existing UUID
-- ownership columns and auth.uid()-based policies can remain in place.
-- Supabase Auth remains enabled by the platform, but is no longer the login provider.

begin;

-- Anonymous requests currently inherit broad grants from the anon role.
-- RLS does not protect TRUNCATE and REFERENCES, so remove all table-level
-- anonymous privileges before restoring only the public catalogue projections.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- Prevent the observed public-schema object owners from reintroducing anon
-- grants on future tables, sequences, and functions.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon;

-- New public functions must explicitly revoke PUBLIC and anon execution.
-- The global PUBLIC default is intentionally not changed here because that
-- would alter default function access across every schema, not just public.

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

-- Keep owner-aware reads authenticated-only. Anonymous catalogue policies
-- are separate and check only published status, avoiding owner-column access.
drop policy if exists journeys_read_published_or_owned on public.journeys;
create policy journeys_read_published_or_owned
  on public.journeys
  for select
  to authenticated
  using (is_published or created_by = (select auth.uid()));

drop policy if exists journeys_public_read_published on public.journeys;
create policy journeys_public_read_published
  on public.journeys
  for select
  to anon
  using (is_published = true);

drop policy if exists milestones_read_accessible_journey on public.milestones;
create policy milestones_read_accessible_journey
  on public.milestones
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.journeys j
      where j.id = milestones.journey_id
        and (j.is_published or j.created_by = (select auth.uid()))
    )
  );

drop policy if exists milestones_public_read_published on public.milestones;
create policy milestones_public_read_published
  on public.milestones
  for select
  to anon
  using (
    exists (
      select 1
      from public.journeys j
      where j.id = milestones.journey_id
        and j.is_published = true
    )
  );

-- PR #9 may have created this older policy name. Remove it before
-- installing the shared policy so either migration order leaves one policy.
drop policy if exists resources_public_read_published on public.resources;
drop policy if exists resources_read_published on public.resources;
create policy resources_read_published
  on public.resources
  for select
  to anon, authenticated
  using (is_published);


-- Restrict authenticated access to the exact Authgear issuer and app.
-- This prevents legacy Supabase Auth JWTs from continuing to access user data.
create policy authgear_only_profiles
  on public.profiles as restrictive for all to authenticated
  using (
    (select auth.jwt() ->> 'iss') = 'https://hazard-vaa5a1.authgear.cloud'
    and (select auth.jwt() ->> 'client_id') = '2b273d19926b6daa'
    and (select auth.jwt() ->> 'https://authgear.com/claims/user/is_verified') = 'true'
  )
  with check (
    (select auth.jwt() ->> 'iss') = 'https://hazard-vaa5a1.authgear.cloud'
    and (select auth.jwt() ->> 'client_id') = '2b273d19926b6daa'
    and (select auth.jwt() ->> 'https://authgear.com/claims/user/is_verified') = 'true'
  );

create policy authgear_only_user_preferences
  on public.user_preferences as restrictive for all to authenticated
  using (
    (select auth.jwt() ->> 'iss') = 'https://hazard-vaa5a1.authgear.cloud'
    and (select auth.jwt() ->> 'client_id') = '2b273d19926b6daa'
    and (select auth.jwt() ->> 'https://authgear.com/claims/user/is_verified') = 'true'
  )
  with check (
    (select auth.jwt() ->> 'iss') = 'https://hazard-vaa5a1.authgear.cloud'
    and (select auth.jwt() ->> 'client_id') = '2b273d19926b6daa'
    and (select auth.jwt() ->> 'https://authgear.com/claims/user/is_verified') = 'true'
  );

create policy authgear_only_user_journeys
  on public.user_journeys as restrictive for all to authenticated
  using (
    (select auth.jwt() ->> 'iss') = 'https://hazard-vaa5a1.authgear.cloud'
    and (select auth.jwt() ->> 'client_id') = '2b273d19926b6daa'
    and (select auth.jwt() ->> 'https://authgear.com/claims/user/is_verified') = 'true'
  )
  with check (
    (select auth.jwt() ->> 'iss') = 'https://hazard-vaa5a1.authgear.cloud'
    and (select auth.jwt() ->> 'client_id') = '2b273d19926b6daa'
    and (select auth.jwt() ->> 'https://authgear.com/claims/user/is_verified') = 'true'
  );

create policy authgear_only_ai_sessions
  on public.ai_sessions as restrictive for all to authenticated
  using (
    (select auth.jwt() ->> 'iss') = 'https://hazard-vaa5a1.authgear.cloud'
    and (select auth.jwt() ->> 'client_id') = '2b273d19926b6daa'
    and (select auth.jwt() ->> 'https://authgear.com/claims/user/is_verified') = 'true'
  )
  with check (
    (select auth.jwt() ->> 'iss') = 'https://hazard-vaa5a1.authgear.cloud'
    and (select auth.jwt() ->> 'client_id') = '2b273d19926b6daa'
    and (select auth.jwt() ->> 'https://authgear.com/claims/user/is_verified') = 'true'
  );

create policy authgear_only_user_milestone_progress
  on public.user_milestone_progress as restrictive for all to authenticated
  using (
    (select auth.jwt() ->> 'iss') = 'https://hazard-vaa5a1.authgear.cloud'
    and (select auth.jwt() ->> 'client_id') = '2b273d19926b6daa'
    and (select auth.jwt() ->> 'https://authgear.com/claims/user/is_verified') = 'true'
  )
  with check (
    (select auth.jwt() ->> 'iss') = 'https://hazard-vaa5a1.authgear.cloud'
    and (select auth.jwt() ->> 'client_id') = '2b273d19926b6daa'
    and (select auth.jwt() ->> 'https://authgear.com/claims/user/is_verified') = 'true'
  );

create policy authgear_only_journeys
  on public.journeys as restrictive for all to authenticated
  using (
    (select auth.jwt() ->> 'iss') = 'https://hazard-vaa5a1.authgear.cloud'
    and (select auth.jwt() ->> 'client_id') = '2b273d19926b6daa'
    and (select auth.jwt() ->> 'https://authgear.com/claims/user/is_verified') = 'true'
  )
  with check (
    (select auth.jwt() ->> 'iss') = 'https://hazard-vaa5a1.authgear.cloud'
    and (select auth.jwt() ->> 'client_id') = '2b273d19926b6daa'
    and (select auth.jwt() ->> 'https://authgear.com/claims/user/is_verified') = 'true'
  );

create policy authgear_only_milestones
  on public.milestones as restrictive for all to authenticated
  using (
    (select auth.jwt() ->> 'iss') = 'https://hazard-vaa5a1.authgear.cloud'
    and (select auth.jwt() ->> 'client_id') = '2b273d19926b6daa'
    and (select auth.jwt() ->> 'https://authgear.com/claims/user/is_verified') = 'true'
  )
  with check (
    (select auth.jwt() ->> 'iss') = 'https://hazard-vaa5a1.authgear.cloud'
    and (select auth.jwt() ->> 'client_id') = '2b273d19926b6daa'
    and (select auth.jwt() ->> 'https://authgear.com/claims/user/is_verified') = 'true'
  );

create policy authgear_only_resources
  on public.resources as restrictive for all to authenticated
  using (
    (select auth.jwt() ->> 'iss') = 'https://hazard-vaa5a1.authgear.cloud'
    and (select auth.jwt() ->> 'client_id') = '2b273d19926b6daa'
    and (select auth.jwt() ->> 'https://authgear.com/claims/user/is_verified') = 'true'
  )
  with check (
    (select auth.jwt() ->> 'iss') = 'https://hazard-vaa5a1.authgear.cloud'
    and (select auth.jwt() ->> 'client_id') = '2b273d19926b6daa'
    and (select auth.jwt() ->> 'https://authgear.com/claims/user/is_verified') = 'true'
  );

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

  if auth.jwt() ->> 'client_id' <> '2b273d19926b6daa' then
    raise exception 'Untrusted Authgear client';
  end if;

  authgear_subject := (auth.jwt() ->> 'sub')::uuid;
  verified_email := lower(trim(auth.jwt() ->> 'email'));

  if authgear_subject is null or auth.uid() is distinct from authgear_subject then
    raise exception 'Authgear subject does not match database identity';
  end if;

  -- Enforce verification before every return path, including already-linked users.
  if coalesce(auth.jwt() ->> 'https://authgear.com/claims/user/is_verified', 'false') <> 'true' then
    return 'verification_required';
  end if;

  if verified_email is null or verified_email = '' then
    return 'email_claim_required';
  end if;

  if exists (select 1 from public.profiles p where p.id = authgear_subject) then
    return 'already_linked';
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
as $guard$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;

  -- INSERT must be guarded as well as UPDATE: a user cannot create their own
  -- profile with is_admin=true before the update trigger ever runs.
  if tg_op = 'INSERT' then
    if coalesce(new.is_admin, false) then
      raise exception 'is_admin can only be granted by a trusted administrator';
    end if;
    return new;
  end if;

  if new.is_admin is distinct from old.is_admin then
    raise exception 'is_admin can only be changed by a trusted administrator';
  end if;
  return new;
end;
$guard$;

drop trigger if exists guard_profile_admin_flag on public.profiles;
create trigger guard_profile_admin_flag
before insert or update on public.profiles
for each row execute function public.guard_profile_admin_flag();

-- Public pages use explicit projections; never expose ownership or internal columns.
GRANT SELECT (
  id, slug, title, description, category, difficulty, target_outcome,
  estimated_hours, is_published, is_featured, cover_image_url
) ON TABLE public.journeys TO anon;

GRANT SELECT (
  id, title, description, url, resource_type, provider, language,
  pricing_type, difficulty, duration_hours, has_certificate, quality_score,
  is_published
) ON TABLE public.resources TO anon;

GRANT SELECT (
  id, journey_id, title, description, position, node_type, estimated_hours
) ON TABLE public.milestones TO anon;

REVOKE EXECUTE ON FUNCTION public.guard_profile_admin_flag() FROM PUBLIC, anon;

commit;
