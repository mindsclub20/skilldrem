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
- `aud`: the Authgear endpoint
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

Review and apply `supabase/migrations/20261126120000_authgear_primary_auth.sql` to the Skilldrem project. It removes foreign keys that require every application identity to exist in `auth.users`, while retaining UUID ownership columns and RLS policies based on `auth.uid()`.

Authgear documents its generated `sub` as a UUID. The server also rejects non-UUID subjects. If this application's Authgear token does not issue UUID subjects, stop and design a text-ID migration rather than bypassing that validation.

**Existing account data:** Supabase Auth user IDs and Authgear user IDs are independently generated. On first Authgear login, the migration's `link_authgear_identity()` function links a legacy account only when Authgear and Supabase both confirm the same email address. It migrates the old UUID across profiles, saved AI sessions, journeys, and progress. The function rejects users without Authgear's verified-user claim and is executable only by authenticated JWTs from the configured Authgear issuer and client. If the verified claims are not present, the function declines to link; do not substitute an unverified email match.

## Vercel environment variables

Set these for the Skilldrem deployment:

- `NEXT_PUBLIC_AUTHGEAR_ENDPOINT=https://hazard-vaa5a1.authgear.cloud`
- `NEXT_PUBLIC_AUTHGEAR_CLIENT_ID=2b273d19926b6daa`
- `NEXT_PUBLIC_SUPABASE_URL=https://ugabwprhvvwapjdzkieq.supabase.co`
- `SUPABASE_ANON_KEY=<the project's publishable/anon key>`

There is no `AUTHGEAR_CLIENT_SECRET` variable. Never put a Supabase service-role key in the browser.

## Verification checklist

- Authgear redirects back to `/auth/callback` on localhost and production.
- Sign-in and sign-up complete through Authgear.
- Access tokens are RS256-signed and contain the required claims.
- Supabase accepts the Authgear issuer and the `authenticated` role.
- A user can create/read only their own profile, preferences, journeys, and AI sessions.
- An unauthenticated request to a protected API returns HTTP 401.
- Published Geornies remain readable without a session.
- Sign-out clears the Authgear session.
