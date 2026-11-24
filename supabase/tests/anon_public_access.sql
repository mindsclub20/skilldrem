-- Run only after applying 20261122150000_restrict_anon_public_schema_access.sql.
-- This read-only verification script raises an exception if the least-privilege
-- grants, default privileges, or public-published policies are missing.
DO $$
DECLARE
  table_record record;
  sequence_record record;
BEGIN
  -- Check every public table, not only a hand-picked subset.
  FOR table_record IN
    SELECT format('%I.%I', schemaname, tablename) AS relation
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    IF has_table_privilege('anon', table_record.relation, 'INSERT')
      OR has_table_privilege('anon', table_record.relation, 'UPDATE')
      OR has_table_privilege('anon', table_record.relation, 'DELETE')
      OR has_table_privilege('anon', table_record.relation, 'TRUNCATE')
      OR has_table_privilege('anon', table_record.relation, 'REFERENCES')
      OR has_table_privilege('anon', table_record.relation, 'TRIGGER') THEN
      RAISE EXCEPTION 'anon retains a write or DDL-adjacent privilege on public table %', table_record.relation;
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

  IF has_column_privilege('anon', 'public.journeys', 'created_by', 'SELECT') THEN
    RAISE EXCEPTION 'anon must not read journeys.created_by';
  END IF;
  IF NOT has_column_privilege('anon', 'public.journeys', 'title', 'SELECT') THEN
    RAISE EXCEPTION 'anon must be able to read published journey titles';
  END IF;
  IF NOT has_column_privilege('anon', 'public.resources', 'title', 'SELECT') THEN
    RAISE EXCEPTION 'anon must be able to read published resource titles';
  END IF;
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
