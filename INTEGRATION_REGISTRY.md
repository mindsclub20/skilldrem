# INTEGRATION_REGISTRY.md — Skilldrem

| Connector | Previous State | Current State (this audit) | Modifications | Verification |
|-----------|----------------|----------------------------|---------------|--------------|
| GitHub | Documented | **A — Connected & verified** (owner mindsclub20, full R/W) | Docs committed | Tree + file reads + push capability confirmed |
| Vercel | Documented | **D — Documented only** | None | No Vercel connector in session; production URL live |
| Supabase | Documented (lxlbuljcecratjypmoxi) | **C/F — Configured, connector access limited** | None | list_projects empty / SQL & advisors permission denied |
| Groq | Documented | **B — Code complete, untested live** | None | Provider class + env name GROQ_API_KEY present |
| Gemini | Documented | **B — Code complete, untested live** | None | Provider class + GEMINI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY |
| Firecrawl | Documented | **B — Code complete, optional** | None | Client + safety checks; degrades if key missing |

## Environment Variable Names (authoritative from .env.local.example + code)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or mapped `SUPABASE_ANON_KEY`)
- `GROQ_API_KEY`
- `GEMINI_API_KEY` (alias `GOOGLE_GENERATIVE_AI_API_KEY`)
- `FIRECRAWL_API_KEY`

Never commit or log secret values.
