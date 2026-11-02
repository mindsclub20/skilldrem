"use client";

import { useState } from "react";
import Link from "next/link";

type Resource = {
  title: string | null;
  description: string | null;
  url: string;
  source: string | null;
  note?: string;
};

export default function DiscoverPage() {
  const [goal, setGoal] = useState("");
  const [url, setUrl] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [scrapeNote, setScrapeNote] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPlan(null);
    setResources([]);
    setScrapeNote(null);
    setDisclaimer(null);
    try {
      const res = await fetch("/api/ai/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, url: url || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPlan(data.plan);
      setProvider(data.provider);
      setResources(data.resources ?? []);
      setDisclaimer(data.disclaimer ?? null);
      if (data.scrape?.error) setScrapeNote(data.scrape.error);
      else if (data.scrape?.title) setScrapeNote(`Scraped: ${data.scrape.title}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-40">
        <div className="mx-auto max-w-6xl h-14 flex items-center justify-between px-4">
          <Link href="/" className="font-semibold">SKILLDREM</Link>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/assistant" className="hover:text-foreground">Assistant</Link>
            <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold">Learning discovery</h1>
        <p className="mt-2 text-muted-foreground">
          Firecrawl searches public learning pages; Groq (primary) or Gemini organizes a path. Links are not invented.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            required
            placeholder="What do you want to learn?"
            className="w-full h-12 rounded-xl border border-border bg-card px-4 focus:ring-2 focus:ring-ring focus:outline-none"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Optional https page URL to analyze"
            type="url"
            className="w-full h-11 rounded-xl border border-border bg-card px-4 focus:ring-2 focus:ring-ring focus:outline-none text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="h-12 rounded-xl bg-primary px-6 text-primary-foreground font-medium disabled:opacity-60"
          >
            {loading ? "Searching & planning…" : "Generate path"}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm px-3 py-2">
            {error}
          </div>
        )}
        {scrapeNote && <p className="mt-4 text-xs text-muted-foreground">{scrapeNote}</p>}
        {disclaimer && <p className="mt-2 text-xs text-muted-foreground">{disclaimer}</p>}

        {resources.length > 0 && (
          <section className="mt-8">
            <h2 className="font-semibold mb-3">From search</h2>
            <ul className="space-y-3">
              {resources.map((r) => (
                <li key={r.url} className="rounded-xl border border-border bg-card p-4">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:underline">
                    {r.title || r.url}
                  </a>
                  {r.source && <p className="text-xs text-muted-foreground mt-0.5">{r.source}</p>}
                  {r.description && <p className="text-sm text-muted-foreground mt-1">{r.description}</p>}
                  <p className="text-[11px] text-muted-foreground mt-2">{r.note}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {plan && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-6">
            {provider && <p className="text-xs uppercase tracking-wide text-accent mb-3">via {provider}</p>}
            <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{plan}</pre>
          </div>
        )}

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {[
            { href: "/courses", title: "Courses", desc: "Curated free and paid labels" },
            { href: "/books", title: "Books & ebooks", desc: "Open and legal sources" },
            { href: "/mentors", title: "AI mentors", desc: "Tool comparison" },
            { href: "/georny", title: "Geornies", desc: "Interactive roadmaps" },
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
