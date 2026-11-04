"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MarkdownMessage } from "@/components/ai/MarkdownMessage";
import { PracticePanel } from "@/components/learn/PracticePanel";

type Tab = "mentor" | "roadmap" | "resources" | "practice" | "progress";

type Resource = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  provider: string | null;
  pricing_type: string | null;
  resource_type: string;
};

type Milestone = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  estimated_hours: number | null;
  node_type: string;
  metadata?: Record<string, unknown>;
  progress?: { status: string; completed_at: string | null; notes: string | null };
  resources?: Resource[];
};

type Enrollment = {
  id: string;
  status: string;
  progress_percent: number | null;
  journey_id: string;
  journeys?: {
    id: string;
    title: string;
    description: string | null;
    difficulty: string | null;
    estimated_hours: number | null;
    target_outcome: string | null;
    category: string | null;
  } | null;
};

type Msg = { role: "user" | "assistant"; content: string; provider?: string };

export default function LearnWorkspacePage() {
  const [tab, setTab] = useState<Tab>("mentor");
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("beginner");
  const [budget, setBudget] = useState("free_preferred");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [activeUJ, setActiveUJ] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeMilestoneId, setActiveMilestoneId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);

  const loadEnrollments = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/roadmap");
      if (!res.ok) return;
      const data = await res.json();
      setEnrollments(data.enrollments ?? []);
      if (!activeUJ && data.enrollments?.[0]?.id) setActiveUJ(data.enrollments[0].id);
    } catch {
      /* ignore */
    }
  }, [activeUJ]);

  const loadDetail = useCallback(async (ujId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/ai/progress?userJourneyId=${encodeURIComponent(ujId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setEnrollment(data.enrollment);
      setMilestones(data.milestones ?? []);
      const firstOpen =
        (data.milestones as Milestone[])?.find((m) => m.progress?.status !== "completed") ??
        data.milestones?.[0];
      if (firstOpen) setActiveMilestoneId(firstOpen.id);
    } catch {
      setMilestones([]);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    void loadEnrollments();
  }, [loadEnrollments]);

  useEffect(() => {
    if (activeUJ) void loadDetail(activeUJ);
  }, [activeUJ, loadDetail]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  async function generateRoadmap() {
    const g = goal.trim();
    if (!g || generating) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/ai/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: g, experienceLevel: level, budget }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setGoal("");
      await loadEnrollments();
      if (data.userJourney?.id) {
        setActiveUJ(data.userJourney.id);
        setTab("roadmap");
      }
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Failed");
    } finally {
      setGenerating(false);
    }
  }

  async function markComplete(milestoneId: string) {
    if (!activeUJ) return;
    try {
      const res = await fetch("/api/ai/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId, userJourneyId: activeUJ, status: "completed" }),
      });
      if (res.ok) await loadDetail(activeUJ);
    } catch {
      /* ignore */
    }
  }

  async function sendMentor(text: string) {
    const trimmed = text.trim();
    if (!trimmed || chatLoading || sendingRef.current) return;
    sendingRef.current = true;
    setInput("");
    setChatError(null);
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setChatLoading(true);
    const activeMs = milestones.find((m) => m.id === activeMilestoneId);
    const contextParts = [
      enrollment?.journeys?.title ? `Current roadmap: ${enrollment.journeys.title}` : "",
      enrollment?.journeys?.target_outcome
        ? `Target outcome: ${enrollment.journeys.target_outcome}`
        : "",
      activeMs ? `Current milestone: ${activeMs.title}\n${activeMs.description || ""}` : "",
      `Progress: ${enrollment?.progress_percent ?? 0}%`,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      const history = messages.map(({ role, content }) => ({ role, content }));
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: contextParts
            ? `[Learning context]\n${contextParts}\n\n[User]\n${trimmed}`
            : trimmed,
          history,
          conversationId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      if (data.conversationId) setConversationId(data.conversationId);
      setMessages((m) => [...m, { role: "assistant", content: data.text, provider: data.provider }]);
    } catch (e) {
      setChatError(e instanceof Error ? e.message : "Failed");
    } finally {
      setChatLoading(false);
      sendingRef.current = false;
    }
  }

  const activeMs = milestones.find((m) => m.id === activeMilestoneId);

  return (
    <div className="h-[100dvh] flex flex-col bg-background text-foreground overflow-hidden">
      <header className="h-12 shrink-0 border-b border-border flex items-center gap-3 px-3 sm:px-4">
        <Link href="/dashboard" className="font-semibold text-sm shrink-0">
          SKILLDREM
        </Link>
        <span className="text-muted-foreground text-sm hidden sm:inline">Learn</span>
        <div className="ml-auto flex items-center gap-2 overflow-x-auto">
          {enrollments.length > 0 && (
            <select
              value={activeUJ ?? ""}
              onChange={(e) => setActiveUJ(e.target.value || null)}
              className="text-xs sm:text-sm rounded-lg border border-border bg-card px-2 py-1.5 max-w-[12rem] sm:max-w-xs"
            >
              {enrollments.map((e) => (
                <option key={e.id} value={e.id}>
                  {(e.journeys as Enrollment["journeys"])?.title || "Roadmap"}
                </option>
              ))}
            </select>
          )}
          <Link href="/assistant" className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap">
            Classic chat
          </Link>
        </div>
      </header>

      <nav className="shrink-0 border-b border-border flex gap-1 px-2 sm:px-4 overflow-x-auto">
        {(
          [
            ["mentor", "AI Mentor"],
            ["roadmap", "My Roadmap"],
            ["resources", "Resources"],
            ["practice", "Practice"],
            ["progress", "Progress"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === id
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col md:flex-row">
        {!activeUJ && tab !== "mentor" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
              <h1 className="text-xl font-bold">Start learning</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Tell SKILLDREM what you want to learn. We will build a personal roadmap and find free
                resources for every milestone.
              </p>
              <label className="mt-6 block text-sm font-medium">Goal</label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={3}
                placeholder="e.g. Learn Python for data analysis from scratch"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-2 text-sm"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Budget</label>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-2 text-sm"
                  >
                    <option value="free_only">Free only</option>
                    <option value="free_preferred">Free preferred</option>
                    <option value="mixed">Mixed</option>
                    <option value="paid_ok">Paid OK</option>
                  </select>
                </div>
              </div>
              {genError && <p className="mt-3 text-sm text-red-600">{genError}</p>}
              <button
                type="button"
                disabled={generating || goal.trim().length < 3}
                onClick={() => void generateRoadmap()}
                className="mt-6 w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-40"
              >
                {generating ? "Building roadmap & finding free resources…" : "Create my learning path"}
              </button>
            </div>
          </div>
        )}

        {tab === "mentor" && (
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4">
              {!messages.length && !chatLoading ? (
                <div className="max-w-xl mx-auto text-center pt-12">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold">
                    S
                  </div>
                  <h2 className="mt-4 text-xl font-semibold">AI Mentor</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {activeMs
                      ? `Ready to help with: ${activeMs.title}`
                      : "Ask anything about your learning path, or generate a roadmap first."}
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {["Explain the current milestone simply", "Give me a 30-minute free practice plan", "What should I learn next?"].map(
                      (s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => void sendMentor(s)}
                          className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted"
                        >
                          {s}
                        </button>
                      )
                    )}
                  </div>
                  {!activeUJ && (
                    <button type="button" onClick={() => setTab("roadmap")} className="mt-6 text-sm text-accent font-medium">
                      Create a roadmap first →
                    </button>
                  )}
                </div>
              ) : (
                <div className="mx-auto max-w-2xl space-y-4">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[min(100%,36rem)] rounded-2xl px-4 py-3 text-[15px] ${
                          m.role === "user"
                            ? "bg-primary text-primary-foreground whitespace-pre-wrap"
                            : "bg-card border border-border shadow-sm"
                        }`}
                      >
                        {m.role === "assistant" ? (
                          <MarkdownMessage content={m.content} />
                        ) : (
                          m.content.replace(/^\[Learning context\][\s\S]*?\[User\]\n/, "")
                        )}
                      </div>
                    </div>
                  ))}
                  {chatLoading && <p className="text-sm text-muted-foreground animate-pulse">Mentor is thinking…</p>}
                  {chatError && <p className="text-sm text-red-600">{chatError}</p>}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendMentor(input);
              }}
              className="shrink-0 border-t border-border p-3 sm:p-4"
            >
              <div className="mx-auto max-w-2xl flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask your mentor…"
                  disabled={chatLoading}
                  className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !input.trim()}
                  className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        )}

        {tab === "roadmap" && activeUJ && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {loadingDetail ? (
              <p className="text-sm text-muted-foreground">Loading roadmap…</p>
            ) : (
              <div className="mx-auto max-w-2xl">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-bold">{enrollment?.journeys?.title || "Your roadmap"}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">{enrollment?.journeys?.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-accent">
                      {Math.round(Number(enrollment?.progress_percent ?? 0))}%
                    </p>
                    <p className="text-xs text-muted-foreground">complete</p>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${Math.min(100, Number(enrollment?.progress_percent ?? 0))}%` }}
                  />
                </div>
                <ol className="mt-8 space-y-4">
                  {milestones.map((m, idx) => {
                    const st = m.progress?.status || "not_started";
                    const selected = m.id === activeMilestoneId;
                    return (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => setActiveMilestoneId(m.id)}
                          className={`w-full text-left rounded-2xl border p-4 transition-colors ${
                            selected ? "border-accent bg-accent/5" : "border-border bg-card hover:border-accent/40"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                st === "completed"
                                  ? "bg-accent text-accent-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {st === "completed" ? "✓" : idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium">{m.title}</p>
                              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{m.description}</p>
                              <p className="mt-2 text-[11px] text-muted-foreground capitalize">
                                {m.node_type}
                                {m.estimated_hours != null ? ` · ~${m.estimated_hours}h` : ""}
                                {` · ${st.replace("_", " ")}`}
                              </p>
                            </div>
                          </div>
                        </button>
                        {selected && (
                          <div className="mt-2 ml-11 flex flex-wrap gap-2">
                            {st !== "completed" && (
                              <button
                                type="button"
                                onClick={() => void markComplete(m.id)}
                                className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground"
                              >
                                Mark complete
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setTab("mentor");
                                void sendMentor(`Teach me about: ${m.title}. ${m.description || ""}`);
                              }}
                              className="rounded-full border border-border px-3 py-1.5 text-xs"
                            >
                              Ask mentor
                            </button>
                            <button
                              type="button"
                              onClick={() => setTab("practice")}
                              className="rounded-full border border-border px-3 py-1.5 text-xs"
                            >
                              Practice
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </div>
        )}

        {tab === "resources" && activeUJ && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto max-w-2xl">
              <h2 className="text-lg font-semibold">Resources by milestone</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Discovered via search. Always verify free/paid on the source site.
              </p>
              {milestones.map((m) => (
                <section key={m.id} className="mt-6">
                  <h3 className="font-medium text-sm text-muted-foreground">{m.title}</h3>
                  {!m.resources?.length ? (
                    <p className="mt-2 text-sm text-muted-foreground">No resources found for this milestone yet.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {m.resources.map((r) => (
                        <li key={r.id} className="rounded-xl border border-border bg-card p-3">
                          <a
                            href={r.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-sm text-primary hover:underline"
                          >
                            {r.title}
                          </a>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {[r.provider, r.resource_type, r.pricing_type].filter(Boolean).join(" · ")}
                          </p>
                          {r.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </div>
        )}

        {tab === "practice" && activeUJ && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {activeMs ? (
              <PracticePanel
                topic={activeMs.title}
                description={activeMs.description}
                difficulty={
                  (activeMs.metadata?.difficulty as string) ||
                  enrollment?.journeys?.difficulty ||
                  "beginner"
                }
                milestoneId={activeMs.id}
                userJourneyId={activeUJ}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Select a milestone on the Roadmap tab first.</p>
            )}
          </div>
        )}

        {tab === "progress" && activeUJ && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto max-w-2xl">
              <h2 className="text-lg font-semibold">Progress</h2>
              <p className="mt-4 text-4xl font-bold text-accent">
                {Math.round(Number(enrollment?.progress_percent ?? 0))}%
              </p>
              <p className="text-sm text-muted-foreground">
                {milestones.filter((m) => m.progress?.status === "completed").length} of{" "}
                {milestones.length} milestones completed
              </p>
              <ul className="mt-6 space-y-2">
                {milestones.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm"
                  >
                    <span className="truncate pr-3">{m.title}</span>
                    <span className="capitalize text-muted-foreground shrink-0">
                      {(m.progress?.status || "not_started").replace("_", " ")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeUJ && activeMs && tab === "mentor" && (
          <aside className="hidden lg:flex w-80 shrink-0 border-l border-border flex-col overflow-y-auto p-4 bg-card/50">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Current milestone</p>
            <h3 className="mt-1 font-semibold">{activeMs.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{activeMs.description}</p>
            <p className="mt-4 text-[11px] uppercase tracking-wide text-muted-foreground">Resources</p>
            <ul className="mt-2 space-y-2">
              {(activeMs.resources || []).slice(0, 5).map((r) => (
                <li key={r.id}>
                  <a
                    href={r.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline line-clamp-2"
                  >
                    {r.title}
                  </a>
                </li>
              ))}
              {!activeMs.resources?.length && (
                <li className="text-xs text-muted-foreground">None linked yet</li>
              )}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
