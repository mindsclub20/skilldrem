import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCatalogCourses, type CatalogItem } from "@/lib/resources/verified-catalog";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; subject?: string; level?: string; pricing?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: dbCourses } = await supabase
    .from("resources")
    .select("*")
    .eq("resource_type", "course")
    .eq("is_published", true)
    .order("quality_score", { ascending: false })
    .limit(48);

  const catalog = getCatalogCourses({
    q: params.q,
    subject: params.subject,
    level: params.level,
    pricing: params.pricing,
  });

  const courses =
    dbCourses && dbCourses.length > 0
      ? dbCourses.map((c) => ({
          id: c.id as string,
          title: c.title as string,
          provider: c.provider as string | null,
          url: c.url as string | null,
          pricing_type: c.pricing_type as string | null,
          description: c.description as string | null,
          subject: undefined as string | undefined,
          level: undefined as string | undefined,
          source: "db" as const,
        }))
      : catalog.map((c: CatalogItem) => ({
          id: c.id,
          title: c.title,
          provider: c.provider,
          url: c.url,
          pricing_type: c.pricing_type,
          description: c.description,
          subject: c.subject,
          level: c.level,
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
            <Link href="/books" className="hover:text-foreground">
              Books
            </Link>
            <Link href="/discover" className="hover:text-foreground">
              Discover
            </Link>
            <Link href="/sprint" className="hover:text-foreground">
              Sprint
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold">Course finder</h1>
        <p className="mt-1 text-muted-foreground max-w-2xl">
          Verified public courses and open courseware. Confirm pricing on the provider site. Nothing is invented.
        </p>

        <form className="mt-6 flex flex-wrap gap-3" method="get">
          <input
            type="search"
            name="q"
            defaultValue={params.q || ""}
            placeholder="Search courses…"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm min-w-[200px]"
          />
          <select
            name="subject"
            defaultValue={params.subject || ""}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="">All subjects</option>
            {[
              "Mathematics",
              "Programming",
              "Computer Science",
              "AI and Machine Learning",
              "Engineering",
              "School Education",
              "Higher Education",
            ].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            name="level"
            defaultValue={params.level || ""}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="">All levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <select
            name="pricing"
            defaultValue={params.pricing || ""}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="">Any pricing</option>
            <option value="completely_free">Completely free</option>
            <option value="free_audit">Free audit</option>
            <option value="freemium">Freemium</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium"
          >
            Filter
          </button>
        </form>

        {!courses.length ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No matching courses. Try clearing filters or open{" "}
            <Link href="/discover" className="text-accent hover:underline">
              Discover
            </Link>
            .
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm text-muted-foreground">
              Showing {courses.length} resource{courses.length === 1 ? "" : "s"}
              {dbCourses && dbCourses.length > 0
                ? " from database"
                : " from verified public catalogue"}
              . Last verification: 2026-11-16.
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl border border-border bg-card p-5 flex flex-col"
                >
                  <p className="text-xs font-medium text-accent uppercase tracking-wide">
                    {(c.pricing_type || "unknown").replace(/_/g, " ")}
                  </p>
                  <h2 className="mt-1 font-semibold leading-snug">{c.title}</h2>
                  {c.provider && (
                    <p className="text-sm text-muted-foreground mt-0.5">{c.provider}</p>
                  )}
                  {(c.subject || c.level) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {[c.subject, c.level].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {c.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3 flex-1">
                      {c.description}
                    </p>
                  )}
                  {c.url && (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-sm text-accent hover:underline"
                    >
                      Open official page →
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
