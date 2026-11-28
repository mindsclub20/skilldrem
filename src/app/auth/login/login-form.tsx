"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuthgear } from "@/components/auth/AuthgearProvider";

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const { login, error: configError } = useAuthgear();
  const redirect = searchParams.get("redirect") ?? "/assistant";
  const callbackError = searchParams.get("error") === "authgear";

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      await login(redirect);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start Authgear sign-in.");
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
          <h1 className="mt-6 text-2xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in securely with Authgear</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/90 backdrop-blur p-6 space-y-4">
          {(error || configError || callbackError) && (
            <div role="alert" className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded-lg">
              {error || configError || (callbackError ? "Authgear sign-in could not be completed. Check your account verification and try again." : null)}
            </div>
          )}
          <button
            type="button"
            onClick={() => void handleLogin()}
            disabled={loading || !!configError}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-60"
          >
            {loading ? "Redirecting to Authgear…" : "Continue with Authgear"}
          </button>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to Skilldrem?{" "}
          <Link href="/auth/signup" className="text-accent font-medium">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
