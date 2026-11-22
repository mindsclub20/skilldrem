# PROJECT_MEMORY.md — Skilldrem

**Last verified:** 2026-11-22  
**Repository:** https://github.com/mindsclub20/skilldrem  
**Production:** https://skilldrem.vercel.app  
**Default branch:** `main`  
**Main commit inspected:** `8a01416ee6376c56e3d61b308235bba05e7457a7`

## Product objective

Skilldrem is an AI-powered learning and career-guidance platform for learners in India and globally. Core product areas include learning discovery, personalized roadmaps, free-first resources, Geornies, learner progress, and an AI learning assistant.

**AI architecture target:** The intended direction is an independently operated, self-hosted inference service using legally licensed open-weight models. The product should not depend on external cloud AI inference APIs. Do not claim a foundation model was trained from scratch. This target is not yet implemented by the current main branch; treat it as a tracked architecture gap.

## Verified technology and infrastructure

- Next.js 15.5.28, React 19, TypeScript, Tailwind CSS 4, Vitest.
- Vercel project: `skilldrem`, ID `prj_xthTxSYnrKSVqx3uW3kXZ151fc0m`, Hobby team.
- Verified Vercel custom domain: `skilldrem.vercel.app`.
- Active Supabase project: `ugabwprhvvwapjdzkieq`, region `eu-west-1`, Postgres 17.11.0.018, status `ACTIVE_HEALTHY`.
- The old Supabase reference `lxlbuljcecratjypmoxi` is stale. Do not use it for new configuration.
- Vercel environment-variable names are documented in `INTEGRATION_REGISTRY.md`; values are intentionally not recorded here.

## Deployment state — verified 2026-11-22

- Main commit: `8a01416ee6376c56e3d61b308235bba05e7457a7` (Supabase auth configuration and Google sign-in).
- Production deployment: `dpl_3i9p8mkBmoRj4L3oDTeeFkFNzCuM`, READY, on commit `1e64467a6812937f87c2215e102452680a17d3ab` (Learning Sprint).
- Production is behind main. The main commit's Vercel status is failing with a build-rate-limit condition; no production deployment has been made from the current main commit.
- The Vercel project-level latest-deployment pointer references the READY PR #5 preview `dpl_7AwRhnkN5siymwKU95tvcS5cogAz`, not production. The production deployment record was checked separately.
- Preview deployments are protected by Vercel SSO. Do not create a public share link or change protection without owner approval.
- Vercel aggregated runtime-error query returned no runtime errors in the last seven days.

## Current AI implementation versus target

The current main code was previously observed importing Groq and Gemini in `src/lib/ai/provider.ts`; Firecrawl is optional for web discovery. Vercel has environment-variable entries for `GROQ_API_KEY`, `GEMINI_API_KEY`, and `FIRECRAWL_API_KEY`. Values remain secret and were not retrieved.

This is a code/configuration observation, not proof that live inference calls succeed. It also does not satisfy the intended self-hosted inference target. Do not silently add more cloud providers or represent this implementation as offline/self-hosted.

## Supabase state — verified 2026-11-22

- Project is `ACTIVE_HEALTHY`; region `eu-west-1`; Postgres 17.11.0.018.
- Eight public tables were listed; RLS is enabled on all eight.
- Nineteen public-schema RLS policies were inspected. `user_milestone_progress` has authenticated own-user SELECT, INSERT, UPDATE, and DELETE policies. Profiles, preferences, AI sessions, and user journeys are scoped to the authenticated user. Journey/milestone reads are limited to published or owned journeys. Resources have a published-read policy.
- Remote migrations: `20261110131631 initial_skilldrem_schema`, `20261110131641 user_milestone_progress`, `20261110131720 restrict_auth_trigger_function`, `20261110131747 rls_policy_performance_tuning`.
- The milestone-progress migration is already present in remote history and the table exists. Never reapply it.
- Aggregate table counts: `resources`, `journeys`, `milestones`, `user_journeys`, `user_preferences`, and `user_milestone_progress` each report zero rows; `profiles` reports one and `ai_sessions` reports two. No row contents were read or changed.
- Security advisor: leaked-password protection is disabled (WARN). Remediation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- Performance advisor: nine unused-index INFO findings. Do not remove indexes without workload evidence.
- Health advisor: no findings.
- No schema, data, RLS policy, auth setting, or secret was changed during this checkpoint.

## Open pull requests — verified 2026-11-22

| PR | Scope | State | Latest checks | Outstanding |
|---|---|---|---|---|
| [#4](https://github.com/mindsclub20/skilldrem/pull/4) | Roadmap progress persistence | Open | Actions and Vercel success | No review; base SHA `1e64467` is behind current main |
| [#5](https://github.com/mindsclub20/skilldrem/pull/5) | Onboarding reliability | Open | Actions and Vercel success | No review; base SHA `1e64467` is behind current main |
| [#7](https://github.com/mindsclub20/skilldrem/pull/7) | Homepage and sign-out routing | Open | Actions and Vercel success | No review |
| [#8](https://github.com/mindsclub20/skilldrem/pull/8) | Roadmap enrollment atomicity | Open draft | Actions and Vercel success | No review |
| [#9](https://github.com/mindsclub20/skilldrem/pull/9) | Public Geornies and verified catalogue | Open | Actions and Vercel success | No review; public production gaps remain |
| [#10](https://github.com/mindsclub20/skilldrem/pull/10) | Project-state and architecture documentation | Open draft | Actions and Vercel success before this update | Updated documentation branch; keep draft pending review |
| [#1](https://github.com/mindsclub20/skilldrem/pull/1) | Unified learning workspace | Open draft | Not revalidated | GitHub reports not mergeable |

Review submissions were empty for all seven open PRs. PRs #4 and #5 need base divergence reconciled against current main. The latest GitHub Actions and Vercel status checks for PRs #4, #5, #7, #8, #9, and #10 were successful. The main commit's Vercel status was failing due to a build-rate-limit condition.

## Verified production gaps

- `/georny` resolves to `/auth/login`; the public-list requirement is not live.
- `/courses` and `/books` return HTTP 200 but show empty catalogue states.
- Supabase `resources`, `journeys`, and `milestones` tables report zero rows.
- `/workspace` and `/dashboard` resolve to login for unauthenticated requests.
- Public routes `/`, `/discover`, and `/sprint` return HTTP 200.
- Production checks were HTTP/SSR fetches. Browser Use could not run because its connected project reported insufficient credits; hydrated browser console, responsive viewport, and authenticated learner flows remain unverified.

## Current priorities

1. Audit PR #9 catalogue source provenance and every resource URL; then obtain authorized preview access and an independent review.
2. Reconcile PR #4 and #5 base divergence with current main; complete authenticated restore/save and onboarding failure/retry tests.
3. Verify PR #8 roadmap enrollment and PR #7 sign-out/auth redirects with an authorized test account.
4. Resolve the Vercel main-branch build-rate-limit blocker without purchasing or upgrading services unless the owner explicitly approves.
5. Address leaked-password protection through an owner-approved Supabase setting change.
6. Continue India-specific learning quality, dashboard next-best-action, AI reliability, and the self-hosted inference architecture.

## Recovery and safety

1. Read this file, `PROJECT_STATUS.md`, `ARCHITECTURE.md`, and `INTEGRATION_REGISTRY.md`.
2. Inspect the repository, open PRs, CI, and current production deployment before changing anything.
3. Use feature branches; never edit `main` directly.
4. Do not merge PRs, deploy production, apply migrations, modify production data/schema, change secrets, purchase services, or weaken RLS without the required owner approval.
5. Treat `FINAL_HANDOFF_REPORT.md` as a historical 2026-11-08 report; its project reference and integration state are superseded by this file.

## Run log — 2026-11-22

- Rechecked GitHub main, seven open PRs, latest CI/status checks, Vercel production and preview deployments, public route responses, Supabase schema, migration history, RLS policies, and advisors.
- Confirmed production remains on the older Learning Sprint commit; main's Vercel check is failing due to a build-rate-limit condition.
- Confirmed public Courses and Books remain empty and Geornies remains login-protected.
- No application code, production deployment, production data, schema, RLS, auth settings, or secrets changed.
