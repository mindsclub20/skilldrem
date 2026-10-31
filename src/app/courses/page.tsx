import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("resources")
    .select("*")
    .eq("resource_type", "course")
    .eq("is_published", true)
    .order("quality_score", { ascending: false })
    .limit(24);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-40">
        <div className="mx-auto max-w-6xl h-14 flex items-center justify-between px-4">
          <Link href="/" className="font-semibold">SKILLDREM</Link>
          <Link href="/discover" className="text-sm text-muted-foreground hover:text-foreground">Discover</Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold">Course finder</h1>
        <p className="mt-1 text-muted-foreground">Resources are classified by pricing type. Nothing is invented.</p>
        {!courses?.length ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No published courses yet. Admins can add verified resources from the CMS.
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <li key={c.id} className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-medium text-accent uppercase tracking-wide">{c.pricing_type?.replace(/_/g, " ")}</p>
                <h2 className="mt-1 font-semibold">{c.title}</h2>
                {c.provider && <p className="text-sm text-muted-foreground">{c.provider}</p>}
                {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-accent hover:underline">Open →</a>}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
