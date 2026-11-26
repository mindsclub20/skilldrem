## Vercel environment variables

Set these for the Skilldrem deployment:

- `NEXT_PUBLIC_AUTHGEAR_ENDPOINT=https://hazard-vaa5a1.authgear.cloud`
- `NEXT_PUBLIC_AUTHGEAR_CLIENT_ID=2b273d19926b6daa`
- `NEXT_PUBLIC_SUPABASE_URL=https://ugabwprhvvwapjdzkieq.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<the project's publishable/anon key>` — required by the browser Supabase client; this public key is designed to be exposed and must be protected by RLS.
- `SUPABASE_ANON_KEY=<the same publishable/anon key>` — server-side alias used by protected API routes; the server falls back to the public variable if this alias is absent.

Use the same Supabase publishable/anon key for both Supabase key variables. Never place a service-role key in either variable or in browser code. There is no `AUTHGEAR_CLIENT_SECRET` variable. The Vercel project environment was inspected without decrypting secrets: its current `NEXT_PUBLIC_SUPABASE_URL` is `https://ugabwprhvvwapjdzkieq.supabase.co`. The older `lxlbuljcecratjypmoxi` project reference in the initial schema notes is historical and must not be used for this Authgear deployment unless the Vercel URL is intentionally changed. Confirm that Supabase Custom OIDC and both migrations target `ugabwprhvvwapjdzkieq`.

