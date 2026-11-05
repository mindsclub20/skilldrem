import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: journeys } = await supabase
    .from("user_journeys")
    .select("*, journeys(*)")
    .eq("user_id", user.id)
    .limit(10);

  const { data: recentChats } = await supabase
    .from("ai_sessions")
    .select("id, title, updated_at, provider")
    .eq("user_id", user.id)
    .eq("session_type", "chat")
    .order("updated_at", { ascending: false })
    .limit(5);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-40">
        <div className="mx-auto max-w-6xl h-14 flex items-center justify-between px-4 gap-3">
          <Link href="/" className="font-semibold shrink-0">
            SKILLDREM
          </Link>
          <nav className="flex gap-3 sm:gap-4 text-sm text-muted-foreground overflow-x-auto">
            <Link href="/learn" className="hover:text-foreground whitespace-nowrap font-medium text-foreground">
              Learn
            </Link>
            <Link href="/assistant" className="hover:text-foreground whitespace-nowrap">
              Assistant
            </Link>
            <Link href="/discover" className="hover:text-foreground whitespace-nowrap">
              Discover
            </Link>
            <Link href="/georny" className="hover:text-foreground whitespace-nowrap">
              Geornies
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <h1 className="text-2xl font-bold">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="mt-1 text-muted-foreground">Your learning dashboard</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/learn"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Open learning workspace
          </Link>
          <Link
            href="/assistant"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Classic AI assistant
          </Link>
          <Link
            href="/discover"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Discover paths
          </Link>
        </div>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="font-semibold text-lg">Active learning paths</h2>
            <Link href="/learn" className="text-sm text-accent hover:underline">
              Open workspace
            </Link>
          </div>
          {!journeys?.length ? (
            <div className="rounded-2xl border border-dashed border-border p-8 sm:p-10 text-center text-muted-foreground">
              <p className="font-medium text-foreground">No active journeys yet</p>
              <p className="mt-2 text-sm max-w-md mx-auto">
                Create a personalized roadmap with automatic free-resource discovery in the
                learning workspace.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Link href="/learn" className="text-accent font-medium text-sm">
                  Start learning →
                </Link>
                <Link href="/georny" className="text-sm text-muted-foreground hover:text-foreground">
                  View Geornies
                </Link>
              </div>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {(journeys as { id: string; progress_percent?: number; journeys?: { title?: string } }[]).map(
                (uj) => (
                  <li key={uj.id} className="rounded-xl border border-border bg-card p-5">
                    <Link href="/learn" className="block">
                      <h3 className="font-medium">{uj.journeys?.title ?? "Journey"}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Progress: {uj.progress_percent ?? 0}%
                      </p>
                      <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(0, Number(uj.progress_percent ?? 0)))}%`,
                          }}
                        />
                      </div>
                    </Link>
                  </li>
                )
              )}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="font-semibold text-lg">Recent AI chats</h2>
            <Link href="/assistant" className="text-sm text-accent hover:underline">
              Open assistant
            </Link>
          </div>
          {!recentChats?.length ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
              No saved conversations yet. Start chatting in the assistant — messages are saved to
              your account.
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
              {recentChats.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/assistant?c=${c.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium text-sm truncate">{c.title || "Chat"}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {new Date(c.updated_at).toLocaleString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {!profile?.onboarding_completed && (
          <div className="mt-8 rounded-xl border border-accent/30 bg-accent/5 p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-medium">Complete onboarding</p>
              <p className="text-sm text-muted-foreground">
                Tell us your goals for better recommendations.
              </p>
            </div>
            <Link
              href="/onboarding"
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
            >
              Continue
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
