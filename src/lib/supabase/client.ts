import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import authgear from "@authgear/web";

let browserClient: ReturnType<typeof createSupabaseClient> | undefined;

export function createClient() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase public configuration is missing");

  browserClient = createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    accessToken: async () => {
      await authgear.refreshAccessTokenIfNeeded();
      return authgear.accessToken ?? null;
    },
  });

  return browserClient;
}
