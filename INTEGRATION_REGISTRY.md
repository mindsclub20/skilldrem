# INTEGRATION_REGISTRY.md — Skilldrem

**Verified:** 2026-11-17  
**Repository:** https://github.com/mindsclub20/skilldrem

| Integration | Current observed state | Verification | Limitations / next action |
|---|---|---|---|
| GitHub | Connected; repository and main branch readable | Main commit `8a01416ee6376c56e3d61b308235bba05e7457a7`; open PRs #4, #5, #7, #8, #9, #1 inspected | PRs remain open; no submitted reviews were found |
| Vercel | Connected project `skilldrem`; Hobby team | Project ID `prj_xthTxSYnrKSVqx3uW3kXZ151fc0m`; production deployment READY | Production still runs commit `1e64467a6812937f87c2215e102452680a17d3ab`, behind main; preview is SSO-protected |
| Supabase | Connected; ACTIVE_HEALTHY | Project `ugabwprhvvwapjdzkieq`, region `eu-west-1`, Postgres 17.11.0.018; migrations and RLS inspected | Do not use stale project ref `lxlbuljcecratjypmoxi`; do not reapply progress migration |
| Groq | Provider code and Vercel variable entry present | `src/lib/ai/groq.ts`, `src/lib/ai/provider.ts`, `GROQ_API_KEY` metadata | Live inference not tested; cloud inference conflicts with intended self-hosted target |
| Gemini | Provider code and Vercel variable entry present | `src/lib/ai/gemini.ts`, `src/lib/ai/provider.ts`, `GEMINI_API_KEY` metadata | Live inference not tested; cloud inference conflicts with intended self-hosted target |
| Firecrawl | Optional client and Vercel variable entry present | `src/lib/ai/firecrawl.ts`, `FIRECRAWL_API_KEY` metadata | Live search/scrape not tested; confirm whether it remains required for the self-hosted product design |
| LangSearch | Vercel variable name `LANGSEARCH_APIKEY` observed | Environment metadata only | Code usage and live functionality not verified |

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

No secret values are recorded here. Metadata presence does not prove a secret is valid or that the integration succeeds.

## Supabase migration history

The connected project reports these migrations:

- `20261110131631 initial_skilldrem_schema`
- `20261110131641 user_milestone_progress`
- `20261110131720 restrict_auth_trigger_function`
- `20261110131747 rls_policy_performance_tuning`

The milestone-progress migration is already present in remote history. Never blindly reapply it.

## Security and operational notes

- All listed public tables have RLS enabled.
- Security advisor: leaked-password protection is disabled.
- Performance advisor: nine unused-index INFO findings; no index removal was performed.
- Health advisor: no findings.
- No production environment variables, database settings, data, or deployment configuration were changed in this checkpoint.
