# INTEGRATION_REGISTRY.md — Skilldrem

**Updated:** 2026-11-08 (Master Execution 2)

| Connector | Previous State | Current State | Changes | Verification |
|-----------|----------------|---------------|---------|--------------|
| GitHub | A | A — Connected & verified | Progress APIs, migration, WorkspaceClient, docs | Tree, commits, push |
| Vercel | D | D — Documented only | None | Production URL live |
| Supabase | C/F | C/F — Configured, limited perms | Migration authored (not applied) | list_tables denied |
| Groq | B | B — Code complete, untested live | None | Provider + env confirmed |
| Gemini | B | B — Code complete, untested live | None | Provider + env confirmed |
| Firecrawl | B | B — Code complete, optional | None | Client + safety confirmed |

## Environment variable names
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY)
- GROQ_API_KEY
- GEMINI_API_KEY (alias GOOGLE_GENERATIVE_AI_API_KEY)
- FIRECRAWL_API_KEY
