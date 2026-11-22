# PROJECT_STATUS.md — Skilldrem

**Status verified:** 2026-11-22  
**Repository:** https://github.com/mindsclub20/skilldrem  
**Main commit:** `8a01416ee6376c56e3d61b308235bba05e7457a7`  
**Production commit:** `1e64467a6812937f87c2215e102452680a17d3ab`  
**Production deployment:** `dpl_3i9p8mkBmoRj4L3oDTeeFkFNzCuM` (READY)  
**Supabase:** `ugabwprhvvwapjdzkieq` (`ACTIVE_HEALTHY`)  
**Vercel plan:** Hobby

Production is still running the 2026-11-10 Learning Sprint commit, while GitHub main contains the later 2026-11-13 Supabase auth and Google sign-in commit. The current main commit's Vercel status is failing with a build-rate-limit link. No production deployment was made.

## Production route checkpoint — 2026-11-22

Read-only HTML/SSR fetches were made through the verified custom domain. The Vercel fetch follows same-origin redirects, so protected routes are identified by the final matched path.

| Route | Result | Finding |
|---|---|---|
| `/` | HTTP 200 | Public homepage renders |
| `/discover` | HTTP 200 | Learning discovery page renders |
| `/sprint` | HTTP 200 | Public sprint builder renders |
| `/auth/login` | HTTP 200 | Login route resolves; SSR response contains a client loading placeholder |
| `/courses` | HTTP 200 | Empty state: “No published courses yet” |
| `/books` | HTTP 200 | Empty state: “No published books yet” |
| `/georny` | Final matched path `/auth/login` | Public list is not live; route redirects to login |
| `/workspace` | Final matched path `/auth/login` | Protected as expected |
| `/dashboard` | Final matched path `/auth/login` | Protected as expected |

This was an HTTP/SSR check, not a hydrated-browser test. Browser Use could not run because its connected project reported insufficient credits. No authenticated learner flow, browser console, or viewport-width test was performed.

## GitHub and pull-request checkpoint — 2026-11-22

Main remains at `8a01416ee6376c56e3d61b308235bba05e7457a7`. The main commit has a failing Vercel status whose target identifies a build-rate-limit condition; no GitHub Actions workflow run was associated with that commit.

| PR | Scope | State | Latest CI / Vercel checks | Review / blocker |
|---|---|---|---|---|
| [#4](https://github.com/mindsclub20/skilldrem/pull/4) | Roadmap progress persistence | Open | GitHub Actions and Vercel success | No submitted review; base SHA is `1e64467`, behind current main |
| [#5](https://github.com/mindsclub20/skilldrem/pull/5) | Onboarding save reliability | Open | GitHub Actions and Vercel success | No submitted review; base SHA is `1e64467`, behind current main |
| [#7](https://github.com/mindsclub20/skilldrem/pull/7) | Homepage and sign-out routing | Open | GitHub Actions and Vercel success | No submitted review |
| [#8](https://github.com/mindsclub20/skilldrem/pull/8) | Saved-roadmap enrollment atomicity | Open draft | GitHub Actions and Vercel success | No submitted review |
| [#9](https://github.com/mindsclub20/skilldrem/pull/9) | Public Geornies and verified course/book catalogue | Open | GitHub Actions and Vercel success | No submitted review; production behavior remains unchanged |
| [#10](https://github.com/mindsclub20/skilldrem/pull/10) | Project-state and architecture documentation | Open draft | GitHub Actions and Vercel success before this checkpoint | This run updates the documentation branch; keep draft pending review |
| [#1](https://github.com/mindsclub20/skilldrem/pull/1) | Unified learning workspace | Open draft | Not revalidated in this checkpoint | GitHub reports it is not mergeable; requires a fresh review |

The six PRs #4, #5, #7, #8, #9, and #10 have successful latest GitHub Actions and Vercel status checks. Review submissions were empty for all seven open PRs. PRs #4 and #5 need their base divergence reconciled against current main before release consideration. All previews are protected by Vercel SSO; no share links were created.

## Supabase checkpoint — 2026-11-22

Project `ugabwprhvvwapjdzkieq` is `ACTIVE_HEALTHY` in `eu-west-1`, on Postgres 17.11.0.018.

- Eight public tables were listed; RLS is enabled on every listed table.
- Nineteen public-schema RLS policies were inspected. The progress table has authenticated own-user SELECT, INSERT, UPDATE, and DELETE policies. Profiles, preferences, AI sessions, and user journeys are scoped to the authenticated user; journey and milestone reads are limited to published or owned journeys; resources have a published-read policy.
- `user_milestone_progress` exists in the live schema. Its migration is already in remote history; do not reapply it.
- Remote migrations: `20261110131631 initial_skilldrem_schema`, `20261110131641 user_milestone_progress`, `20261110131720 restrict_auth_trigger_function`, `20261110131747 rls_policy_performance_tuning`.
- Current table counts: `resources`, `journeys`, `milestones`, `user_journeys`, `user_preferences`, and `user_milestone_progress` each report zero rows; `profiles` reports one and `ai_sessions` reports two. No rows were read or modified.
- Security advisor: **Leaked Password Protection Disabled** (WARN). Remediation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- Performance advisor: nine unused-index findings (INFO). Do not remove indexes without workload evidence.
- Health advisor: no findings.

No schema, learner data, RLS policies, auth settings, or secrets were changed.

## Vercel operations checkpoint — 2026-11-22

- Project: `skilldrem`, ID `prj_xthTxSYnrKSVqx3uW3kXZ151fc0m`, Hobby team.
- Custom domain `skilldrem.vercel.app` is verified.
- Production deployment `dpl_3i9p8mkBmoRj4L3oDTeeFkFNzCuM` is READY and aliases `skilldrem.vercel.app`, but serves the older `1e64467` commit.
- The project-level latest-deployment pointer currently references the READY PR #5 preview `dpl_7AwRhnkN5siymwKU95tvcS5cogAz`, not a production deployment. The production deployment record was checked separately.
- SSO protection is enabled for non-custom deployment URLs. No preview share link or protection change was created.
- Vercel aggregated runtime-error query returned no runtime errors in the last seven days.

## Prioritized backlog

### P0 — Public catalogue release
- [ ] Review [PR #9](https://github.com/mindsclub20/skilldrem/pull/9): public Geornies listing, verified free course/book catalogue, and India example goals.
- [x] Latest PR #9 GitHub Actions and Vercel status checks succeeded; preview deployment is READY.
- [ ] Inspect the preview with an authorized session; preview is SSO-protected and Browser Use credits were unavailable in this checkpoint.
- [ ] Review catalogue URLs and source provenance in code.
- [ ] Obtain an independent review. Do not merge or deploy without explicit approval.
- [ ] After approved release, verify production `/georny`, `/courses`, and `/books`.

### P1 — Learner data correctness
- [ ] Review [PR #4](https://github.com/mindsclub20/skilldrem/pull/4) for restore, persistence, ownership, and failure recovery.
- [ ] Reconcile PR #4's base SHA with current main before release consideration.
- [ ] Review [PR #8](https://github.com/mindsclub20/skilldrem/pull/8) for atomic roadmap enrollment.
- [ ] Verify saved-roadmap restore, milestone toggles, ownership, and error recovery with an authorized test account.
- [x] Confirm live `user_milestone_progress` table and migration history; do not reapply the migration.

### P1 — Onboarding and authentication
- [ ] Review [PR #5](https://github.com/mindsclub20/skilldrem/pull/5) and verify failure/retry behavior.
- [ ] Reconcile PR #5's base SHA with current main before release consideration.
- [ ] Review [PR #7](https://github.com/mindsclub20/skilldrem/pull/7) for safe redirects and sign-out routing.
- [ ] Complete authenticated login/logout and Google OAuth tests with an authorized test account.
- [ ] Address leaked-password protection warning through an owner-approved Supabase setting change.

### P1 — AI architecture and reliability
- [ ] Reconcile current Groq-primary/Gemini-fallback implementation with the intended self-hosted, legally licensed open-weight inference architecture.
- [ ] Do not claim current cloud-provider integrations meet the self-hosted requirement.
- [ ] Design and test the self-hosted inference boundary before removing existing providers.
- [ ] Add rate limiting and reliable error/degradation states to AI routes.
- [ ] Verify AI behavior with authorized test credentials; no live inference request was made in this checkpoint.

### P2 — Product quality
- [ ] Improve India-specific career discovery and roadmap relevance.
- [ ] Improve resource provenance, verification, search, and filtering.
- [ ] Add dashboard next-best-action and explicit data-load error states.
- [ ] Complete hydrated-browser accessibility and responsive checks.

## Release rules

No PR merge unless its checks pass, an independent review is submitted, and repository merge requirements are satisfied. No production deployment, database mutation, migration, secret change, billing action, or security weakening without explicit owner approval. If a gate cannot be verified, leave the PR open and record the blocker.

## Run log — 2026-11-22

- Re-inspected repository, main commit, branches, seven open PRs, latest CI/status checks, Vercel project, production deployment, preview history, and Supabase schema/migrations/advisors/RLS.
- Rechecked public production route responses. Confirmed Courses and Books remain empty and Geornies remains login-protected.
- Confirmed the main commit's Vercel check is failing with a build-rate-limit condition; production remains READY on the older commit.
- Confirmed no Vercel runtime errors in the last seven days.
- Updated this status record and related project memory/integration documentation on the existing documentation PR branch.
- No application code, production deployment, production data, schema, RLS, auth settings, or secrets changed.
- Next task: perform a code-level source/provenance and URL audit of PR #9's catalogue, then obtain authorized preview access and independent review before any release consideration.
