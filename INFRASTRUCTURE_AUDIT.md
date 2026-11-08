# INFRASTRUCTURE_AUDIT.md — Skilldrem

**Date:** 2026-11-08 (Master Execution 2)

## Vercel
- Production URL https://skilldrem.vercel.app — live
- Env names: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY), GROQ_API_KEY, GEMINI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY, FIRECRAWL_API_KEY
- No production env mutation this run

## Supabase
- Project lxlbuljcecratjypmoxi (eu-west-1)
- Connector: list_tables / SQL / advisors permission denied
- Schema inferred from code: profiles, user_preferences, journeys, milestones, user_journeys, ai_sessions, resources
- user_milestone_progress migration authored, not applied

## AI
- Groq primary (openai/gpt-oss-20b), Gemini fallback (gemini-3.8-flash)
- Firecrawl optional with HTTPS/public URL safety
- Live key tests blocked (no keys in session)

## Middleware
- Protects /dashboard, /onboarding, /admin, /assistant, /workspace, /georny
- Live: /workspace redirects unauthenticated users to login — verified
