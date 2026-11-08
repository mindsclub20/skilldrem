# PROJECT_MEMORY.md — Skilldrem

**Last updated:** 2026-11-08 (Master Execution 2 — Grok)
**Repository:** https://github.com/mindsclub20/skilldrem
**Production:** https://skilldrem.vercel.app
**Primary branch:** main

## Original Product Objective
AI Smart Roadmap Curator for India (and global learners): discover paths, free-first resources, personalized Geornies, milestone progress.

## Stack
Next.js 15.5.28 + TypeScript + Tailwind 4 + Supabase (lxlbuljcecratjypmoxi, eu-west-1) + Groq primary + Gemini fallback + optional Firecrawl + Vercel.

## Environment variable names
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY), GROQ_API_KEY, GEMINI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY, FIRECRAWL_API_KEY.

## Completed (prior + this run)
- Auth, onboarding, dashboard, discover, assistant, workspace, Georny, content, admin
- Middleware protects dashboard, onboarding, admin, assistant, **workspace**, **georny** (live verified)
- Roadmap generate + save to journeys/milestones/user_journeys
- **NEW:** `/api/ai/roadmap/progress` GET/POST, `/api/ai/roadmap/list`, migration SQL for `user_milestone_progress` + RLS, PROGRESS_PERSISTENCE.md, INFRASTRUCTURE_AUDIT.md

## Outstanding
- Apply migration on production Supabase (authorization required)
- Live AI key verification
- Full authenticated progress restore E2E
- Supabase connector permissions for advisors/schema
- Rate limiting on AI routes

## Connector state
| Connector | State |
|-----------|-------|
| GitHub | A |
| Vercel | D |
| Supabase | C/F |
| Groq / Gemini / Firecrawl | B |

## How to recover
1. Read this file + FINAL_HANDOFF_REPORT.md + INTEGRATION_REGISTRY.md + PROGRESS_PERSISTENCE.md
2. Inspect https://github.com/mindsclub20/skilldrem main
3. Confirm production https://skilldrem.vercel.app
4. Do not apply migrations or change production secrets without explicit authorization
