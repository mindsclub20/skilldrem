-- Migration: user_milestone_progress
-- DO NOT APPLY TO PRODUCTION WITHOUT EXPLICIT AUTHORIZATION
-- Project: lxlbuljcecratjypmoxi

create table if not exists public.user_milestone_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  journey_id uuid not null references public.journeys (id) on delete cascade,
  milestone_id uuid not null references public.milestones (id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_milestone_progress_unique unique (user_id, milestone_id)
);

create index if not exists user_milestone_progress_user_journey_idx
  on public.user_milestone_progress (user_id, journey_id);

alter table public.user_milestone_progress enable row level security;

create policy "ump_select_own" on public.user_milestone_progress
  for select to authenticated using (auth.uid() = user_id);
create policy "ump_insert_own" on public.user_milestone_progress
  for insert to authenticated with check (auth.uid() = user_id);
create policy "ump_update_own" on public.user_milestone_progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ump_delete_own" on public.user_milestone_progress
  for delete to authenticated using (auth.uid() = user_id);

-- Optional progress_percent sync trigger omitted in short form; full version in repo notes.
