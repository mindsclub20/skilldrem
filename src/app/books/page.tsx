import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function BooksPage() {
  const supabase = await createClient();
  const { data: books } = await supabase
    .from("resources")
    .select("*")
    .in("resource_type", ["book", "ebook"])
    .eq("is_published", true)
    .order("title")
    .limit(48);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-40">
        <div className="mx-auto max-w-6xl h-14 flex items-center justify-between px-4">
          <Link href="/" className="font-semibold">SKILLDREM</Link>
          <Link href="/discover" className="text-sm text-muted-foreground hover:text-foreground">Discover</Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold">Books & ebooks</h1>
        <p className="mt-1 text-muted-foreground max-w-2xl">
          Legally accessible sources only. SKILLDREM does not facilitate piracy.
        </p>
        {!books?.length ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No published books yet.
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((b) => (
              <li key={b.id} className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-medium text-accent uppercase">{b.pricing_type?.replace(/_/g, " ")}</p>
                <h2 className="mt-1 font-semibold">{b.title}</h2>
                {b.provider && <p className="text-sm text-muted-foreground">{b.provider}</p>}
                {b.url && (
                  <a href={b.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-accent hover:underline">Access →</a>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
