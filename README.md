# SKILLDREM

**Smart Learning Roadmap Curator**  
*Find your knowledge. Find your tools. Find your path.*

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS 4
- **Supabase** Auth + Postgres + RLS (project `lxlbuljcecratjypmoxi`, region eu-west-1)
- **@xyflow/react** for interactive Georny graphs
- Deploy target: **Vercel** (not configured in this phase)

## Environment

```env
NEXT_PUBLIC_SUPABASE_URL=https://lxlbuljcecratjypmoxi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable/anon key from Supabase dashboard>
```

Never commit the service-role key. Never expose it in client bundles.

## Local run

```bash
npm install
cp .env.local.example .env.local   # fill anon key
npm run dev
```

## What is implemented

| Area | Status |
|------|--------|
| Database schema (22 tables) + RLS | Done (Supabase) |
| Seed: 2 Geornies + 8 resources | Done |
| Auth (signup/login/logout/callback) | Done |
| Onboarding → user_preferences | Done |
| Landing + design system | Done |
| Dashboard | Done |
| Discover / Courses / Books / Mentors | Done |
| Georny list + detail + React Flow graph | Done |
| Admin CMS (server-side is_admin check) | Done |
| AI provider abstraction (stub, no live keys) | Done |
| Vercel project / production deploy | **Not done — hand off** |

## Supabase migrations applied

1. `enable_pg_trgm`
2. `initial_skilldrem_schema`
3. `seed_demo_georny_and_resources`

## Auth redirect URLs to configure in Supabase

After Vercel deploy, add to Supabase Auth → URL configuration:

- Site URL: production URL
- Redirect: `https://<prod>/auth/callback`

## Admin access

Set `profiles.is_admin = true` for a user id (SQL) or insert into `admin_roles`.

## License / content policy

Only legitimate free/open/paid resource links. No piracy facilitation.
