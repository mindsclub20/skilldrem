import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function GeornyListPage() {
  const supabase = await createClient();
  const { data: journeys } = await supabase
    .from("journeys")
    .select("*")
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .limit(24);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-40">
        <div className="mx-auto max-w-6xl h-14 flex items-center justify-between px-4">
          <Link href="/" className="font-semibold">SKILLDREM</Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Dashboard</Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold">Geornies</h1>
        <p className="mt-1 text-muted-foreground">Interactive learning roadmaps. Open one to explore milestones on a graph.</p>
        {!journeys?.length ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No published Geornies yet.
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {journeys.map((j) => (
              <li key={j.id}>
                <Link href={`/georny/${j.slug || j.id}`} className="block rounded-xl border border-border bg-card p-5 hover:border-accent/40 transition-colors h-full">
                  {j.is_featured && <span className="text-xs font-medium text-accent">Featured</span>}
                  <h2 className="font-semibold mt-1">{j.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{j.description}</p>
                  <p className="text-xs text-muted-foreground mt-3 capitalize">{j.difficulty} · {j.category}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
