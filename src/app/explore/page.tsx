import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { BookOpen, Bot, GraduationCap, Map, Search, Zap } from "lucide-react";

export const metadata = {
  title: "Explore",
  description: "Browse courses, ebooks, mentors, Geornies and Learning Sprints on Skilldrem.",
};

const SECTIONS = [
  {
    href: "/courses",
    title: "Courses",
    desc: "Free, audit, freemium and paid courses with honest pricing labels.",
    icon: GraduationCap,
  },
  {
    href: "/books",
    title: "Ebooks",
    desc: "Open textbooks and legal free ebooks only — no piracy facilitation.",
    icon: BookOpen,
  },
  {
    href: "/mentors",
    title: "AI mentors",
    desc: "Tools for coding, math and study help, with clear limitations.",
    icon: Bot,
  },
  {
    href: "/georny",
    title: "Georny roadmaps",
    desc: "Visual learning paths with milestones and resource links.",
    icon: Map,
  },
  {
    href: "/sprint",
    title: "Learning Sprint",
    desc: "7- or 14-day plans with daily missions you can complete today.",
    icon: Zap,
  },
  {
    href: "/discover",
    title: "AI discovery",
    desc: "Describe a goal and get a free-first path from search + planning.",
    icon: Search,
  },
];

export default function ExplorePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-40">
        <div className="mx-auto max-w-6xl h-14 flex items-center justify-between px-4">
          <Logo variant="wordmark" />
          <div className="flex gap-3 text-sm">
            <Link href="/auth/login" className="text-muted-foreground hover:text-foreground">Log in</Link>
            <Link href="/auth/signup" className="font-medium text-accent">Sign up to save</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Explore</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Browse public learning surfaces. Sign in when you want to save resources, start a sprint, or track progress.
        </p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition hover:border-accent/40"
              >
                <s.icon className="h-6 w-6 text-accent" />
                <h2 className="mt-4 font-semibold text-lg">{s.title}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.desc}</p>
                <span className="mt-4 text-sm font-medium text-accent">Open →</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-10 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Want to save a course or start a roadmap?{" "}
          <Link href="/auth/signup" className="text-accent font-medium hover:underline">Create a free account</Link>
          {" "}to unlock the dashboard and workspace.
        </p>
      </main>
    </div>
  );
}
