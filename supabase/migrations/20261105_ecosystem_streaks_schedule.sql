-- Applied on project lxlbuljcecratjypmoxi
ALTER TABLE public.user_journeys
  ADD COLUMN IF NOT EXISTS hours_per_week numeric;

CREATE TABLE IF NOT EXISTS public.learning_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_date date NOT NULL DEFAULT (timezone('utc', now()))::date,
  activity_type text NOT NULL DEFAULT 'study',
  xp integer NOT NULL DEFAULT 10,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, activity_date, activity_type)
);

CREATE TABLE IF NOT EXISTS public.skill_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_key text NOT NULL,
  title text NOT NULL,
  description text,
  journey_id uuid REFERENCES public.journeys(id) ON DELETE SET NULL,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_key, journey_id)
);
