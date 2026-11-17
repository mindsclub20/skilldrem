# ARCHITECTURE.md — Skilldrem

**Verified against main:** 2026-11-17

## High-level system

Skilldrem is a Next.js 15.5.28 App Router application deployed on Vercel. Supabase provides authentication and the application database. Server routes handle AI operations and user-owned data access; the browser renders the learning workspace and public discovery pages.

```
Browser
  -> Vercel / Next.js App Router
      -> Supabase SSR middleware (session refresh and route protection)
      -> Public pages: home, discover, sprint, courses, books
      -> Protected pages: assistant, dashboard, workspace, admin, Georny
      -> Server API routes
          -> AI provider abstraction (current: Groq and Gemini)
          -> Optional Firecrawl search/scrape client
          -> Supabase server client and RLS-protected tables
```

## Authentication and authorization

- Supabase Auth is used with server-side session handling.
- The auth callback uses a same-origin safe redirect helper.
- Middleware protects authenticated learning and admin surfaces.
- Server API routes must independently validate the session and resource ownership; UI hiding is not authorization.
- RLS is enabled on the listed public tables. Verify policies and ownership checks before changing data access.
- Google OAuth code exists on main, but successful provider login has not been verified with an authorized test account.

## AI layer — current implementation

- `src/lib/ai/provider.ts` imports `GroqProvider`, `GeminiProvider`, and `FirecrawlClient`.
- `getAIProvider(preferred?)` selects a configured provider.
- `completeWithFallback()` defaults to Groq then Gemini; callers may prefer Gemini.
- `src/lib/ai/firecrawl.ts` supports optional search/scrape and applies public-HTTPS URL validation.
- Environment-variable names include `GROQ_API_KEY`, `GEMINI_API_KEY` (or `GOOGLE_GENERATIVE_AI_API_KEY`), and `FIRECRAWL_API_KEY`. Secret values must remain server-side and must never appear in documentation or logs.
- Current implementation and configured variable entries do not prove successful live inference; no live provider call was made in this checkpoint.

## Required AI target architecture

The intended product direction is self-hosted inference using legally licensed open-weight models under owner-controlled infrastructure, without external cloud AI inference APIs. The current Groq/Gemini code does not satisfy this target.

A future migration must document:
1. Model and license selection.
2. Inference runtime and deployment boundary.
3. Hardware/hosting requirements and cost.
4. Quantization and latency expectations.
5. Prompt, output validation, safety, and observability.
6. Rate limits, failure handling, and rollback plan.

Do not claim a foundation model was trained from scratch unless that work is genuinely performed and evidenced. Do not remove existing providers or change production configuration without an approved migration plan.

## Data model

The current Supabase schema includes profiles, preferences, journeys, milestones, enrollments, resources, AI sessions, and milestone progress. Confirm the live schema before relying on this summary.

- User-owned records require RLS and server-side ownership checks.
- The remote migration history includes `20261110131641 user_milestone_progress`; it must not be reapplied.
- Current production data volume is small. Do not remove indexes solely because the advisor labels them unused.

## Deployment topology

- Vercel project: `skilldrem` (`prj_xthTxSYnrKSVqx3uW3kXZ151fc0m`).
- Production domain: `https://skilldrem.vercel.app`.
- Supabase project: `ugabwprhvvwapjdzkieq` in `eu-west-1`.
- Current main and production commits differ; production release must be separately verified.
- Preview deployments use Vercel SSO protection. Do not create public share links or weaken protection without approval.
