import Link from "next/link";
import {
  Search,
  BookOpen,
  Bot,
  Map,
  GraduationCap,
  ArrowRight,
  Sparkles,
  Zap,
  Compass,
  Target,
  LineChart,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo variant="wordmark" priority />
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/explore" className="hover:text-foreground transition-colors">Explore</Link>
            <Link href="/sprint" className="hover:text-foreground transition-colors">Learning Sprint</Link>
            <Link href="/discover" className="hover:text-foreground transition-colors">Discover</Link>
            <Link href="/georny" className="hover:text-foreground transition-colors">Geornies</Link>
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground">Log in</Link>
            <Link href="/auth/signup" className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">Start learning</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden px-4 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-100/40 via-transparent to-transparent dark:from-teal-900/20" />
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Smart Learning Roadmap Curator
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Find your knowledge.<br />
              <span className="text-accent">Find your tools.</span><br />
              Find your path.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
              Discover free courses, open ebooks, AI mentors, and personalized learning journeys — built for focused learners, including students in India.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/sprint" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition hover:opacity-90">
                <Zap className="h-4 w-4" /> Start learning <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/explore" className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-card px-6 text-sm font-medium transition hover:border-accent/40">Explore learning paths</Link>
            </div>
            <form action="/discover" className="mt-5 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input name="q" type="search" placeholder="What do you want to learn?" className="w-full h-12 rounded-xl border border-border bg-card pl-11 pr-4 text-base shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Search learning goals" />
              </div>
              <button type="submit" className="h-12 rounded-xl bg-primary px-6 font-medium text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                Discover <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Discover · Plan · Progress</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {[
                { icon: Compass, title: "Discover", body: "Find free-first courses, ebooks, mentors and paths matched to your goal.", href: "/explore" },
                { icon: Target, title: "Plan", body: "Build a Georny roadmap or a 7–14 day Learning Sprint with daily missions.", href: "/sprint" },
                { icon: LineChart, title: "Progress", body: "Track missions, milestones and what to learn next in your dashboard.", href: "/auth/login" },
              ].map((item) => (
                <Link key={item.title} href={item.href} className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-accent/40 transition-colors">
                  <item.icon className="h-6 w-6 text-accent" />
                  <h3 className="mt-4 font-semibold text-lg">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20">
          <div className="mx-auto max-w-6xl grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Zap, title: "Learning Sprint", desc: "Turn a goal into a realistic 7- or 14-day plan with daily missions and progress check-ins.", href: "/sprint" },
              { icon: GraduationCap, title: "Free & paid courses", desc: "Accurately classified free, free-with-conditions, audit, and paid options.", href: "/courses" },
              { icon: BookOpen, title: "Open ebooks", desc: "Public domain, open-access, and legitimate textbook sources only.", href: "/books" },
              { icon: Bot, title: "AI mentors", desc: "Compare tools for explanations, coding, math, and study planning.", href: "/mentors" },
              { icon: Map, title: "Geornies", desc: "Interactive visual roadmaps connecting goals, milestones, and resources.", href: "/georny" },
            ].map((item) => (
              <Link key={item.title} href={item.href} className="group rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-accent/40 transition-all">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-accent group-hover:bg-accent/10 transition-colors">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-muted/40 px-4 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">How Skilldrem works</h2>
            <ol className="mt-10 grid gap-8 text-left sm:grid-cols-3">
              {[
                { step: "1", title: "Tell us your goal", body: "Share what you want to learn, your experience, and constraints." },
                { step: "2", title: "Get a Georny", body: "Receive a visual learning path with milestones and curated resources." },
                { step: "3", title: "Track progress", body: "Save journeys, mark milestones complete, and see what to learn next." },
              ].map((s) => (
                <li key={s.step}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{s.step}</span>
                  <h3 className="mt-3 font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
                </li>
              ))}
            </ol>
            <Link href="/auth/signup" className="mt-12 inline-flex h-11 items-center rounded-full bg-accent px-6 font-medium text-accent-foreground hover:opacity-90 transition-opacity">
              Start your journey
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <Logo variant="wordmark" />
          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground">About</Link>
            <Link href="/explore" className="hover:text-foreground">Explore</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </nav>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Skilldrem. Find your path.</p>
        </div>
      </footer>
    </div>
  );
}
