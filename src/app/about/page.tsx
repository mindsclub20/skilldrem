import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export const metadata = {
  title: "About",
  description: "Skilldrem’s purpose, audience, and learning philosophy.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-40">
        <div className="mx-auto max-w-3xl h-14 flex items-center justify-between px-4">
          <Logo variant="wordmark" />
          <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground">Explore</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12 space-y-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">About Skilldrem</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Skilldrem is a smart learning roadmap curator. It helps learners discover legitimate free-first resources,
            plan focused Georny paths and Learning Sprints, and track progress — without inventing courses or prices.
          </p>
        </div>
        <section>
          <h2 className="text-xl font-semibold">Purpose</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Turn vague goals like “learn frontend” or “revise Class 12 Physics” into sequenced milestones, daily missions,
            and verified resource links learners can actually open.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Who it is for</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Students and self-learners who need structured paths, especially those balancing board exams, entrance prep,
            or career skills with limited time and a preference for free or low-cost materials.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Learning philosophy</h2>
          <ul className="mt-3 list-disc pl-5 space-y-2 text-muted-foreground">
            <li>Free-first: lead with open, legitimate sources; label paid options clearly.</li>
            <li>Evidence over invention: no fabricated course titles, prices, or affiliations.</li>
            <li>Small steps: 7– and 14-day sprints beat vague multi-year plans.</li>
            <li>Human + AI: AI assists planning; learners verify sources and answers.</li>
          </ul>
        </section>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/auth/signup" className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground">Start learning</Link>
          <Link href="/explore" className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm">Explore resources</Link>
        </div>
      </main>
    </div>
  );
}
