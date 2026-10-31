import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: journeys } = await supabase
    .from("user_journeys")
    .select("*, journeys(*)")
    .eq("user_id", user.id)
    .limit(10);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-40">
        <div className="mx-auto max-w-6xl h-14 flex items-center justify-between px-4">
          <Link href="/" className="font-semibold">SKILLDREM</Link>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/discover" className="hover:text-foreground">Discover</Link>
            <Link href="/georny" className="hover:text-foreground">Geornies</Link>
            <Link href="/courses" className="hover:text-foreground">Courses</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold">Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}</h1>
        <p className="mt-1 text-muted-foreground">Your learning dashboard</p>
        <section className="mt-10">
          <h2 className="font-semibold text-lg mb-4">Active Geornies</h2>
          {!journeys?.length ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              <p>No active journeys yet.</p>
              <Link href="/discover" className="mt-3 inline-block text-accent font-medium">Start discovering →</Link>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {(journeys as any[]).map((uj) => (
                <li key={uj.id} className="rounded-xl border border-border bg-card p-5">
                  <h3 className="font-medium">{uj.journeys?.title ?? "Journey"}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Progress: {uj.progress_percent ?? 0}%</p>
                </li>
              ))}
            </ul>
          )}
        </section>
        {!profile?.onboarding_completed && (
          <div className="mt-8 rounded-xl border border-accent/30 bg-accent/5 p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-medium">Complete onboarding</p>
              <p className="text-sm text-muted-foreground">Tell us your goals for better recommendations.</p>
            </div>
            <Link href="/onboarding" className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">Continue</Link>
          </div>
        )}
      </main>
    </div>
  );
}
