import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { resolveBrowserSupabaseConfig } from "./config";

let browserClient: SupabaseClient<any> | undefined;

export function createClient() {
  if (browserClient) return browserClient;

  const { url, anonKey } = resolveBrowserSupabaseConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  browserClient = createSupabaseClient<any>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    accessToken: async () => {
      const { default: authgear } = await import("@authgear/web");
      await authgear.refreshAccessTokenIfNeeded();
      return authgear.accessToken ?? null;
    },
  });

  return browserClient;
}
