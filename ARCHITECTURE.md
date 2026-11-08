# ARCHITECTURE.md — Skilldrem

## High-Level
Next.js 15 App Router application with server-side AI routes, Supabase for auth + data, and client-side progressive enhancement for the learning workspace.

```
Browser
  → Next.js (Vercel)
      → Middleware (session refresh + route protection)
      → App Router pages (marketing, discover, workspace, assistant, …)
      → API Routes (/api/ai/*)
            → AI Provider abstraction (Groq | Gemini)
            → FirecrawlClient (optional)
            → Supabase server client (auth + RLS-protected tables)
```

## AI Layer
- `getAIProvider(preferred?)` / `completeWithFallback()`
- Order default: Groq → Gemini
- Structured outputs enforced via system prompts + JSON extraction for roadmaps
- Firecrawl: `/v1/search` and `/v1/scrape` with public-HTTPS-only validation

## Data Model (from TypeScript types + write paths)
- **profiles** — user identity + onboarding flag
- **user_preferences** — experience, budget, hours, interests
- **journeys** + **milestones** — learning paths (AI-generated can be saved)
- **user_journeys** — enrollment / progress_percent
- **ai_sessions** — chat history (user-owned RLS)
- Resources / Geornies (content + seed)

## Auth
Supabase Auth with SSR cookie handling. Protected routes enforced in middleware for a subset of paths. Auth callback at `/auth/callback`.

## Security Boundaries
- API keys only on server (never NEXT_PUBLIC_ for AI/Firecrawl)
- URL safety checks before scrape
- Resource filter ranks free-first results
- Sanitized markdown rendering
- RLS intended on user-owned tables (verification incomplete this run)
