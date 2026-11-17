# PROJECT_STATUS.md — Skilldrem

**Status verified:** 2026-11-17  
**Repository:** https://github.com/mindsclub20/skilldrem  
**Main commit:** `8a01416ee6376c56e3d61b308235bba05e7457a7`  
**Production commit:** `1e64467a6812937f87c2215e102452680a17d3ab`  
**Production deployment:** `dpl_3i9p8mkBmoRj4L3oDTeeFkFNzCuM` (READY)  
**Supabase:** `ugabwprhvvwapjdzkieq` (`ACTIVE_HEALTHY`)  
**Vercel plan:** Hobby

Production is behind the current main branch. The production deployment remains on the Learning Sprint commit, while main contains the later Supabase auth and Google sign-in changes.

## Current production QA

| Route | Result | Finding |
|---|---|---|
| `/` | HTTP 200 | Useful public homepage |
| `/discover` | HTTP 200 | Discovery form and navigation present |
| `/sprint` | HTTP 200 | Public learning-sprint builder present |
| `/auth/login` | HTTP 200 | Login page served; no credentials submitted |
| `/courses` | HTTP 200 | Empty state: no published courses |
| `/books` | HTTP 200 | Empty state: no published books |
| `/georny` | HTTP 307 | Redirects to login; public-list requirement not live |
| `/workspace` | HTTP 307 | Correctly protected |
| `/dashboard` | HTTP 307 | Correctly protected |

SSR/CSS snapshots measured no horizontal overflow at desktop 1440px, mobile 390px, or narrow mobile 320px. Live browser navigation was blocked by `ERR_SOCKS_CONNECTION_FAILED`; hydrated-app console and interaction verification remain unconfirmed.

## Prioritized backlog

### P0 — Public catalogue release
- [ ] Review [PR #9](https://github.com/mindsclub20/skilldrem/pull/9): public Geornies listing, verified free course/book catalogue, India example goals.
- [x] Quality workflow on PR #9: successful.
- [x] Vercel preview deployment: READY.
- [ ] Inspect preview behavior with an authorized Vercel session; current preview is SSO-protected.
- [ ] Review catalogue URLs and page behavior; obtain formal review before merge.
- [ ] After required release gates and approval, deploy and verify production `/georny`, `/courses`, and `/books`.

### P1 — Learner data correctness
- [ ] Review [PR #4](https://github.com/mindsclub20/skilldrem/pull/4) for progress restoration and persistence.
- [ ] Review [PR #8](https://github.com/mindsclub20/skilldrem/pull/8) for atomic roadmap enrollment behavior.
- [ ] Verify saved-roadmap restore, milestone toggles, ownership, and error recovery with an authorized test account.
- [x] Confirm remote migration history already includes `20261110131641 user_milestone_progress`; do not reapply it.

### P1 — Onboarding and authentication
- [ ] Review [PR #5](https://github.com/mindsclub20/skilldrem/pull/5) and verify failure/retry behavior.
- [ ] Review [PR #7](https://github.com/mindsclub20/skilldrem/pull/7) for safe redirects and sign-out routing.
- [ ] Complete authenticated login/logout and Google OAuth tests with an authorized test account.
- [ ] Do not merge PR #7 until it has a submitted review and all repository release gates pass.

### P1 — AI architecture and reliability
- [ ] Reconcile current Groq-primary/Gemini-fallback implementation with the intended self-hosted, legally licensed open-weight inference architecture.
- [ ] Do not claim that current cloud-provider integrations meet the self-hosted requirement.
- [ ] Design and test the self-hosted inference boundary before removing existing providers.
- [ ] Add rate limiting and reliable error/degradation states to AI routes.
- [ ] Verify AI behavior with authorized test credentials; no live inference request was made in this checkpoint.

### P2 — Product quality
- [ ] Improve India-specific career discovery and roadmap relevance.
- [ ] Improve resource verification, search, filtering, and recommendation quality.
- [ ] Add learner dashboard next-best-action and explicit data-load error states.
- [ ] Complete accessibility and hydrated mobile-browser checks.

## Infrastructure and security

- Supabase project `ugabwprhvvwapjdzkieq` is ACTIVE_HEALTHY; all listed public tables have RLS enabled.
- Remote migration history contains the progress migration. No migration was applied during this run.
- Security advisor reports leaked-password protection disabled.
- Performance advisor reports nine unused indexes at INFO level. No indexes were removed.
- Health advisor returned no findings.
- Vercel preview SSO prevented direct preview verification. Production was not deployed or changed.

## Release rules

No PR merge unless its checks pass, a review is submitted, and repository merge requirements are satisfied. No production deployment, database mutation, migration, secret change, billing action, or security weakening without explicit owner approval. If a gate cannot be verified, leave the PR open and record the blocker.

## Run log — 2026-11-17

- Reconciled main, open PRs, CI, production deployment, Vercel project, Supabase project, migration history, RLS, and advisors.
- Verified public route statuses and catalogue empty states.
- No application code, production deployment, production data, schema, secrets, or authentication settings changed.
- Next task: review PR #9's catalogue implementation and obtain authorized preview access; if unavailable, continue with code-level source/URL review without creating a public share link.
