# INTEGRATION_REGISTRY.md — Skilldrem

**Current infrastructure checkpoint:** 2026-11-22  
**Repository:** https://github.com/mindsclub20/skilldrem  
**Main commit:** `8a01416ee6376c56e3d61b308235bba05e7457a7`

| Integration | Current observed state | Verification | Limitations / next action |
|---|---|---|---|
| GitHub | Connected; repository and main branch readable; seven open PRs | Main commit `8a01416ee6376c56e3d61b308235bba05e7457a7`; PRs #1, #4, #5, #7, #8, #9, #10 inspected | No submitted reviews. Latest Actions and Vercel checks pass on PRs #4/#5/#7/#8/#9/#10. Main Vercel status fails with a build-rate-limit condition. PRs #4 and #5 have a base SHA behind current main. |
| Vercel | Connected project `skilldrem`; Hobby team; verified custom domain | Project ID `prj_xthTxSYnrKSVqx3uW3kXZ151fc0m`; domain `skilldrem.vercel.app` verified; production deployment READY | Production is still on commit `1e64467a6812937f87c2215e102452680a17d3ab`, behind main. Project-level latest-deployment pointer references a READY PR #5 preview. Preview deployments are SSO-protected. Browser Use reported insufficient credits, so no hydrated or authenticated browser testing was done. |
| Supabase | Connected; project ACTIVE_HEALTHY | Project `ugabwprhvvwapjdzkieq`, region `eu-west-1`, Postgres 17.11.0.018; eight public tables, all with RLS enabled; 19 public-schema policies inspected | Four own-user policies on `user_milestone_progress`; migration is already applied. Security advisor warns leaked-password protection is disabled. Performance advisor reports nine unused-index INFO findings. Health advisor has no findings. |
| Groq | Provider code and Vercel variable entry were observed in the 2026-11-17 code/config inspection | `src/lib/ai/groq.ts`, `src/lib/ai/provider.ts`, `GROQ_API_KEY` metadata | Live inference not tested in this checkpoint; cloud inference conflicts with intended self-hosted target. |
| Gemini | Provider code and Vercel variable entry were observed in the 2026-11-17 code/config inspection | `src/lib/ai/gemini.ts`, `src/lib/ai/provider.ts`, `GEMINI_API_KEY` metadata | Live inference not tested in this checkpoint; cloud inference conflicts with intended self-hosted target. |
| Firecrawl | Optional client and Vercel variable entry were observed in the 2026-11-17 code/config inspection | `src/lib/ai/firecrawl.ts`, `FIRECRAWL_API_KEY` metadata | Live search/scrape not tested in this checkpoint; confirm whether it remains necessary for the self-hosted product design. |
| LangSearch | Vercel variable name `LANGSEARCH_APIKEY` was observed in the 2026-11-17 environment metadata inspection | Environment metadata only | Code usage and live functionality not verified. |

## Vercel deployment evidence — 2026-11-22

- Production deployment: `dpl_3i9p8mkBmoRj4L3oDTeeFkFNzCuM`, READY, target production, commit `1e64467a6812937f87c2215e102452680a17d3ab`.
- Production aliases include `skilldrem.vercel.app`; the custom domain is verified.
- Current main commit: `8a01416ee6376c56e3d61b308235bba05e7457a7`. Its Vercel status target points to a build-rate-limit condition. No production deployment was made.
- The project-level latest-deployment pointer is preview deployment `dpl_7AwRhnkN5siymwKU95tvcS5cogAz`, from PR #5, and is READY. It is not the production deployment.
- Vercel SSO protection is enabled for non-custom deployment URLs. No public preview share link was created.
- Aggregated runtime-error query returned no errors in the last seven days.
- Public HTTP/SSR checks: `/`, `/discover`, and `/sprint` return 200; `/courses` and `/books` return 200 with empty states; `/georny` resolves to `/auth/login`; `/workspace` and `/dashboard` resolve to `/auth/login`.
- Browser Use could not run because its connected project reported insufficient credits. Hydrated browser console, viewport, and authenticated flow checks remain outstanding.

## GitHub Actions and review evidence — 2026-11-22

| PR | Head commit | GitHub Actions | Vercel status | Review submissions |
|---|---|---|---|---|
| #4 | `e2b16fbfe185bd8c4948f535f2d6039993f0b998` | Success (runs #44762819134, #44762819117) | Success | None |
| #5 | `4facde886c7b607eb89b9098bb2f266bdf010f68` | Success (runs #44911583844, #44911583811) | Success | None |
| #7 | `6d4576eb9381491c7dd24800ac711f2f07180371` | Success (run #43724661311) | Success | None |
| #8 | `a787cf7d9e7d650b0fcd8c191ac9910f149b1dd2` | Success (run #43552067710) | Success | None |
| #9 | `30fbd2b450c194fc1ac04ce0d4d3216d3a1bc98c` | Success (run #43847633372) | Success | None |
| #10 | `d724c3039c4048969acbd2e1a7b1ae8f842a2d86` | Success (run #44097553895) | Success | None |

PR #4 and #5 report base SHA `1e64467`, while current main is `8a01416`; reconcile before merge consideration. PR #8 and #10 remain drafts. PR #1 is also an old draft and GitHub reports it as not mergeable. No PR was merged.

## Supabase migration history — 2026-11-22

The connected project reports:

- `20261110131631 initial_skilldrem_schema`
- `20261110131641 user_milestone_progress`
- `20261110131720 restrict_auth_trigger_function`
- `20261110131747 rls_policy_performance_tuning`

The milestone-progress migration is already present in remote history, and the `public.user_milestone_progress` table exists. Never blindly reapply it.

## Supabase RLS and advisors — 2026-11-22

- All eight listed public tables have RLS enabled.
- Nineteen public-schema policies were inspected. The progress table has authenticated own-user SELECT/INSERT/UPDATE/DELETE policies. Profile, preference, AI-session, and user-journey access is user-scoped. Journey/milestone reads are limited to published or owned journeys. Resources have a published-read policy.
- Security advisor: leaked-password protection disabled (WARN). Remediation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- Performance advisor: nine unused-index INFO findings; no indexes were removed.
- Health advisor: no findings.
- Aggregate counts show zero rows in resources, journeys, milestones, user_journeys, user_preferences, and user_milestone_progress; profiles has one row and ai_sessions has two. No row contents were read or modified.
- No production migration, schema, data, RLS policy, auth setting, or secret was changed.

## Environment variable names

Names observed in Vercel metadata or the repository example:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_ANON_KEY`
- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY` (documented Gemini alias)
- `FIRECRAWL_API_KEY`
- `LANGSEARCH_APIKEY`

No secret values are recorded here. Metadata presence does not prove a secret is valid or that an integration succeeds. Provider source/configuration observations above were last inspected on 2026-11-17, not revalidated in the 2026-11-22 checkpoint.

## Security and operational rules

- Never expose secret values or move inference credentials to client-side code.
- Never weaken authentication or RLS.
- Never apply the progress migration again; it is already in remote migration history.
- Do not merge PRs or deploy production without explicit owner approval and all release gates.
- Do not create public preview share links or change Vercel SSO protection without owner approval.
- No production environment variables, database settings, learner data, or deployment configuration were changed in the 2026-11-22 checkpoint.
