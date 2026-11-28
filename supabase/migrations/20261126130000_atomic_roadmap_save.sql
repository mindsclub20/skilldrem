-- Atomic Authgear roadmap creation.
-- The journey, milestones, and enrollment are committed together or rolled back together.
-- Apply to a staging Supabase project first; do not apply to production without approval.

begin;

create or replace function public.create_authgear_journey(
  p_journey jsonb,
  p_milestones jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public, auth, pg_temp
as $$
declare
  authgear_subject uuid;
  created_journey_id uuid;
  milestone_count integer;
  milestone jsonb;
begin
  if auth.jwt() ->> 'iss' <> 'https://hazard-vaa5a1.authgear.cloud' then
    raise exception 'Untrusted identity issuer' using errcode = '42501';
  end if;

  if auth.jwt() ->> 'client_id' <> '2b273d19926b6daa' then
    raise exception 'Untrusted Authgear client' using errcode = '42501';
  end if;

  if auth.jwt() ->> 'role' <> 'authenticated' then
    raise exception 'Authenticated role required' using errcode = '42501';
  end if;

  if coalesce(auth.jwt() ->> 'https://authgear.com/claims/user/is_verified', 'false') <> 'true' then
    raise exception 'Verified Authgear identity required' using errcode = '42501';
  end if;

  authgear_subject := (auth.jwt() ->> 'sub')::uuid;
  if authgear_subject is null or auth.uid() is distinct from authgear_subject then
    raise exception 'Authgear subject does not match database identity' using errcode = '42501';
  end if;

  if p_journey is null or jsonb_typeof(p_journey) is distinct from 'object' then
    raise exception 'Invalid journey payload';
  end if;

  if nullif(trim(p_journey ->> 'title'), '') is null then
    raise exception 'Journey title is required';
  end if;

  if p_milestones is null or jsonb_typeof(p_milestones) is distinct from 'array' then
    raise exception 'Invalid milestones payload';
  end if;

  if jsonb_array_length(p_milestones) < 1 or jsonb_array_length(p_milestones) > 100 then
    raise exception 'Roadmap must contain between 1 and 100 milestones';
  end if;

  insert into public.journeys (
    title,
    description,
    target_outcome,
    difficulty,
    estimated_hours,
    category,
    is_published,
    is_featured,
    created_by
  )
  values (
    left(coalesce(p_journey ->> 'title', ''), 200),
    nullif(left(coalesce(p_journey ->> 'description', ''), 2000), ''),
    nullif(left(coalesce(p_journey ->> 'target_outcome', ''), 500), ''),
    case when p_journey ->> 'difficulty' in ('beginner', 'intermediate', 'advanced', 'expert')
      then p_journey ->> 'difficulty' else 'beginner' end,
    nullif(p_journey ->> 'estimated_hours', '')::numeric,
    left(coalesce(nullif(p_journey ->> 'category', ''), 'personalized'), 100),
    false,
    false,
    authgear_subject
  )
  returning id into created_journey_id;

  for milestone in select value from jsonb_array_elements(p_milestones)
  loop
    if nullif(trim(milestone ->> 'title'), '') is null then
      raise exception 'Milestone title is required';
    end if;

    insert into public.milestones (
      journey_id,
      title,
      description,
      position,
      estimated_hours,
      node_type,
      metadata
    )
    values (
      created_journey_id,
      left(milestone ->> 'title', 200),
      nullif(left(coalesce(milestone ->> 'description', ''), 2000), ''),
      (milestone ->> 'position')::integer,
      nullif(milestone ->> 'estimated_hours', '')::numeric,
      case when milestone ->> 'node_type' in ('start', 'milestone', 'project', 'checkpoint', 'end')
        then milestone ->> 'node_type' else 'milestone' end,
      coalesce(milestone -> 'metadata', '{}'::jsonb)
    );
  end loop;

  milestone_count := jsonb_array_length(p_milestones);

  insert into public.user_journeys (
    user_id,
    journey_id,
    status,
    progress_percent
  )
  values (
    authgear_subject,
    created_journey_id,
    'active',
    0
  );

  return jsonb_build_object(
    'journey_id', created_journey_id,
    'milestone_count', milestone_count
  );
end;
$$;

revoke all on function public.create_authgear_journey(jsonb, jsonb) from public, anon;
grant execute on function public.create_authgear_journey(jsonb, jsonb) to authenticated;

commit;
