"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeAuthRedirect } from "@/lib/auth-redirect";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleGoogleSignUp() {
    setGoogleLoading(true);
    setError(null);
    const supabase = createClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", safeAuthRedirect("/onboarding"));

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: { prompt: "select_account" },
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (data.session) {
      router.push("/onboarding");
      router.refresh();
    } else {
      setMessage("Check your email to confirm your account.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold text-xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">S</span>
            SKILLDREM
          </Link>
          <h1 className="mt-6 text-2xl font-bold">Create your account</h1>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          {error && (
            <div role="alert" className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
          {message && (
            <div role="status" className="text-sm text-teal-700 bg-teal-50 dark:bg-teal-950/40 px-3 py-2 rounded-lg">
              {message}
            </div>
          )}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            className="w-full h-11 rounded-xl border border-border bg-background font-medium flex items-center justify-center gap-3 hover:bg-muted/60 disabled:opacity-60 transition-colors"
          >
            <span aria-hidden="true" className="font-bold text-lg text-[#4285F4]">G</span>
            {googleLoading ? "Connecting to Google…" : "Continue with Google"}
          </button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            OR SIGN UP WITH EMAIL
            <span className="h-px flex-1 bg-border" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-1.5">Full name</label>
              <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full h-11 rounded-xl border border-border bg-background px-3 focus:ring-2 focus:ring-ring focus:outline-none" autoComplete="name" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-11 rounded-xl border border-border bg-background px-3 focus:ring-2 focus:ring-ring focus:outline-none" autoComplete="email" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">Password</label>
              <input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-11 rounded-xl border border-border bg-background px-3 focus:ring-2 focus:ring-ring focus:outline-none" autoComplete="new-password" />
            </div>
            <button type="submit" disabled={loading || googleLoading} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-60">
              {loading ? "Creating…" : "Create account"}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Have an account? <Link href="/auth/login" className="text-accent font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
