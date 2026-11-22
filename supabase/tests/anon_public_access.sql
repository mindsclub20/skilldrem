-- Run only after applying 20261122150000_restrict_anon_public_schema_access.sql.
-- This read-only verification script raises an exception if the least-privilege
-- grants or public-published policies are missing.
DO $$
BEGIN
  IF has_table_privilege('anon', 'public.profiles', 'TRUNCATE') THEN
    RAISE EXCEPTION 'anon must not have TRUNCATE on profiles';
  END IF;
  IF has_table_privilege('anon', 'public.ai_sessions', 'TRUNCATE') THEN
    RAISE EXCEPTION 'anon must not have TRUNCATE on ai_sessions';
  END IF;
  IF has_table_privilege('anon', 'public.user_milestone_progress', 'TRUNCATE') THEN
    RAISE EXCEPTION 'anon must not have TRUNCATE on user_milestone_progress';
  END IF;
  IF has_table_privilege('anon', 'public.user_journeys', 'TRIGGER') THEN
    RAISE EXCEPTION 'anon must not have TRIGGER on user_journeys';
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
