"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthgear } from "@/components/auth/AuthgearProvider";
import { authgearFetch } from "@/lib/authgear-client";

type AdminProfile = { is_admin: boolean; full_name: string | null };
type AdminOverview = {
  profile: AdminProfile;
  counts: { journeys: number; resources: number; users: number };
};

export default function AdminPage() {
  const { user } = useAuthgear();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [counts, setCounts] = useState({ journeys: 0, resources: 0, users: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.sub) {
      setLoading(false);
      return;
    }

    let active = true;
    async function loadAdminData() {
      const response = await authgearFetch("/api/admin/overview", { cache: "no-store" });
      const payload = (await response.json()) as AdminOverview | { error?: string };
      if (!response.ok) {
        throw new Error("error" in payload && payload.error ? payload.error : "Unable to load admin dashboard.");
      }
      if (!active) return;
      const overview = payload as AdminOverview;
      setProfile(overview.profile);
      setCounts(overview.counts);
      setLoading(false);
    }

    void loadAdminData().catch((cause: unknown) => {
      if (!active) return;
      setError(cause instanceof Error ? cause.message : "Unable to load admin dashboard.");
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [user?.sub]);

  const isAdmin = profile?.is_admin === true;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading admin access…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold">Admin access required</h1>
          <p className="mt-2 text-muted-foreground text-sm">This account is not authorized to access the content dashboard.</p>
          <Link href="/dashboard" className="mt-6 inline-block text-accent font-medium">Back to dashboard</Link>
          {error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-40">
        <div className="mx-auto max-w-6xl h-14 flex items-center justify-between px-4">
          <Link href="/" className="font-semibold">SKILLDREM Admin</Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Dashboard</Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold">Content CMS</h1>
        <p className="text-muted-foreground mt-1">Signed in as {profile?.full_name || user?.email || "Admin"}</p>
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Journeys", value: counts.journeys },
            { label: "Resources", value: counts.resources },
            { label: "Profiles", value: counts.users },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-3xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-sm text-muted-foreground">
          Publish Geornies and resources via the approved admin workflow. Database RLS remains the authority for all writes.
        </p>
      </main>
    </div>
  );
}
