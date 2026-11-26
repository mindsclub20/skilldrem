# Skilldrem — Authgear primary authentication

Skilldrem uses Authgear as its identity provider and Supabase as its database/API platform. The browser uses Authgear's public SPA SDK with Authorization Code + PKCE. No Authgear client secret is stored or required by this integration.

## Authgear application

The supplied application must be an **Authgear Single Page Application (public client)**. Enable **Issue JWT as access token** in its Access Token settings.

Configure these URIs in the Authgear application:

- Local authorized redirect: `http://localhost:3000/auth/callback`
- Production authorized redirect: `https://skilldrem.vercel.app/auth/callback`
- Local post-logout redirect: `http://localhost:3000`
- Production post-logout redirect: `https://skilldrem.vercel.app`

If the production domain differs, use the actual Skilldrem domain.

The Authgear access token must contain:

- `iss`: `https://hazard-vaa5a1.authgear.cloud`
- `aud`: the Authgear project endpoint (Authgear's JWT access-token documentation specifies the project endpoint as the access-token audience; the client ID is a separate `client_id` claim)
- `client_id`: `2b273d19926b6daa`
- `sub`: a UUID
- `role`: `authenticated`
- `email`: present in the JWT for verified-email account linking
- `https://authgear.com/claims/user/is_verified`: `true`, with Authgear's verification rule configured to require a verified email

Configure the `role=authenticated` and `email` claims using Authgear's JWT access-token custom-claims hook. In Authgear's Authentication → Login Methods → Verification settings, configure the verified-user condition to require a verified email; the JWT must then contain `https://authgear.com/claims/user/is_verified: true`. Do not derive authorization roles from user-editable profile metadata. Keep the token signing algorithm at RS256.

## Supabase third-party authentication

In the Skilldrem Supabase project:

1. Open **Authentication → Third-Party Auth**.
2. Add a **Custom OIDC** provider.
3. Set the issuer URL to `https://hazard-vaa5a1.authgear.cloud`.
4. Save and verify that the provider is enabled.

Supabase must be configured to trust Authgear's OIDC discovery/JWKS endpoints before protected Data API requests will work.

## Database migration

Review and apply `supabase/migrations/20261126120000_authgear_primary_auth.sql` to the Skilldrem project. It removes foreign keys that require every application identity to exist in `auth.users`, while retaining UUID ownership columns and RLS policies based on `auth.uid()`. The profile admin-flag trigger blocks privilege escalation on both INSERT and UPDATE.\n\nAlso review and apply `supabase/migrations/20261126130000_atomic_roadmap_save.sql`. It adds an RLS-respecting RPC that inserts the journey, all milestones, and the user's enrollment in one database transaction. If any insert fails, the entire save rolls back; the API no longer reports success when enrollment fails.

Authgear documents its generated `sub` as a UUID. The server also rejects non-UUID subjects. Authgear documents the JWT access-token `aud` as the project endpoint (while the ID token audience is the client ID); the server therefore verifies the endpoint audience and separately checks `client_id`. Authgear's `is_verified` access-token claim is a JSON boolean; the SQL RLS policies compare its `->>` text representation with `'true'`. If this application's Authgear token does not issue UUID subjects, stop and design a text-ID migration rather than bypassing that validation.

**Existing account data:** Supabase Auth user IDs and Authgear user IDs are independently generated. On first Authgear login, the migration's `link_authgear_identity()` function links a legacy account only when Authgear and Supabase both confirm the same email address. It migrates the old UUID across profiles, saved AI sessions, journeys, and progress. The function rejects users without Authgear's verified-user claim and is executable only by authenticated JWTs from the configured Authgear issuer and client. If the verified claims are not present, the function declines to link; do not substitute an unverified email match.

## Vercel environment variables

Set these for the Skilldrem deployment:

- `NEXT_PUBLIC_AUTHGEAR_ENDPOINT=https://hazard-vaa5a1.authgear.cloud`
- `NEXT_PUBLIC_AUTHGEAR_CLIENT_ID=2b273d19926b6daa`
- `NEXT_PUBLIC_SUPABASE_URL=https://ugabwprhvvwapjdzkieq.supabase.co`
- `SUPABASE_ANON_KEY=<the project's publishable/anon key>`

There is no `AUTHGEAR_CLIENT_SECRET` variable. Never put a Supabase service-role key in the browser. The Vercel project environment was inspected without decrypting secrets: its current `NEXT_PUBLIC_SUPABASE_URL` is `https://ugabwprhvvwapjdzkieq.supabase.co`. The older `lxlbuljcecratjypmoxi` project reference in the initial schema notes is historical and must not be used for this Authgear deployment unless the Vercel URL is intentionally changed. Confirm that Supabase Custom OIDC and both migrations target `ugabwprhvvwapjdzkieq`.

## API abuse protection\n\nThe public `/api/ai/discover` route has a bounded process-local fixed-window limiter (8 requests per client IP per minute). This reduces bursts per running instance but is not a distributed quota: serverless instances do not share memory. Configure a Vercel Firewall or shared rate-limit store before substantial public traffic.\n\n## Verification checklist

- Authgear redirects back to `/auth/callback` on localhost and production.
- Sign-in and sign-up complete through Authgear.
- Access tokens are RS256-signed and contain the required claims.
- Supabase accepts the Authgear issuer and the `authenticated` role.
- A user can create/read only their own profile, preferences, journeys, and AI sessions.
- An unauthenticated request to a protected API returns HTTP 401.
- Published Geornies remain readable without a session.
- Sign-out clears the Authgear session.
