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

type Budget = "free_only" | "free_preferred" | "mixed" | "paid_ok";

const BUDGET_OPTIONS: {
  id: Budget;
  label: string;
  desc: string;
  badge: string;
}[] = [
  {
    id: "free_only",
    label: "Free only",
    desc: "Only free sites, docs, YouTube, open courses",
    badge: "$0",
  },
  {
    id: "free_preferred",
    label: "Free preferred",
    desc: "Free path first; paid only if clearly useful",
    badge: "Free →",
  },
  {
    id: "mixed",
    label: "Mix free & paid",
    desc: "Balance both; every item labeled",
    badge: "Mix",
  },
  {
    id: "paid_ok",
    label: "Paid is fine",
    desc: "Still show free options; paid OK when quality is high",
    badge: "Paid OK",
  },
];

export default function DiscoverPage() {
  const [goal, setGoal] = useState("");
  const [url, setUrl] = useState("");
  const [budget, setBudget] = useState<Budget>("free_preferred");
  const [plan, setPlan] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [scrapeNote, setScrapeNote] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [usedBudget, setUsedBudget] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(nextBudget: Budget = budget) {
    setLoading(true);
    setError(null);
    setPlan(null);
    setResources([]);
    setScrapeNote(null);
    setDisclaimer(null);
    setUsedBudget(null);
    try {
      const res = await fetch("/api/ai/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, url: url || undefined, budget: nextBudget }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPlan(data.plan);
      setProvider(data.provider);
      setResources(data.resources ?? []);
      setDisclaimer(data.disclaimer ?? null);
      setUsedBudget(data.budget ?? nextBudget);
      if (data.scrape?.error) setScrapeNote(data.scrape.error);
      else if (data.scrape?.title) setScrapeNote(`Scraped: ${data.scrape.title}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await generate(budget);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-40">
        <div className="mx-auto max-w-6xl h-14 flex items-center justify-between px-4">
          <Link href="/" className="font-semibold">
            SKILLDREM
          </Link>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/assistant" className="hover:text-foreground">
              Assistant
            </Link>
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold">Learning discovery</h1>
        <p className="mt-2 text-muted-foreground">
          Tell us what you want to learn and whether you want free-only or paid options.
          We search the public web and build a path that leads with free sources.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">What do you want to learn?</label>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
              placeholder="e.g. Python for data analysis from zero"
              className="w-full h-12 rounded-xl border border-border bg-card px-4 focus:ring-2 focus:ring-ring focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Free or paid resources?</label>
            <p className="text-xs text-muted-foreground mb-3">
              Pick one — the path will adapt. You can change this and regenerate anytime.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {BUDGET_OPTIONS.map((opt) => {
                const selected = budget === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBudget(opt.id)}
                    className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                      selected
                        ? "border-accent bg-accent/10 ring-1 ring-accent/40"
                        : "border-border bg-card hover:border-accent/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">{opt.label}</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide rounded-md px-1.5 py-0.5 ${
                          selected
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Optional page URL to analyze</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://… (course or docs page)"
              type="url"
              className="w-full h-11 rounded-xl border border-border bg-card px-4 focus:ring-2 focus:ring-ring focus:outline-none text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-12 rounded-xl bg-primary px-6 text-primary-foreground font-medium disabled:opacity-60"
          >
            {loading ? "Searching free sources & planning…" : "Generate free-first path"}
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
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-accent hover:underline"
                  >
                    {r.title || r.url}
                  </a>
                  {r.source && (
                    <p className="text-xs text-muted-foreground mt-0.5">{r.source}</p>
                  )}
                  {r.description && (
                    <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-2">{r.note}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {plan && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {provider && (
                <p className="text-xs uppercase tracking-wide text-accent">via {provider}</p>
              )}
              {usedBudget && (
                <span className="text-[10px] font-semibold uppercase tracking-wide rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                  Budget: {usedBudget.replace(/_/g, " ")}
                </span>
              )}
            </div>
            <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{plan}</pre>

            <div className="mt-6 pt-5 border-t border-border">
              <p className="text-sm font-medium mb-2">Want a different budget?</p>
              <div className="flex flex-wrap gap-2">
                {BUDGET_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={loading || !goal.trim()}
                    onClick={() => {
                      setBudget(opt.id);
                      void generate(opt.id);
                    }}
                    className={`text-xs rounded-lg border px-3 py-1.5 transition-colors ${
                      usedBudget === opt.id
                        ? "border-accent bg-accent/10 text-foreground"
                        : "border-border hover:border-accent/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {[
            { href: "/courses", title: "Courses", desc: "Curated free and paid labels" },
            { href: "/books", title: "Books & ebooks", desc: "Open and legal sources" },
            { href: "/mentors", title: "AI mentors", desc: "Tool comparison" },
            { href: "/georny", title: "Geornies", desc: "Interactive roadmaps" },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="rounded-xl border border-border bg-card p-5 hover:border-accent/40 transition-colors"
            >
              <h2 className="font-semibold">{c.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{c.desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
