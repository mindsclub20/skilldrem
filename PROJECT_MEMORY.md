# PROJECT_MEMORY.md — Skilldrem

**Last updated:** 2026-11-08 (Grok autonomous engineering run)
**Repository:** https://github.com/mindsclub20/skilldrem
**Production:** https://skilldrem.vercel.app
**Primary branch:** main
**Latest inspected commit SHA (tree):** 1661b86b32bb2865ebbac91ec20dc738e6cb4c13

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
Optional mapping in next.config.ts for SUPABASE_ANON_KEY if needed on Vercel.

## Key Routes & Features (from live site + code)
| Route | Purpose | Status |
|-------|---------|--------|
| `/` | Marketing homepage | Working |
| `/auth/signup`, `/auth/login`, `/auth/logout`, `/auth/callback` | Auth | Implemented |
| `/onboarding` | Preferences | Implemented |
| `/dashboard` | User hub + recent chats | Implemented |
| `/discover` | Goal → budget-aware free-first path + Firecrawl | Working (public) |
| `/assistant` | Persistent multi-chat AI mentor | Protected |
| `/workspace` | Unified Learning Workspace (roadmap gen, progress, mentor entry, resources) | Core implemented; progress client-side |
| `/api/ai/chat` | Chat completions | Implemented |
| `/api/ai/discover` | Discovery engine (Firecrawl + LLM) | Implemented |
| `/api/ai/roadmap` | Structured roadmap JSON generation | Implemented (auth required) |
| `/api/ai/roadmap/save` | Persist journey + milestones + user_journeys | Implemented |
| `/georny`, `/georny/[id]` | Visual roadmaps | Implemented |
| `/courses`, `/books`, `/mentors` | Content sections | Implemented |
| `/admin` | CMS | Implemented |

## Architecture Highlights
- AI provider abstraction: `src/lib/ai/provider.ts` with `completeWithFallback` (Groq → Gemini).
- Firecrawl client with HTTPS-only + private-IP rejection safety.
- Resource ranking/filter in `resource-filter.ts`.
- Roadmap system prompt forces structured JSON with stages/milestones/practice/resources_hint (no invented URLs).
- Discover system prompt enforces free-first labeling and only cites search-result URLs.
- Supabase SSR clients + middleware session refresh.
- Middleware protects `/dashboard`, `/onboarding`, `/admin`, `/assistant`. Note: `/workspace` is **not** currently in the protected list (inconsistency).

## Database (from types + save route + notes)
Inferred / documented tables:
- `profiles`
- `user_preferences`
- `journeys`
- `milestones`
- `user_journeys`
- `ai_sessions` (title, messages jsonb, RLS: auth.uid() = user_id)
- Resources, Geornies (seeded)
Migrations applied historically via Supabase MCP (enable_pg_trgm, initial_schema, seed_demo).

**Note:** Current Grok session has limited Supabase connector permissions (list_tables / execute_sql / advisors return permission errors). Schema verification incomplete in this run.

## Connector State (this run)
| Connector | State |
|-----------|-------|
| GitHub | A — Connected & verified (owner: mindsclub20, full read/write) |
| Supabase | C/F — Configured in code, project ref known, but connector permissions insufficient for schema/query |
| Vercel | D — Documented only (no Vercel connector available in this session) |
| Groq | B — Code complete; runtime key presence unverified here |
| Gemini | B — Code complete; runtime key presence unverified here |
| Firecrawl | B — Code complete with safety; optional (degrades gracefully) |

## Completed Work (prior + this run)
- Full foundation: auth, onboarding, dashboard, discover, assistant, workspace, Georny, content pages, admin.
- AI provider fallback, Firecrawl integration, structured roadmap + save.
- This run: forensic audit of live site + entire repo tree, recovery of architecture, creation of all PROJECT_* docs.

## Remaining / Next Recommended Actions
1. Protect `/workspace` in middleware (add to isProtected).
2. Persist progress (learner_progress or milestone completion) to Supabase instead of client-only state.
3. Verify live API keys on Vercel and run end-to-end roadmap + discover tests with real keys.
4. Expand automated tests beyond resource-filter / url-safety.
5. Confirm current Groq/Gemini model IDs against provider docs (code uses `openai/gpt-oss-20b` and `gemini-3.8-flash`).
6. Full RLS audit once Supabase connector permissions are restored.
7. Do **not** deploy to production without explicit authorization.

## Important Files
- `src/lib/ai/provider.ts`, `groq.ts`, `gemini.ts`, `firecrawl.ts`
- `src/app/api/ai/roadmap/route.ts`, `.../save/route.ts`, `.../discover/route.ts`
- `src/app/workspace/WorkspaceClient.tsx`
- `src/lib/supabase/*`, `src/middleware.ts`
- `src/types/database.ts`
- `README.md`

## How to Recover in a New Conversation
1. Read this file + PROJECT_STATUS.md + INTEGRATION_REGISTRY.md.
2. Clone / inspect https://github.com/mindsclub20/skilldrem (main).
3. Confirm production at https://skilldrem.vercel.app.
4. Re-check Supabase project `lxlbuljcecratjypmoxi` and Vercel env vars.
5. Never assume keys or RLS without verification.
