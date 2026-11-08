# PROGRESS_PERSISTENCE.md — Skilldrem

**Date:** 2026-11-08  
**Status:** Implementation delivered in code; production migration **not applied** (requires explicit authorization + Supabase write permissions).

## Problem

Workspace milestone completion (`completed` map) lived only in React state. After refresh, logout, or another device, progress was lost. The progress tab explicitly noted: *"Progress is stored locally in this session. Full persistence to Supabase learner_progress is next."*

## Existing structures reused

| Table | Role |
|-------|------|
| `journeys` | Saved roadmaps (`created_by`, title, description, …) |
| `milestones` | Flat milestones for a journey (`journey_id`, position, metadata) |
| `user_journeys` | Enrollment (`user_id`, `journey_id`, `status`, `progress_percent`) |
| `user_preferences` | Personalization inputs for generation |

## New structure (migration, not applied)

Table: `user_milestone_progress` — see `supabase/migrations/20261108_user_milestone_progress.sql`

## API surface (implemented)

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/api/ai/roadmap/progress?journey_id=` | Load completions + progress % for current user |
| POST | `/api/ai/roadmap/progress` | Upsert milestone completions; recompute `progress_percent` |
| GET | `/api/ai/roadmap/list` | List user's saved journeys (for restore on workspace load) |

All routes derive identity from `supabase.auth.getUser()` only; never trust client-supplied user IDs.

## Client changes (`WorkspaceClient`)

- After save: keep `journey_id` and enable progress POSTs.
- `toggleComplete`: optimistic UI + server POST.
- Progress tab reflects sync status / migration-required banner.

## Authorization required

- Apply migration via Supabase (MCP `apply_migration` or dashboard SQL).
- Do **not** apply without product owner approval on production project `lxlbuljcecratjypmoxi`.
