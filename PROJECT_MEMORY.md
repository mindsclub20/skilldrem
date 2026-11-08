# PROJECT_MEMORY.md — Skilldrem

**Last updated:** 2026-11-08 (Grok autonomous engineering run — final)
**Repository:** https://github.com/mindsclub20/skilldrem
**Production:** https://skilldrem.vercel.app
**Primary branch:** main
**Commits from this run:**
- `b81f656…` — full documentation suite
- `93c0640…` — middleware protects `/workspace` + `/georny`

## Original Product Objective
Skilldrem is an AI Smart Roadmap Curator focused on Indian (and global) learners. It helps users discover what to learn, understand prerequisites, generate personalized learning roadmaps ("Geornies"), discover credible free-first resources, organize learning into milestones, and track progress.

Tagline: *Find your knowledge. Find your tools. Find your path.* / *Learn Smarter. Build Skills. Reach Further.*

## Stack (verified from code)
- Next.js 15.5.28 (App Router) + TypeScript + Tailwind CSS 4
- Supabase Auth + Postgres + RLS (project ref: `lxlbuljcecratjypmoxi`, region eu-west-1)
- Groq (primary LLM) + Gemini (fallback)
- Firecrawl (optional search + scrape)
- @xyflow/react for Georny graphs
- Deployed on Vercel

## Environment Variable Names (never commit secrets)
```
NEXT_PUBLIC_SUPABASE_URL=https://lxlbuljcecratjypmoxi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GROQ_API_KEY=
GEMINI_API_KEY=   (or GOOGLE_GENERATIVE_AI_API_KEY)
FIRECRAWL_API_KEY=
```

## Key Routes & Features
| Route | Purpose | Status |
|-------|---------|--------|
| `/` | Marketing homepage | Working |
| `/auth/*` | Auth | Implemented |
| `/onboarding` | Preferences | Implemented |
| `/dashboard` | User hub | Implemented |
| `/discover` | Goal → free-first path | Working |
| `/assistant` | Persistent AI mentor | Protected |
| `/workspace` | Unified Learning Workspace | Protected (fixed this run) |
| `/api/ai/roadmap` + `/save` | Structured roadmap + persist | Implemented |
| `/api/ai/discover` | Firecrawl + LLM discovery | Implemented |
| `/georny` | Visual roadmaps | Protected (fixed this run) |
| Content + Admin | Courses/Books/Mentors/Admin | Implemented |

## Architecture Highlights
- AI provider abstraction with fallback (`src/lib/ai/provider.ts`).
- Firecrawl client with HTTPS-only + private-IP rejection.
- Roadmap system prompt forces structured JSON; no invented URLs.
- Discover cites only search-result URLs and labels free/paid carefully.
- Middleware now protects dashboard, onboarding, admin, assistant, **workspace**, **georny**.

## Database (inferred)
profiles, user_preferences, journeys, milestones, user_journeys, ai_sessions (RLS user-owned), resources. Live schema inspection blocked in this session.

## Connector State (final this run)
| Connector | State |
|-----------|-------|
| GitHub | A — Connected & verified (owner) |
| Supabase | C/F — Configured; connector permissions insufficient |
| Vercel | D — Documented only |
| Groq / Gemini / Firecrawl | B — Code complete; live keys untested here |

## Completed This Run
- Full forensic audit of live site + repository.
- Created PROJECT_MEMORY, PROJECT_STATUS, ARCHITECTURE, INTEGRATION_REGISTRY, CHANGELOG, TEST_REPORT, FINAL_HANDOFF_REPORT.
- Fixed middleware to protect `/workspace` and `/georny`.
- No production deploy; no secrets changed.

## Remaining / Next Recommended Actions
1. Verify Vercel env vars for Groq, Gemini, Firecrawl, Supabase.
2. Authenticated E2E: generate roadmap → save → mark progress.
3. Server-side progress persistence (replace client-only state).
4. Restore Supabase connector permissions → RLS + advisor audit.
5. Expand tests and consider rate limiting on AI routes.
6. Do **not** deploy or alter production configuration without explicit authorization.

## How to Recover in a New Conversation
1. Read this file + FINAL_HANDOFF_REPORT.md + INTEGRATION_REGISTRY.md.
2. Inspect https://github.com/mindsclub20/skilldrem (main).
3. Confirm production at https://skilldrem.vercel.app.
4. Re-check Supabase project `lxlbuljcecratjypmoxi` and Vercel env vars with proper credentials.
5. Never assume keys or RLS without verification.
