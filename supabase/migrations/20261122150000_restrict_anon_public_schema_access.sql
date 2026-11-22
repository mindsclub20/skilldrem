-- Skilldrem public-schema least-privilege hardening.
--
-- The live project currently grants anon broad table privileges, including
-- TRUNCATE, REFERENCES, and TRIGGER. RLS does not apply to TRUNCATE or
-- REFERENCES, so RLS alone is not a sufficient boundary for these grants.
--
-- Remove anonymous write/DDL-adjacent privileges from existing public objects
-- and stop the two observed object owners from granting them to future objects.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

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

-- Anonymous visitors need read-only access to published catalogue records.
-- Grant only the columns used by the public pages; created_by is excluded.
GRANT SELECT (
  id,
  slug,
  title,
  description,
  category,
  difficulty,
  target_outcome,
  estimated_hours,
  is_published,
  is_featured,
  cover_image_url
) ON TABLE public.journeys TO anon;

GRANT SELECT (
  id,
  title,
  description,
  url,
  resource_type,
  provider,
  language,
  pricing_type,
  difficulty,
  duration_hours,
  has_certificate,
  quality_score,
  is_published
) ON TABLE public.resources TO anon;

ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY journeys_public_read_published
  ON public.journeys
  FOR SELECT
  TO anon
  USING (is_published = true);

CREATE POLICY resources_public_read_published
  ON public.resources
  FOR SELECT
  TO anon
  USING (is_published = true);
