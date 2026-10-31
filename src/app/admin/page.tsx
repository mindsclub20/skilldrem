import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/admin");

  const { data: profile } = await supabase.from("profiles").select("is_admin, full_name").eq("id", user.id).single();
  const { data: roles } = await supabase.from("admin_roles").select("role").eq("user_id", user.id);
  const isAdmin = profile?.is_admin || (roles && roles.length > 0);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold">Admin access required</h1>
          <p className="mt-2 text-muted-foreground text-sm">Your account is not authorized. Admin checks use server-side profile.is_admin and admin_roles — never trust the client alone.</p>
          <Link href="/dashboard" className="mt-6 inline-block text-accent font-medium">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const [{ count: journeyCount }, { count: resourceCount }, { count: userCount }] = await Promise.all([
    supabase.from("journeys").select("*", { count: "exact", head: true }),
    supabase.from("resources").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

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
        <p className="text-muted-foreground mt-1">Signed in as {profile?.full_name || user.email}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Journeys", value: journeyCount ?? 0 },
            { label: "Resources", value: resourceCount ?? 0 },
            { label: "Users", value: userCount ?? 0 },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-3xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-sm text-muted-foreground">
          Publish Geornies and resources via SQL seed or future CMS forms. RLS ensures only admins can write curated tables.
        </p>
      </main>
    </div>
  );
}
