-- Applied on project lxlbuljcecratjypmoxi via Supabase MCP
-- Practice sessions for unified learning workspace

CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_journey_id uuid REFERENCES public.user_journeys(id) ON DELETE SET NULL,
  milestone_id uuid REFERENCES public.milestones(id) ON DELETE SET NULL,
  topic text NOT NULL,
  difficulty text CHECK (difficulty = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text])),
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score numeric,
  max_score numeric,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS practice_sessions_user_id_idx ON public.practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS practice_sessions_milestone_id_idx ON public.practice_sessions(milestone_id);

ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

-- Policy created in production: Users manage own practice sessions (auth.uid() = user_id)
