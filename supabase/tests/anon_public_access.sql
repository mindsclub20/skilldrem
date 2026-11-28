-- Run only after applying 20261126120000_authgear_primary_auth.sql.
-- Read-only post-migration verification. Raises if anon retains broad grants
-- or can read columns outside the published journeys/resources/milestones views.
DO $$
DECLARE
  table_record record;
  sequence_record record;
  column_record record;
BEGIN
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

    IF table_record.table_name NOT IN ('journeys', 'resources', 'milestones')
      AND has_table_privilege('anon', table_record.relation_oid, 'SELECT') THEN
      RAISE EXCEPTION 'anon retains table-level SELECT on private public relation %', table_record.relation;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
      AND a.attnum > 0
      AND NOT a.attisdropped
      AND (
        (
          c.relname NOT IN ('journeys', 'resources', 'milestones')
          AND (
            has_column_privilege('anon', c.oid, a.attnum, 'SELECT')
            OR has_column_privilege('anon', c.oid, a.attnum, 'INSERT')
            OR has_column_privilege('anon', c.oid, a.attnum, 'UPDATE')
            OR has_column_privilege('anon', c.oid, a.attnum, 'REFERENCES')
          )
        )
        OR (
          c.relname = 'journeys'
          AND (
            has_column_privilege('anon', c.oid, a.attnum, 'INSERT')
            OR has_column_privilege('anon', c.oid, a.attnum, 'UPDATE')
            OR has_column_privilege('anon', c.oid, a.attnum, 'REFERENCES')
            OR (
              a.attname NOT IN (
                'id', 'slug', 'title', 'description', 'category', 'difficulty',
                'target_outcome', 'estimated_hours', 'is_published', 'is_featured',
                'cover_image_url'
              )
              AND has_column_privilege('anon', c.oid, a.attnum, 'SELECT')
            )
          )
        )
        OR (
          c.relname = 'resources'
          AND (
            has_column_privilege('anon', c.oid, a.attnum, 'INSERT')
            OR has_column_privilege('anon', c.oid, a.attnum, 'UPDATE')
            OR has_column_privilege('anon', c.oid, a.attnum, 'REFERENCES')
            OR (
              a.attname NOT IN (
                'id', 'title', 'description', 'url', 'resource_type', 'provider',
                'language', 'pricing_type', 'difficulty', 'duration_hours',
                'has_certificate', 'quality_score', 'is_published'
              )
              AND has_column_privilege('anon', c.oid, a.attnum, 'SELECT')
            )
          )
        )
        OR (
          c.relname = 'milestones'
          AND (
            has_column_privilege('anon', c.oid, a.attnum, 'INSERT')
            OR has_column_privilege('anon', c.oid, a.attnum, 'UPDATE')
            OR has_column_privilege('anon', c.oid, a.attnum, 'REFERENCES')
            OR (
              a.attname NOT IN (
                'id', 'journey_id', 'title', 'description', 'position',
                'node_type', 'estimated_hours'
              )
              AND has_column_privilege('anon', c.oid, a.attnum, 'SELECT')
            )
          )
        )
      )
  ) THEN
    RAISE EXCEPTION 'anon retains an unapproved column-level privilege on a public relation';
  END IF;

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

  IF EXISTS (
    SELECT 1
    FROM pg_default_acl d
    CROSS JOIN LATERAL aclexplode(d.defaclacl) acl
    WHERE d.defaclrole IN ('postgres'::regrole, 'supabase_admin'::regrole)
      AND d.defaclnamespace = 'public'::regnamespace
      AND d.defaclobjtype IN ('r', 'S', 'f')
      AND acl.grantee = 'anon'::regrole
  ) THEN
    RAISE EXCEPTION 'anon retains default privileges on public-schema objects';
  END IF;

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

  FOR column_record IN
    SELECT unnest(ARRAY[
      'id', 'journey_id', 'title', 'description', 'position',
      'node_type', 'estimated_hours'
    ]) AS column_name
  LOOP
    IF NOT has_column_privilege('anon', 'public.milestones', column_record.column_name, 'SELECT') THEN
      RAISE EXCEPTION 'anon cannot read required public.milestones column %', column_record.column_name;
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

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'journeys'
      AND policyname = 'journeys_read_published_or_owned'
      AND roles @> ARRAY['anon']::name[]
  ) THEN
    RAISE EXCEPTION 'owner-aware journey policy must not be assigned to anon';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'milestones'
      AND policyname = 'milestones_public_read_published'
      AND roles @> ARRAY['anon']::name[]
      AND cmd = 'SELECT'
  ) THEN
    RAISE EXCEPTION 'published milestones anon SELECT policy is missing';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'milestones'
      AND policyname = 'milestones_read_accessible_journey'
      AND roles @> ARRAY['anon']::name[]
  ) THEN
    RAISE EXCEPTION 'owner-aware milestone policy must not be assigned to anon';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'resources'
      AND policyname = 'resources_public_read_published'
  ) THEN
    RAISE EXCEPTION 'legacy public resources policy remains';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'resources'
      AND policyname = 'resources_read_published'
      AND roles @> ARRAY['anon']::name[]
      AND cmd = 'SELECT'
  ) THEN
    RAISE EXCEPTION 'published resources anon SELECT policy is missing';
  END IF;
END
$$;
