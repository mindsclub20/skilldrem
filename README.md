# SKILLDREM

**Smart Learning Roadmap Curator**  
*Find your knowledge. Find your tools. Find your path.*

AI-powered learning discovery platform: free/paid courses, open ebooks, AI mentors, and interactive **Georny** learning journeys.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS 4
- Supabase (Auth, Postgres, RLS)
- React Flow (`@xyflow/react`) for Georny graphs
- Deploy target: Vercel

## Setup

1. Copy `.env.local.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. `npm install`
3. `npm run dev`

## Database

Schema and RLS live in Supabase project `lxlbuljcecratjypmoxi`. Migrations were applied via Supabase MCP (`initial_skilldrem_schema`).

## Scripts

- `npm run dev` — development
- `npm run build` — production build
- `npm run lint` — ESLint

## Status

Foundation: auth, profiles, preferences, journeys, milestones, resources, dashboard, discovery shells, design system. Georny graph UI, admin CMS, seed data, and full multi-device polish are next.
