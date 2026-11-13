# Roadmap progress persistence

**Status (13 Nov 2026):** The server-side progress API exists on `main`. The current Skilldrem production project `ugabwprhvvwapjdzkieq` was checked read-only: `public.user_milestone_progress` exists, row-level security is enabled, and four table policies are present. The end-to-end client integration is proposed on `feature/roadmap-progress-persistence`; it is not yet merged or released.

## Existing structures

| Table | Role |
|---|---|
| `journeys` | Saved roadmaps and ownership |
| `milestones` | Ordered milestones and stage metadata |
| `user_journeys` | User enrollment and dashboard progress summary |
| `user_milestone_progress` | Per-user milestone completion state |

## API surface

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/ai/roadmap/progress?journey_id=` | Load the owned/enrolled journey, ordered milestones and completion state |
| POST | `/api/ai/roadmap/progress` | Validate and upsert one or more milestone completions |
| GET | `/api/ai/roadmap/list` | List the authenticated user's saved journeys |

The routes derive identity from `supabase.auth.getUser()`; they do not accept a client-supplied user ID. Progress updates must reference milestone IDs belonging to the selected journey (or a valid stored position). Invalid and duplicate updates are rejected.

## Proposed client flow in the feature branch

- Dashboard journey cards link to `/workspace?journey_id=...`.
- The workspace restores the selected saved roadmap and server completion state.
- Saving a new roadmap initializes the milestone-ID map from the server response.
- Completion toggles are optimistic, persisted to the progress API, and rolled back on a failed request.
- Loading, migration-unavailable, save, and retry states are exposed to the learner.

## Migration and safety notes

- The production table was verified read-only on 13 Nov 2026. No schema or row changes were made by this mission.
- The historical migration file `supabase/migrations/20261108_user_milestone_progress.sql` still names the retired project `lxlbuljcecratjypmoxi`. Do not apply it to production or assume it is a current deployment instruction.
- No production migration is included in the feature branch. If another environment lacks the table, stop and review that environment separately; do not modify production schema as a workaround.
- The repository currently has no dependency lockfile. The new CI workflow uses `npm install`; deterministic dependency locking remains a follow-up task.
