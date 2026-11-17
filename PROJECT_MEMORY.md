# PROJECT_MEMORY.md — Skilldrem

**Last verified:** 2026-11-17  
**Repository:** https://github.com/mindsclub20/skilldrem  
**Production:** https://skilldrem.vercel.app  
**Default branch:** `main`  
**Main commit inspected:** `8a01416ee6376c56e3d61b308235bba05e7457a7`

## Product objective

Skilldrem is an AI-powered learning and career-guidance platform for learners in India and globally. Core product areas include learning discovery, personalized roadmaps, free-first resources, Geornies, learner progress, and an AI learning assistant.

**AI architecture target:** The intended direction is an independently operated, self-hosted inference service using legally licensed open-weight models. The product should not depend on external cloud AI inference APIs. Do not claim a foundation model was trained from scratch. This target is not yet implemented by the current main branch; treat it as a tracked architecture gap.

## Verified technology and infrastructure

- Next.js 15.5.28, React 19, TypeScript, Tailwind CSS 4, Vitest.
- Vercel project: `skilldrem`, ID `prj_xthTxSYnrKSVqx3uW3kXZ151fc0m`.
- Connected Vercel team plan: Hobby.
- Active Supabase project: `ugabwprhvvwapjdzkieq`, region `eu-west-1`, Postgres 17.11.0.018, status `ACTIVE_HEALTHY`.
- The old reference `lxlbuljcecratjypmoxi` is stale and was not present in the connected Supabase organization project list. Do not use it for new configuration.
- Vercel environment-variable names are documented in `INTEGRATION_REGISTRY.md`; values are intentionally not recorded here.

## Deployment state

- Current main commit: `8a01416ee6376c56e3d61b308235bba05e7457a7` (Google sign-in and Supabase auth configuration).
- Current production deployment: `dpl_3i9p8mkBmoRj4L3oDTeeFkFNzCuM`, READY, deployed from main commit `1e64467a6812937f87c2215e102452680a17d3ab`.
- Production is behind main. Do not assume a successful GitHub commit check means production has been deployed.
- PR #9 preview is READY, but preview deployments are protected by Vercel SSO. Do not create a public share link or change protection without owner approval.

## Current AI implementation versus target

The current main code imports Groq and Gemini in `src/lib/ai/provider.ts`. The default provider order is Groq then Gemini; Firecrawl is optional for web discovery. Vercel has environment-variable entries for `GROQ_API_KEY`, `GEMINI_API_KEY`, and `FIRECRAWL_API_KEY`. Values remain secret and were not retrieved.

This is a code/configuration observation, not proof that live inference calls succeed. It also does not satisfy the intended self-hosted inference target. Do not silently add more cloud providers or represent this implementation as offline/self-hosted.

## Supabase state

- Remote migration history contains `20261110131631 initial_skilldrem_schema`, `20261110131641 user_milestone_progress`, `20261110131720 restrict_auth_trigger_function`, and `20261110131747 rls_policy_performance_tuning`.
- `user_milestone_progress` is already represented in remote migration history. Do not reapply its migration.
- All listed public tables have RLS enabled.
- Security advisor: leaked-password protection is disabled.
- Performance advisor: nine unused-index INFO findings; do not remove indexes without workload evidence.
- Health advisor: no findings.
- No production schema, learner data, auth settings, or secrets were changed in this checkpoint.

## Open pull requests

- [#4 — roadmap progress persistence](https://github.com/mindsclub20/skilldrem/pull/4): open; quality workflow successful; authenticated learner E2E and review remain.
- [#5 — onboarding reliability](https://github.com/mindsclub20/skilldrem/pull/5): open; quality workflows successful; authenticated learner E2E and review remain.
- [#7 — homepage and sign-out routing](https://github.com/mindsclub20/skilldrem/pull/7): open; quality workflow successful; no submitted review or authenticated login/logout E2E.
- [#8 — roadmap enrollment](https://github.com/mindsclub20/skilldrem/pull/8): open draft; quality workflow successful; authenticated E2E and review remain.
- [#9 — public Geornies and verified catalogue](https://github.com/mindsclub20/skilldrem/pull/9): open; quality workflow successful; preview READY but protected by SSO; not live in production.
- [#1 — unified learning workspace](https://github.com/mindsclub20/skilldrem/pull/1): old draft; requires fresh review before any release consideration.

## Verified production gaps

- `/georny` redirects unauthenticated visitors to login; the public-list requirement is not live.
- `/courses` and `/books` return empty catalogue states.
- `/workspace` and `/dashboard` correctly redirect unauthenticated visitors to login.
- Public routes `/`, `/discover`, `/sprint`, and `/auth/login` return HTTP 200.
- SSR/CSS snapshots showed no horizontal overflow at 1440px, 390px, or 320px. Live hydrated-browser console verification was blocked by browser-proxy connectivity and remains unverified.

## Recovery and safety

1. Read this file, `PROJECT_STATUS.md`, `ARCHITECTURE.md`, and `INTEGRATION_REGISTRY.md`.
2. Inspect the repository, open PRs, and the current production deployment before changing anything.
3. Use feature branches; never edit `main` directly.
4. Do not merge PRs, deploy production, apply migrations, modify production data/schema, change secrets, or weaken RLS without the required owner approval.
5. Treat `FINAL_HANDOFF_REPORT.md` as a historical 2026-11-08 report; its project reference and integration state are superseded by this file.
