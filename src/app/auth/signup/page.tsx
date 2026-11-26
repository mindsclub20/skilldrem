"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthgear } from "@/components/auth/AuthgearProvider";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signup, error: configError } = useAuthgear();

  async function handleSignup() {
    setLoading(true);
    setError(null);
    try {
      await signup("/onboarding");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start account creation.");
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
          <p className="mt-2 text-sm text-muted-foreground">Your account is managed securely by Authgear.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          {(error || configError) && (
            <div role="alert" className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded-lg">
              {error || configError}
            </div>
          )}
          <button
            type="button"
            onClick={() => void handleSignup()}
            disabled={loading || !!configError}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-60"
          >
            {loading ? "Redirecting to Authgear…" : "Create account with Authgear"}
          </button>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <Link href="/auth/login" className="text-accent font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
