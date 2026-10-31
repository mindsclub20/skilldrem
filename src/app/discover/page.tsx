import Link from "next/link";

export default function DiscoverPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-40">
        <div className="mx-auto max-w-6xl h-14 flex items-center justify-between px-4">
          <Link href="/" className="font-semibold">SKILLDREM</Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Dashboard</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold">Learning discovery</h1>
        <p className="mt-2 text-muted-foreground">
          Enter a goal to explore courses, books, AI mentors, and Geornies. Live AI ranking uses provider adapters; curated content is available now.
        </p>
        <form action="/discover" className="mt-8 flex gap-3">
          <input name="q" placeholder="e.g. Learn Python for data analysis" className="flex-1 h-12 rounded-xl border border-border bg-card px-4 focus:ring-2 focus:ring-ring focus:outline-none" />
          <button type="submit" className="h-12 rounded-xl bg-primary px-6 text-primary-foreground font-medium">Search</button>
        </form>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {[
            { href: "/courses", title: "Courses", desc: "Free and paid courses with accurate pricing labels" },
            { href: "/books", title: "Books & ebooks", desc: "Open Library, Gutenberg, and open textbooks" },
            { href: "/mentors", title: "AI mentors", desc: "Tools for explanations, coding, and study plans" },
            { href: "/georny", title: "Geornies", desc: "Interactive visual learning roadmaps" },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="rounded-xl border border-border bg-card p-5 hover:border-accent/40 transition-colors">
              <h2 className="font-semibold">{c.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{c.desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
