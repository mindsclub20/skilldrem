# Database migration history

1. `enable_pg_trgm` — text search support
2. `initial_skilldrem_schema` — full schema + RLS + triggers
3. `seed_demo_georny_and_resources` — demo Geornies + legitimate free resources

Historical project used when these initial notes were recorded: `lxlbuljcecratjypmoxi` (eu-west-1).

**Current Authgear deployment target:** The connected Vercel Skilldrem project currently has `NEXT_PUBLIC_SUPABASE_URL=https://ugabwprhvvwapjdzkieq.supabase.co`. Treat this Vercel value as the current deployment target, not the historical project reference above. Before applying any new migration, verify the connected Supabase project URL and ensure its Custom OIDC issuer is configured for Authgear. Do not apply the Authgear migrations to the historical project unless the deployment environment is intentionally switched back.
