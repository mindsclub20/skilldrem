"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

type Milestone = {
  title: string;
  description: string;
  estimated_hours: number;
  node_type: string;
  practice?: string;
  topics?: string[];
  resources_hint?: string[];
  completed?: boolean;
};

type Stage = {
  name: string;
  milestones: Milestone[];
};

type Roadmap = {
  title: string;
  description: string;
  target_outcome: string;
  difficulty: string;
  estimated_hours: number;
  category: string;
  stages: Stage[];
  career_paths?: string[];
  next_steps_after?: string;
};

type Tab = "mentor" | "roadmap" | "resources" | "progress";

export default function WorkspaceClient() {
  const [tab, setTab] = useState<Tab>("roadmap");
  const [goal, setGoal] = useState("");
  const [experience, setExperience] = useState("beginner");
  const [knowledge, setKnowledge] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const totalMilestones = roadmap
    ? roadmap.stages.reduce((acc, s) => acc + s.milestones.length, 0)
    : 0;
  const doneCount = Object.values(completed).filter(Boolean).length;
  const progressPct = totalMilestones ? Math.round((doneCount / totalMilestones) * 100) : 0;

  const generate = useCallback(async () => {
    if (!goal.trim() || goal.trim().length < 5) {
      setError("Please enter a clear learning goal.");
      return;
    }
    setLoading(true);
    setError(null);
    setSavedId(null);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/ai/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: goal.trim(),
          experience_level: experience,
          current_knowledge: knowledge.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setRoadmap(data.roadmap);
      setProvider(data.provider);
      setCompleted({});
      setTab("roadmap");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate roadmap");
    } finally {
      setLoading(false);
    }
  }, [goal, experience, knowledge]);

  const saveRoadmap = useCallback(async () => {
    if (!roadmap) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/ai/roadmap/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadmap }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSavedId(data.journey_id);
      setSaveMsg(`Saved! ${data.milestone_count} milestones stored.`);
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }, [roadmap]);

  const toggleComplete = (key: string) => {
    setCompleted((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border sticky top-0 bg-background/90 backdrop-blur z-40">
        <div className="mx-auto max-w-6xl h-14 flex items-center justify-between px-4 gap-3">
          <Link href="/dashboard" className="font-semibold shrink-0 tracking-tight">
            SKILLDREM
          </Link>
          <nav className="flex gap-1 text-sm overflow-x-auto">
            {(
              [
                ["roadmap", "My Roadmap"],
                ["mentor", "AI Mentor"],
                ["resources", "Resources"],
                ["progress", "Progress"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  tab === id
                    ? "bg-indigo-600 text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
          <Link
            href="/assistant"
            className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline"
          >
            Full chat →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {(!roadmap || tab === "roadmap") && (
          <section className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h1 className="text-xl font-bold tracking-tight">
              {roadmap ? "Refine or regenerate your roadmap" : "What do you want to learn?"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Describe your goal. SKILLDREM will build a personalized path with milestones, projects, and free resources.
            </p>
            <div className="mt-4 space-y-3">
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Become an AI engineer, Learn Python from zero, Prepare for GATE CS, Build a robotics project..."
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
              />
              <div className="flex flex-wrap gap-3 items-center">
                <label className="text-sm text-muted-foreground">
                  Experience:
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="ml-2 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </label>
                <input
                  type="text"
                  value={knowledge}
                  onChange={(e) => setKnowledge(e.target.value)}
                  placeholder="What do you already know? (optional)"
                  className="flex-1 min-w-[200px] rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                />
                <button
                  onClick={generate}
                  disabled={loading}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors"
                >
                  {loading ? "Generating…" : roadmap ? "Regenerate" : "Generate Roadmap"}
                </button>
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              {provider && (
                <p className="text-xs text-muted-foreground">Generated with {provider}</p>
              )}
            </div>
          </section>
        )}

        {tab === "roadmap" && roadmap && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-border bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-950/20 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{roadmap.title}</h2>
                  <p className="mt-1 text-muted-foreground">{roadmap.description}</p>
                  <p className="mt-2 text-sm">
                    <span className="font-medium">Outcome:</span> {roadmap.target_outcome}
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground shrink-0">
                  <div className="capitalize">{roadmap.difficulty}</div>
                  <div>~{roadmap.estimated_hours}h total</div>
                  <div className="mt-1 font-medium text-indigo-600 dark:text-indigo-400">
                    {progressPct}% complete
                  </div>
                  <button
                    onClick={saveRoadmap}
                    disabled={saving || !!savedId}
                    className="mt-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
                  >
                    {saving ? "Saving…" : savedId ? "Saved ✓" : "Save to my account"}
                  </button>
                  {saveMsg && (
                    <p className="mt-1 text-xs text-muted-foreground max-w-[180px]">{saveMsg}</p>
                  )}
                </div>
              </div>
            </div>

            {roadmap.stages.map((stage, si) => (
              <div key={si} className="rounded-2xl border border-border overflow-hidden">
                <div className="bg-muted/50 px-5 py-3 font-semibold text-sm uppercase tracking-wide">
                  Stage {si + 1}: {stage.name}
                </div>
                <ul className="divide-y divide-border">
                  {stage.milestones.map((m, mi) => {
                    const key = `${si}-${mi}`;
                    const isDone = !!completed[key];
                    return (
                      <li
                        key={key}
                        className={`p-5 transition-colors ${isDone ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""}`}
                      >
                        <div className="flex gap-4">
                          <button
                            onClick={() => toggleComplete(key)}
                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                              isDone
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-muted-foreground/40 hover:border-indigo-500"
                            }`}
                            aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                          >
                            {isDone && (
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className={`font-medium ${isDone ? "line-through opacity-70" : ""}`}>
                                {m.title}
                              </h3>
                              <span className="text-xs rounded-full bg-muted px-2 py-0.5 capitalize">
                                {m.node_type}
                              </span>
                              {m.estimated_hours != null && (
                                <span className="text-xs text-muted-foreground">~{m.estimated_hours}h</span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                            {m.topics && m.topics.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {m.topics.map((t) => (
                                  <span
                                    key={t}
                                    className="text-xs rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                            {m.practice && (
                              <div className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                                <span className="font-medium text-indigo-600 dark:text-indigo-400">Practice: </span>
                                {m.practice}
                              </div>
                            )}
                            {m.resources_hint && m.resources_hint.length > 0 && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                Resources: {m.resources_hint.join(" · ")}
                              </div>
                            )}
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                onClick={() => setTab("mentor")}
                                className="text-xs rounded-lg border border-border px-2.5 py-1 hover:bg-muted"
                              >
                                Ask AI Mentor
                              </button>
                              <button
                                onClick={() => setTab("resources")}
                                className="text-xs rounded-lg border border-border px-2.5 py-1 hover:bg-muted"
                              >
                                Find resources
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            {roadmap.career_paths && roadmap.career_paths.length > 0 && (
              <div className="rounded-xl border border-border p-5">
                <h3 className="font-semibold">Related career paths</h3>
                <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground">
                  {roadmap.career_paths.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {tab === "mentor" && (
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">AI Mentor</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Context-aware help for your current roadmap. Open the full assistant for longer conversations.
            </p>
            {roadmap ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm">
                  Active roadmap: <strong>{roadmap.title}</strong> ({progressPct}% complete)
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Explain the next milestone simply",
                    "Give me a practice exercise",
                    "What should I learn first?",
                    "Review my progress and suggest next step",
                  ].map((s) => (
                    <Link
                      key={s}
                      href={`/assistant?q=${encodeURIComponent(
                        `Regarding my roadmap "${roadmap.title}": ${s}`
                      )}`}
                      className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      {s}
                    </Link>
                  ))}
                </div>
                <Link
                  href="/assistant"
                  className="inline-flex mt-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  Open full AI Mentor chat
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Generate a roadmap first so the mentor can give contextual advice.
              </p>
            )}
          </section>
        )}

        {tab === "resources" && (
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Learning Resources</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Discover free and high-quality resources matched to your milestones. Prefer free sources whenever quality is equivalent.
            </p>
            {roadmap ? (
              <div className="mt-4 space-y-4">
                {roadmap.stages.flatMap((stage, si) =>
                  stage.milestones.map((m, mi) => (
                    <div key={`${si}-${mi}`} className="rounded-xl border border-border p-4">
                      <h3 className="font-medium text-sm">{m.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Hints: {(m.resources_hint || ["Official docs", "YouTube tutorials", "Practice platforms"]).join(" · ")}
                      </p>
                      <Link
                        href={`/discover?q=${encodeURIComponent(m.title + " " + (m.topics?.[0] || roadmap.category || ""))}`}
                        className="inline-block mt-2 text-xs text-indigo-600 hover:underline"
                      >
                        Search Discover for this milestone →
                      </Link>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Generate a roadmap to see resource suggestions per milestone.
              </p>
            )}
            <div className="mt-6">
              <Link
                href="/discover"
                className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted"
              >
                Open Discover
              </Link>
            </div>
          </section>
        )}

        {tab === "progress" && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">Progress Tracker</h2>
              {roadmap ? (
                <>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Overall completion</span>
                      <span className="font-medium">{progressPct}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                  <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="rounded-xl bg-muted/50 p-4">
                      <dt className="text-xs text-muted-foreground">Completed</dt>
                      <dd className="text-2xl font-bold mt-1">{doneCount}</dd>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-4">
                      <dt className="text-xs text-muted-foreground">Remaining</dt>
                      <dd className="text-2xl font-bold mt-1">{totalMilestones - doneCount}</dd>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-4">
                      <dt className="text-xs text-muted-foreground">Total milestones</dt>
                      <dd className="text-2xl font-bold mt-1">{totalMilestones}</dd>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-4">
                      <dt className="text-xs text-muted-foreground">Est. hours left</dt>
                      <dd className="text-2xl font-bold mt-1">
                        {roadmap.stages.reduce((acc, s, si) => {
                          return (
                            acc +
                            s.milestones.reduce((a, m, mi) => {
                              const key = `${si}-${mi}`;
                              return a + (completed[key] ? 0 : m.estimated_hours || 0);
                            }, 0)
                          );
                        }, 0)}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-xs text-muted-foreground">
                    Progress is stored locally in this session. Full persistence to Supabase learner_progress is next.
                  </p>
                </>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Generate and start a roadmap to track progress.
                </p>
              )}
            </div>
          </section>
        )}

        {!roadmap && tab === "roadmap" && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Enter a goal above and generate your personalized learning journey.
          </div>
        )}
      </main>
    </div>
  );
}
