import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STATIC_MENTORS = [
  { name: "ChatGPT", best: "Concept explanations, writing, study plans", free: "Free tier with limits", privacy: "Data may train models unless opted out" },
  { name: "Claude", best: "Long documents, careful reasoning", free: "Limited free messages", privacy: "Anthropic usage policies apply" },
  { name: "Grok", best: "Current events, coding, direct answers", free: "Varies by platform", privacy: "xAI policies" },
  { name: "Gemini", best: "Multimodal, Google ecosystem", free: "Free tier available", privacy: "Google account policies" },
  { name: "GitHub Copilot", best: "Coding assistance in IDE", free: "Student/limited free options", privacy: "Code context shared with service" },
  { name: "Khanmigo", best: "Guided tutoring style learning", free: "Often paid / limited", privacy: "Education-focused policies" },
];

export default async function MentorsPage() {
  const supabase = await createClient();
  const { data: tools } = await supabase
    .from("resources")
    .select("*")
    .eq("resource_type", "ai_tool")
    .eq("is_published", true)
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
        <h1 className="text-2xl font-bold">AI mentor finder</h1>
        <p className="mt-1 text-muted-foreground max-w-2xl">
          Compare tools by use case. Verify free-tier and privacy on each provider site.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STATIC_MENTORS.map((m) => (
            <li key={m.name} className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold">{m.name}</h2>
              <p className="text-sm mt-2"><span className="text-muted-foreground">Best for:</span> {m.best}</p>
              <p className="text-sm mt-1"><span className="text-muted-foreground">Free tier:</span> {m.free}</p>
              <p className="text-sm mt-1"><span className="text-muted-foreground">Privacy:</span> {m.privacy}</p>
            </li>
          ))}
        </ul>
        {tools && tools.length > 0 && (
          <section className="mt-12">
            <h2 className="font-semibold text-lg mb-4">Curated from database</h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {tools.map((t) => (
                <li key={t.id} className="rounded-xl border border-border bg-card p-4">
                  <h3 className="font-medium">{t.title}</h3>
                  {t.description && <p className="text-sm text-muted-foreground mt-1">{t.description}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
