# SKILLDREM

**Smart Learning Roadmap Curator**  
*Find your knowledge. Find your tools. Find your path.*

Production: https://skilldrem.vercel.app  
Repo: https://github.com/mindsclub20/skilldrem  
Branch: `main`

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS 4
- **Supabase** Auth + Postgres + RLS (project `lxlbuljcecratjypmoxi`, eu-west-1)
- **Groq** primary LLM, **Gemini** fallback, optional **Firecrawl** search
- **@xyflow/react** for Georny graphs
- Deploy: **Vercel**

## Environment

```env
NEXT_PUBLIC_SUPABASE_URL=https://lxlbuljcecratjypmoxi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase anon key>

# Server-only (never NEXT_PUBLIC_)
GROQ_API_KEY=
GEMINI_API_KEY=
FIRECRAWL_API_KEY=
```

On Vercel, if `NEXT_PUBLIC_SUPABASE_ANON_KEY` is restricted, set `SUPABASE_ANON_KEY` — `next.config.ts` maps it for the client.

Never commit the service-role key. Never expose it in client bundles.

## Local run

```bash
npm install
cp .env.local.example .env.local   # fill keys
npm run dev
npm test
npm run typecheck
npm run build
```

## Features (current)

| Area | Status |
|------|--------|
| Auth (signup/login/logout/callback) | Done |
| Onboarding + preferences | Done |
| Dashboard + recent AI chats | Done |
| Discover (budget + free-first paths) | Done |
| AI Assistant (persistent multi-chat) | Done |
| Markdown rendering (sanitized) | Done |
| Search rank/filter for Discover | Done |
| Geornies + React Flow | Done |
| Courses / Books / Mentors | Done |
| Admin CMS | Done |
| RLS on `ai_sessions` (user-owned) | Done |

## Supabase notes

- Schema + RLS applied on project `lxlbuljcecratjypmoxi`
- `ai_sessions` has `title`, messages jsonb, RLS: `auth.uid() = user_id`
- Auth redirect after deploy:
  - Site URL: `https://skilldrem.vercel.app`
  - Redirect: `https://skilldrem.vercel.app/auth/callback`

## Content policy

Only legitimate free/open/paid resource links. No piracy facilitation.
