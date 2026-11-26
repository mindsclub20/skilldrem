import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createRemoteJWKSet } from "jose";
import { verifyAuthgearAccessToken } from "@/lib/authgear-jwt";

const endpoint = process.env.NEXT_PUBLIC_AUTHGEAR_ENDPOINT?.replace(/\/$/, "");
const clientId = process.env.NEXT_PUBLIC_AUTHGEAR_CLIENT_ID;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let remoteJwksPromise: Promise<ReturnType<typeof createRemoteJWKSet>> | undefined;

async function getJwks() {
  if (!endpoint) throw new Error("NEXT_PUBLIC_AUTHGEAR_ENDPOINT is not configured");
  remoteJwksPromise ??= (async () => {
    const response = await fetch(`${endpoint}/.well-known/openid-configuration`, {
      headers: { Accept: "application/json" },
      cache: "force-cache",
    });
    if (!response.ok) throw new Error("Unable to load Authgear OIDC discovery metadata");
    const discovery = (await response.json()) as { jwks_uri?: string; issuer?: string };
    if (discovery.issuer !== endpoint || !discovery.jwks_uri) {
      throw new Error("Authgear OIDC discovery metadata does not match the configured issuer");
    }
    return createRemoteJWKSet(new URL(discovery.jwks_uri));
  })();

  try {
    return await remoteJwksPromise;
  } catch (error) {
    remoteJwksPromise = undefined;
    throw error;
  }
}

export async function getAuthgearSupabase(request: Request) {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  if (!endpoint || !clientId || !supabaseUrl || !supabaseKey) {
    throw new Error("Authgear or Supabase environment configuration is missing");
  }

  try {
    const jwks = await getJwks();
    const user = await verifyAuthgearAccessToken(match[1], jwks, { endpoint, clientId });

    const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      accessToken: async () => match[1],
    });

    return { supabase, user };
  } catch (error) {
    console.warn("[authgear] rejected request:", error instanceof Error ? error.message : "invalid token");
    return null;
  }
}
