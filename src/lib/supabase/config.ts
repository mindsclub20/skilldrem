export type BrowserSupabaseConfig = {
  url: string;
  anonKey: string;
};

export function resolveBrowserSupabaseConfig(
  url: string | undefined,
  anonKey: string | undefined
): BrowserSupabaseConfig {
  const normalizedUrl = url?.trim();
  const normalizedAnonKey = anonKey?.trim();

  if (!normalizedUrl || !normalizedAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured"
    );
  }

  return { url: normalizedUrl, anonKey: normalizedAnonKey };
}
