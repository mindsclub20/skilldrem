import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel stores the key as SUPABASE_ANON_KEY because NEXT_PUBLIC_ names
  // are restricted in this project. This maps the public Supabase anon key
  // to the variable name expected by the browser and server Supabase clients.
  env: {
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? "",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
