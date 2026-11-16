import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCatalogBooks, type CatalogItem } from "@/lib/resources/verified-catalog";

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; subject?: string; level?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: dbBooks } = await supabase
    .from("resources")
    .select("*")
    .in("resource_type", ["book", "ebook"])
    .eq("is_published", true)
    .order("title")
    .limit(48);

  const catalog = getCatalogBooks({
    q: params.q,
    subject: params.subject,
    level: params.level,
  });

  const books =
    dbBooks && dbBooks.length > 0
      ? dbBooks.map((b) => ({
          id: b.id as string,
          title: b.title as string,
          provider: b.provider as string | null,
          url: b.url as string | null,
          pricing_type: b.pricing_type as string | null,
          description: b.description as string | null,
          subject: undefined as string | undefined,
          level: undefined as string | undefined,
          source: "db" as const,
        }))
      : catalog.map((b: CatalogItem) => ({
          id: b.id,
          title: b.title,
          provider: b.provider,
          url: b.url,
          pricing_type: b.pricing_type,
          description: b.description,
          subject: b.subject,
          level: b.level,
          source: "catalog" as const,
        }));

  return (
    <div className="min-h-screen">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-40">
        <div className="mx-auto max-w-6xl h-14 flex items-center justify-between px-4">
          <Link href="/" className="font-semibold">
            SKILLDREM
          </Link>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/courses" className="hover:text-foreground">
              Courses
            </Link>
            <Link href="/discover" className="hover:text-foreground">
              Discover
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold">Books & ebooks</h1>
        <p className="mt-1 text-muted-foreground max-w-2xl">
          Legally accessible open textbooks and free ebooks only. SKILLDREM does not facilitate piracy.
        </p>

        <form className="mt-6 flex flex-wrap gap-3" method="get">
          <input
            type="search"
            name="q"
            defaultValue={params.q || ""}
            placeholder="Search books…"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm min-w-[200px]"
          />
          <select
            name="subject"
            defaultValue={params.subject || ""}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="">All subjects</option>
            {["Programming", "Mathematics", "Physics", "AI and Machine Learning", "Data Science"].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              )
            )}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium"
          >
            Filter
          </button>
        </form>

        {!books.length ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No matching books. Try clearing filters.
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm text-muted-foreground">
              Showing {books.length} resource{books.length === 1 ? "" : "s"}
              {dbBooks && dbBooks.length > 0
                ? " from database"
                : " from verified open catalogue"}
              . Verified 2026-11-16.
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {books.map((b) => (
                <li
                  key={b.id}
                  className="rounded-xl border border-border bg-card p-5 flex flex-col"
                >
                  <p className="text-xs font-medium text-accent uppercase">
                    {(b.pricing_type || "unknown").replace(/_/g, " ")}
                  </p>
                  <h2 className="mt-1 font-semibold">{b.title}</h2>
                  {b.provider && (
                    <p className="text-sm text-muted-foreground">{b.provider}</p>
                  )}
                  {(b.subject || b.level) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {[b.subject, b.level].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {b.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3 flex-1">
                      {b.description}
                    </p>
                  )}
                  {b.url && (
                    <a
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-sm text-accent hover:underline"
                    >
                      Access →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
