"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Clock3,
  RotateCcw,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { MarkdownMessage } from "@/components/ai/MarkdownMessage";
import {
  buildSprintGoal,
  type SprintDays,
  type SprintLevel,
  type SprintMinutes,
} from "@/lib/sprint";

type Budget = "free_only" | "free_preferred" | "mixed" | "paid_ok";
type Resource = { title: string | null; description: string | null; url: string; source: string | null };

const budgets: { value: Budget; label: string; detail: string }[] = [
  { value: "free_only", label: "Free only", detail: "Keep the whole path at $0" },
  { value: "free_preferred", label: "Free first", detail: "Only add paid options if truly useful" },
  { value: "mixed", label: "Free + paid", detail: "Show both, clearly labelled" },
  { value: "paid_ok", label: "Paid is okay", detail: "Prioritise quality and show free alternatives" },
];

const levels: { value: SprintLevel; label: string; detail: string }[] = [
  { value: "beginner", label: "Starting fresh", detail: "Assume no prior knowledge" },
  { value: "some_experience", label: "Know a little", detail: "I know the basics" },
  { value: "confident", label: "Build on my skills", detail: "I can already work independently" },
];

const times: SprintMinutes[] = [20, 40, 60, 90];

export default function SprintPage() {
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState<SprintLevel>("beginner");
  const [minutes, setMinutes] = useState<SprintMinutes>(40);
  const [days, setDays] = useState<SprintDays>(7);
  const [budget, setBudget] = useState<Budget>("free_preferred");
  const [plan, setPlan] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [completedDays, setCompletedDays] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completedCount = completedDays.filter(Boolean).length;
  const progress = useMemo(
    () => (days ? Math.round((completedCount / days) * 100) : 0),
    [completedCount, days]
  );

  async function createSprint(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    setPlan(null);
    setResources([]);
    setCompletedDays(Array.from({ length: days }, () => false));

    try {
      const sprintGoal = buildSprintGoal({ goal, level, minutesPerDay: minutes, days });
      const response = await fetch("/api/ai/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: sprintGoal, budget }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create your sprint.");
      setPlan(data.plan);
      setResources(data.resources ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function toggleDay(index: number) {
    setCompletedDays((current) =>
      current.map((done, itemIndex) => (itemIndex === index ? !done : done))
    );
  }

  function resetSprint() {
    setPlan(null);
    setResources([]);
    setCompletedDays([]);
    setError(null);
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-border/70 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">S</span>
            SKILLDREM
          </Link>
          <Link href="/discover" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
            Explore all tools <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,_rgba(45,212,191,0.16),_transparent_48%),radial-gradient(ellipse_at_90%_70%,_rgba(99,102,241,0.13),_transparent_42%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
              <Sparkles className="h-3.5 w-3.5" /> YOUR NEXT 7 DAYS START HERE
            </div>
            <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Turn “I want to learn” into <span className="text-accent">I did it.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Build a realistic learning sprint around your goal, your current level, and the time you actually have.
              One focused mission at a time.
            </p>
            <div className="mt-7 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-accent" /> 20–90 min/day</span>
              <span className="inline-flex items-center gap-2"><Target className="h-4 w-4 text-accent" /> Personalised missions</span>
              <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4 text-accent" /> Free-first resources</span>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card/85 p-5 shadow-2xl shadow-slate-950/10 backdrop-blur-xl sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Sprint builder</p>
                <h2 className="mt-1 text-xl font-semibold">Design your learning week</h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Zap className="h-5 w-5" />
              </div>
            </div>

            <form onSubmit={createSprint} className="space-y-5">
              <div>
                <label htmlFor="sprint-goal" className="mb-2 block text-sm font-medium">What do you want to learn?</label>
                <input
                  id="sprint-goal"
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  maxLength={200}
                  required
                  placeholder="e.g. Build my first Arduino robot"
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <fieldset>
                <legend className="mb-2 text-sm font-medium">Where are you starting?</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {levels.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setLevel(item.value)}
                      aria-pressed={level === item.value}
                      className={`rounded-xl border p-3 text-left transition ${level === item.value ? "border-accent bg-accent/10 ring-1 ring-accent/30" : "border-border bg-background hover:border-accent/40"}`}
                    >
                      <span className="block text-xs font-semibold">{item.label}</span>
                      <span className="mt-1 block text-[11px] leading-4 text-muted-foreground">{item.detail}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="sprint-days" className="mb-2 block text-sm font-medium">Sprint length</label>
                  <select id="sprint-days" value={days} onChange={(event) => setDays(Number(event.target.value) as SprintDays)} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">
                    <option value={7}>7 days · Quick start</option>
                    <option value={14}>14 days · Deep focus</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="sprint-time" className="mb-2 block text-sm font-medium">Time each day</label>
                  <select id="sprint-time" value={minutes} onChange={(event) => setMinutes(Number(event.target.value) as SprintMinutes)} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">
                    {times.map((time) => <option key={time} value={time}>{time} minutes</option>)}
                  </select>
                </div>
              </div>

              <fieldset>
                <legend className="mb-2 text-sm font-medium">Your resource budget</legend>
                <div className="grid grid-cols-2 gap-2">
                  {budgets.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setBudget(item.value)}
                      aria-pressed={budget === item.value}
                      className={`rounded-xl border p-3 text-left transition ${budget === item.value ? "border-accent bg-accent/10 ring-1 ring-accent/30" : "border-border bg-background hover:border-accent/40"}`}
                    >
                      <span className="block text-xs font-semibold">{item.label}</span>
                      <span className="mt-1 block text-[11px] leading-4 text-muted-foreground">{item.detail}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              {error && <p role="alert" className="rounded-xl border border-red-300/60 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}

              <button type="submit" disabled={loading || goal.trim().length < 2} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? "Building your sprint…" : "Create my learning sprint"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
              <p className="text-center text-[11px] text-muted-foreground">No account needed to try it. Your choices are sent to the AI planner to create your path.</p>
            </form>
          </div>
        </div>
      </section>

      {plan && (
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Your plan is ready</p>
              <h2 className="mt-1 text-2xl font-bold">Your learning sprint</h2>
            </div>
            <button type="button" onClick={resetSprint} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <RotateCcw className="h-4 w-4" /> Build another
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <article className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-7">
              <MarkdownMessage content={plan} />
              {resources.length > 0 && (
                <div className="mt-7 border-t border-border pt-5">
                  <h3 className="mb-3 font-semibold">Resources found for this sprint</h3>
                  <ul className="space-y-3">
                    {resources.map((resource) => (
                      <li key={resource.url} className="rounded-xl border border-border p-3">
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-accent hover:underline">{resource.title || resource.url}</a>
                        <p className="mt-1 text-xs text-muted-foreground">{resource.source} · Verify availability and pricing on the source site.</p>
                        {resource.description && <p className="mt-1 text-sm text-muted-foreground">{resource.description}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>

            <aside className="h-fit rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-accent" />
                <h3 className="font-semibold">Daily check-in</h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Tick off each day when you finish its mission.</p>
              <div className="mt-5 flex items-end justify-between">
                <span className="text-3xl font-bold tabular-nums">{completedCount}<span className="text-base font-medium text-muted-foreground">/{days}</span></span>
                <span className="text-xs font-semibold text-accent">{progress}% complete</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-5 grid grid-cols-7 gap-2">
                {completedDays.map((done, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleDay(index)}
                    aria-label={`Mark day ${index + 1} ${done ? "incomplete" : "complete"}`}
                    aria-pressed={done}
                    className={`flex aspect-square items-center justify-center rounded-lg border text-xs font-semibold transition ${done ? "border-accent bg-accent text-accent-foreground" : "border-border bg-background text-muted-foreground hover:border-accent/50"}`}
                  >
                    {done ? <Check className="h-4 w-4" /> : index + 1}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-[11px] leading-5 text-muted-foreground">Progress is temporary and stays in this page session. Refreshing the page resets the check-ins.</p>
            </aside>
          </div>
        </section>
      )}

      <footer className="border-t border-border px-4 py-8 text-center text-xs text-muted-foreground">
        <Link href="/" className="inline-flex items-center gap-2 hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back to Skilldrem</Link>
        <p className="mt-3">AI-generated learning guidance. Check source pages for current availability and pricing.</p>
      </footer>
    </main>
  );
}
