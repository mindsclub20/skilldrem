-- Run only after applying 20261122150000_restrict_anon_public_schema_access.sql.
-- This read-only verification script raises an exception if the least-privilege
-- grants, default privileges, or public-published policies are missing.
DO $$
DECLARE
  table_record record;
  sequence_record record;
  column_record record;
BEGIN
  -- Check every public table, view, materialized view, and foreign table.
  FOR table_record IN
    SELECT c.oid AS relation_oid,
           c.relname AS table_name,
           format('%I.%I', n.nspname, c.relname) AS relation
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
  LOOP
    IF has_table_privilege('anon', table_record.relation_oid, 'INSERT')
      OR has_table_privilege('anon', table_record.relation_oid, 'UPDATE')
      OR has_table_privilege('anon', table_record.relation_oid, 'DELETE')
      OR has_table_privilege('anon', table_record.relation_oid, 'TRUNCATE')
      OR has_table_privilege('anon', table_record.relation_oid, 'REFERENCES')
      OR has_table_privilege('anon', table_record.relation_oid, 'TRIGGER')
      OR has_table_privilege('anon', table_record.relation_oid, 'MAINTAIN') THEN
      RAISE EXCEPTION 'anon retains a write or maintenance privilege on public relation %', table_record.relation;
    END IF;

    -- Anonymous SELECT is limited to approved columns on these two catalogues.
    IF table_record.table_name NOT IN ('journeys', 'resources')
      AND has_table_privilege('anon', table_record.relation_oid, 'SELECT') THEN
      RAISE EXCEPTION 'anon retains SELECT on private public-schema relation %', table_record.relation;
    END IF;
  END LOOP;

  -- Anonymous access to public sequences is not required by the catalogue.
  FOR sequence_record IN
    SELECT format('%I.%I', n.nspname, c.relname) AS relation
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'S'
  LOOP
    IF has_sequence_privilege('anon', sequence_record.relation, 'USAGE')
      OR has_sequence_privilege('anon', sequence_record.relation, 'SELECT')
      OR has_sequence_privilege('anon', sequence_record.relation, 'UPDATE') THEN
      RAISE EXCEPTION 'anon retains a privilege on public sequence %', sequence_record.relation;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
  ) THEN
    RAISE EXCEPTION 'anon retains EXECUTE on a public-schema function';
  END IF;

  -- Per-schema REVOKE cannot remove the global default PUBLIC function grant.
  IF EXISTS (
    SELECT 1
    FROM pg_default_acl d
    CROSS JOIN LATERAL aclexplode(d.defaclacl) acl
    WHERE d.defaclrole IN ('postgres'::regrole, 'supabase_admin'::regrole)
      AND d.defaclobjtype = 'f'
      AND d.defaclnamespace = 0
      AND acl.grantee = 0
      AND acl.privilege_type = 'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'PUBLIC still has global default EXECUTE on new functions';
  END IF;

  -- Confirm anon is absent from public-schema defaults for both observed grantors.
  IF EXISTS (
    SELECT 1
    FROM pg_default_acl d
    CROSS JOIN LATERAL aclexplode(d.defaclacl) acl
    WHERE d.defaclrole IN ('postgres'::regrole, 'supabase_admin'::regrole)
      AND d.defaclnamespace = 'public'::regnamespace
      AND d.defaclobjtype IN ('r', 'S', 'f')
      AND acl.grantee = 'anon'::regrole
  ) THEN
    RAISE EXCEPTION 'anon still has default privileges on public-schema objects';
  END IF;

  -- Preserve PUBLIC EXECUTE for new extension functions while hardening public.
  IF (
    SELECT count(DISTINCT d.defaclrole)
    FROM pg_default_acl d
    CROSS JOIN LATERAL aclexplode(d.defaclacl) acl
    WHERE d.defaclrole IN ('postgres'::regrole, 'supabase_admin'::regrole)
      AND d.defaclnamespace = 'extensions'::regnamespace
      AND d.defaclobjtype = 'f'
      AND acl.grantee = 0
      AND acl.privilege_type = 'EXECUTE'
  ) <> 2 THEN
    RAISE EXCEPTION 'extensions PUBLIC EXECUTE defaults were not preserved for both grantors';
  END IF;

  -- No unapproved journey columns may be readable by anon.
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'journeys'
      AND has_column_privilege('anon', 'public.journeys', c.column_name, 'SELECT')
      AND c.column_name NOT IN (
        'id', 'slug', 'title', 'description', 'category', 'difficulty',
        'target_outcome', 'estimated_hours', 'is_published', 'is_featured',
        'cover_image_url'
      )
  ) THEN
    RAISE EXCEPTION 'anon can read an unapproved public.journeys column';
  END IF;

  -- No unapproved resource columns may be readable by anon.
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'resources'
      AND has_column_privilege('anon', 'public.resources', c.column_name, 'SELECT')
      AND c.column_name NOT IN (
        'id', 'title', 'description', 'url', 'resource_type', 'provider',
        'language', 'pricing_type', 'difficulty', 'duration_hours',
        'has_certificate', 'quality_score', 'is_published'
      )
  ) THEN
    RAISE EXCEPTION 'anon can read an unapproved public.resources column';
  END IF;

  -- Every required public catalogue column must remain readable.
  FOR column_record IN
    SELECT unnest(ARRAY[
      'id', 'slug', 'title', 'description', 'category', 'difficulty',
      'target_outcome', 'estimated_hours', 'is_published', 'is_featured',
      'cover_image_url'
    ]) AS column_name
  LOOP
    IF NOT has_column_privilege('anon', 'public.journeys', column_record.column_name, 'SELECT') THEN
      RAISE EXCEPTION 'anon cannot read required public.journeys column %', column_record.column_name;
    END IF;
  END LOOP;

  FOR column_record IN
    SELECT unnest(ARRAY[
      'id', 'title', 'description', 'url', 'resource_type', 'provider',
      'language', 'pricing_type', 'difficulty', 'duration_hours',
      'has_certificate', 'quality_score', 'is_published'
    ]) AS column_name
  LOOP
    IF NOT has_column_privilege('anon', 'public.resources', column_record.column_name, 'SELECT') THEN
      RAISE EXCEPTION 'anon cannot read required public.resources column %', column_record.column_name;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'journeys'
      AND policyname = 'journeys_public_read_published'
      AND roles @> ARRAY['anon']::name[]
      AND cmd = 'SELECT'
  ) THEN
    RAISE EXCEPTION 'published journeys anon SELECT policy is missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'resources'
      AND policyname = 'resources_public_read_published'
      AND roles @> ARRAY['anon']::name[]
      AND cmd = 'SELECT'
  ) THEN
    RAISE EXCEPTION 'published resources anon SELECT policy is missing';
  END IF;
END
$$;
