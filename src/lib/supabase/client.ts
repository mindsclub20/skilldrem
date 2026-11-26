import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient<any> | undefined;

export function createClient() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase public configuration is missing");

  browserClient = createSupabaseClient<any>(url, key, {
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
