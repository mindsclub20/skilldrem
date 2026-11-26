import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { validateAuthgearClaims } from "@/lib/authgear-token";

const endpoint = process.env.NEXT_PUBLIC_AUTHGEAR_ENDPOINT?.replace(/\/$/, "");
const clientId = process.env.NEXT_PUBLIC_AUTHGEAR_CLIENT_ID;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let remoteJwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function getJwks() {
  if (!endpoint) throw new Error("NEXT_PUBLIC_AUTHGEAR_ENDPOINT is not configured");
  remoteJwks ??= createRemoteJWKSet(new URL(`${endpoint}/oauth2/jwks`));
  return remoteJwks;
}

export async function getAuthgearSupabase(request: Request) {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  if (!endpoint || !clientId || !supabaseUrl || !supabaseKey) {
    throw new Error("Authgear or Supabase environment configuration is missing");
  }

  try {
    const { payload } = await jwtVerify(match[1], getJwks(), {
      issuer: endpoint,
      audience: endpoint,
      algorithms: ["RS256"],
    });
    const user = validateAuthgearClaims(payload, { endpoint, clientId });

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
