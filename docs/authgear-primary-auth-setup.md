# Skilldrem — Authgear primary authentication

Skilldrem uses Authgear as its identity provider and Supabase as its database/API platform. The browser uses Authgear's public SPA SDK with Authorization Code + PKCE. No Authgear client secret is stored or required by this integration.

## Authgear application

The supplied application must be an **Authgear Single Page Application (public client)**. Enable **Issue JWT as access token** in its Access Token settings.

Configure these exact URIs in the Authgear application:

- Local authorized redirect: `http://localhost:3000/auth/callback`
- Production authorized redirect: `https://skilldrem.vercel.app/auth/callback`
- Current Vercel main-branch alias authorized redirect: `https://skilldrem-git-main-bvshyam7-4334.vercel.app/auth/callback`
- Current Authgear implementation preview redirect: `https://skilldrem-n374j2to6-bvshyam7-4334.vercel.app/auth/callback`
- Local post-logout redirect: `http://localhost:3000`
- Production post-logout redirect: `https://skilldrem.vercel.app`
- Current Vercel main-branch alias post-logout redirect: `https://skilldrem-git-main-bvshyam7-4334.vercel.app`
- Preview post-logout redirect: `https://skilldrem-n374j2to6-bvshyam7-4334.vercel.app`

**Verified Vercel state — 26 November 2026:** `skilldrem.vercel.app` is verified and attached to the Skilldrem project. It is an alias of READY production deployment `dpl_3i9p8mkBmoRj4L3oDTeeFkFNzCuM`, built from main commit `1e64467a6812937f87c2215e102452680a17d3ab`. The most recent main-target deployment record is CANCELED, but the earlier READY production deployment remains and retains the production alias. Do not treat the Authgear branch preview as production.

Authgear redirect URI matching is exact. Register only the origins intended for testing and production. Preview deployment URLs can change when new deployments are created; update the Authgear allowlist only when a specific preview must be tested.

The Authgear access token must contain:

- `iss`: `https://hazard-vaa5a1.authgear.cloud`
- `aud`: the Authgear project endpoint (Authgear's JWT access-token documentation specifies the project endpoint as the access-token audience; the client ID is a separate `client_id` claim)
- `client_id`: `2b273d19926b6daa`
- `sub`: a UUID
- `role`: `authenticated`
- `email`: present in the JWT for verified-email account linking
- `https://authgear.com/claims/user/is_verified`: `true`, with Authgear's verification rule configured to require a verified email

Configure the `role=authenticated` and `email` claims using Authgear's JWT access-token custom-claims hook. In Authgear's Authentication → Login Methods → Verification settings, configure the verified-user condition to require a verified email; the JWT must then contain `https://authgear.com/claims/user/is_verified: true`. Do not derive authorization roles from user-editable profile metadata. Keep the token signing algorithm at RS256.

## Live provider metadata check

The configured Authgear discovery URL is reachable and reports the expected issuer `https://hazard-vaa5a1.authgear.cloud`, an RS256 JWKS endpoint, Authorization Code and Refresh Token grants, and `S256` PKCE support. Its token endpoint advertises `none` as a supported client authentication method, consistent with a public client. The JWKS currently publishes an RS256 RSA signing key. This confirms public OIDC metadata only; it does **not** prove that the Authgear application has enabled JWT access tokens, added the custom `role` and `email` claims, or configured verified-email rules. Those require an authenticated Authgear Portal check and a real test login.

## Supabase third-party authentication

In the Skilldrem Supabase project:

1. Open **Authentication → Third-Party Auth**.
2. Add a **Custom OIDC** provider.
3. Set the issuer URL to `https://hazard-vaa5a1.authgear.cloud`.
4. Save and verify that the provider is enabled.

Supabase must be configured to trust Authgear's OIDC discovery/JWKS endpoints before protected Data API requests will work. This setting has not yet been verified through the connected Supabase project tools.

## Database migrations

Review these migrations and test them in an approved staging environment before any production application:

- `supabase/migrations/20261126120000_authgear_primary_auth.sql` removes foreign keys that require every application identity to exist in `auth.users`, while retaining UUID ownership columns and RLS policies based on `auth.uid()`. The profile admin-flag trigger blocks privilege escalation on both INSERT and UPDATE. It also revokes broad anonymous table, sequence, and function privileges in the public schema, then grants only column-level SELECT on published journeys, resources, and milestones. Owner-aware reads remain authenticated-only; anonymous policies are published-only.
- `supabase/migrations/20261126130000_atomic_roadmap_save.sql` adds an RLS-respecting RPC that inserts the journey, all milestones, and the user's enrollment in one database transaction. If any insert fails, the entire save rolls back; the API no longer reports success when enrollment fails.
- `supabase/tests/anon_public_access.sql` is a read-only post-migration verification script. Run it after the primary-auth migration to verify effective anonymous table, column, sequence, function, and default privileges.

Public pages must use the explicit projections in `src/lib/supabase/public-select.ts`; do not replace them with `.select("*")`. The migration does not change the global default `PUBLIC EXECUTE` grant for future functions because that change affects every schema. New public-schema functions must explicitly revoke execution from `PUBLIC` and `anon`; a broader cross-schema default-privilege change remains a separate review item.

Do not apply either migration to production until the Authgear claims, Supabase Custom OIDC trust, account-linking behavior, anonymous least-privilege verification, and cross-user data isolation have been independently verified and the owner has approved the production change.

Authgear documents its generated `sub` as a UUID. The server also rejects non-UUID subjects. Authgear documents the JWT access-token `aud` as the project endpoint (while the ID token audience is the client ID); the server therefore verifies the endpoint audience and separately checks `client_id`. Authgear's `is_verified` access-token claim is a JSON boolean; the SQL RLS policies compare its `->>` text representation with `'true'`. If this application's Authgear token does not issue UUID subjects, stop and design a text-ID migration rather than bypassing that validation.

**Existing account data:** Supabase Auth user IDs and Authgear user IDs are independently generated. On first Authgear login, the migration's `link_authgear_identity()` function links a legacy account only when Authgear and Supabase both confirm the same email address. It migrates the old UUID across profiles, saved AI sessions, journeys, and progress. The function rejects users without Authgear's verified-user claim and is executable only by authenticated JWTs from the configured Authgear issuer and client. If the verified claims are not present, the function declines to link; do not substitute an unverified email match.

## Vercel environment variables

Set these for the Skilldrem deployment:

- `NEXT_PUBLIC_AUTHGEAR_ENDPOINT=https://hazard-vaa5a1.authgear.cloud`
- `NEXT_PUBLIC_AUTHGEAR_CLIENT_ID=2b273d19926b6daa`
- `NEXT_PUBLIC_SUPABASE_URL=https://ugabwprhvvwapjdzkieq.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<the project's publishable/anon key>` — required by the browser Supabase client; this public key is designed to be exposed and must be protected by RLS.
- `SUPABASE_ANON_KEY=<the same publishable/anon key>` — server-side alias used by protected API routes; the server falls back to the public variable if this alias is absent.

Use the same Supabase publishable/anon key for both Supabase key variables. Never place a service-role key in either variable or in browser code. There is no `AUTHGEAR_CLIENT_SECRET` variable. The Vercel project environment was inspected without decrypting secrets: the required Authgear endpoint/client ID, Supabase URL, browser anon-key variable, and server anon-key alias are present for the inspected deployment targets. The older `lxlbuljcecratjypmoxi` project reference in the initial schema notes is historical and must not be used for this Authgear deployment unless the Vercel URL is intentionally changed. Confirm that Supabase Custom OIDC and both migrations target `ugabwprhvvwapjdzkieq`.

## API abuse protection

The public `/api/ai/discover` route has a bounded process-local fixed-window limiter (8 requests per client IP per minute). This reduces bursts per running instance but is not a distributed quota: serverless instances do not share memory. Configure a Vercel Firewall or shared rate-limit store before substantial public traffic. The current Vercel connection does not provide access to the project's Firewall configuration, so distributed rate limiting remains an external setup requirement.

## Verification checklist

- Authgear redirects back to `/auth/callback` on localhost and the exact production domain.
- Sign-in and sign-up complete through Authgear.
- Access tokens are RS256-signed and contain the required claims.
- Supabase accepts the Authgear issuer and the `authenticated` role.
- A user can create/read only their own profile, preferences, journeys, and AI sessions.
- An unauthenticated request to a protected API returns HTTP 401.
- Published Geornies remain readable without a session.
- Sign-out clears the Authgear session.
- Legacy accounts with verified matching email addresses link without changing ownership of another user's data.
