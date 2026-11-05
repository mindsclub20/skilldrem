"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  hours_per_week?: number | null;
  journeys?: {
    id: string;
    title: string;
    description: string | null;
    difficulty: string | null;
    estimated_hours: number | null;
    target_outcome: string | null;
    category: string | null;
    is_published?: boolean | null;
    created_by?: string | null;
  } | null;
};

type Msg = { role: "user" | "assistant"; content: string; provider?: string };

type LearningContext = {
  userJourneyId?: string | null;
  journeyTitle?: string | null;
  targetOutcome?: string | null;
  progressPercent?: number | null;
  currentMilestone?: {
    id: string;
    title: string;
    description?: string | null;
    difficulty?: string | null;
  } | null;
  nextMilestone?: { id: string; title: string } | null;
  weakTopics?: string[];
  recentPracticeScore?: { score: number; maxScore: number; topic: string } | null;
  resourceHints?: { title: string; url?: string | null; pricing_type?: string | null }[];
};

type ActivityStats = {
  currentStreak: number;
  longestStreak: number;
  totalXp: number;
  badges: { id: string; badge_key: string; title: string; description?: string | null; awarded_at?: string }[];
};

type ScheduleItem = {
  id: string;
  title: string;
  estimated_hours?: number;
  estimatedWeeksFromStart?: number;
  suggestedDeadline?: string;
  cumulativeHours?: number;
};

type DiagQuestion = {
  id: string;
  type: string;
  prompt: string;
  options?: string[];
  difficulty?: string;
};

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
  const [learningContext, setLearningContext] = useState<LearningContext | null>(null);
  const [nextAction, setNextAction] = useState<{ title: string; detail: string; type?: string } | null>(null);
  const [activity, setActivity] = useState<ActivityStats | null>(null);
  const [hoursPerWeek, setHoursPerWeek] = useState(5);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);
  const [diagOpen, setDiagOpen] = useState(false);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagError, setDiagError] = useState<string | null>(null);
  const [diagSessionId, setDiagSessionId] = useState<string | null>(null);
  const [diagQuestions, setDiagQuestions] = useState<DiagQuestion[]>([]);
  const [diagEarly, setDiagEarly] = useState<{ id: string; title: string }[]>([]);
  const [diagSkipIds, setDiagSkipIds] = useState<string[]>([]);
  const [resourceFilter, setResourceFilter] = useState<"all" | "docs" | "video">("all");

  const loadActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/activity");
      if (!res.ok) return;
      const data = await res.json();
      setActivity({
        currentStreak: Number(data.currentStreak ?? data.streak ?? 0),
        longestStreak: Number(data.longestStreak ?? 0),
        totalXp: Number(data.totalXp ?? 0),
        badges: data.badges ?? [],
      });
    } catch {
      /* ignore */
    }
  }, []);

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
      setLearningContext(data.learningContext ?? null);
      setNextAction(data.nextAction ?? null);
      if (data.enrollment?.hours_per_week) {
        setHoursPerWeek(Number(data.enrollment.hours_per_week));
      }
      const firstOpen =
        (data.milestones as Milestone[])?.find(
          (m) => m.progress?.status !== "completed" && m.progress?.status !== "skipped"
        ) ?? data.milestones?.[0];
      if (firstOpen) setActiveMilestoneId(firstOpen.id);
    } catch {
      setMilestones([]);
      setLearningContext(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const loadSchedule = useCallback(async (ujId: string) => {
    try {
      const res = await fetch(`/api/ai/schedule?userJourneyId=${encodeURIComponent(ujId)}`);
      if (!res.ok) return;
      const data = await res.json();
      const items = (data.schedule?.milestones ?? []) as ScheduleItem[];
      setSchedule(Array.isArray(items) ? items : []);
      if (data.schedule?.hoursPerWeek != null) setHoursPerWeek(Number(data.schedule.hoursPerWeek));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadEnrollments();
    void loadActivity();
  }, [loadEnrollments, loadActivity]);

  useEffect(() => {
    if (activeUJ) {
      void loadDetail(activeUJ);
      void loadSchedule(activeUJ);
    }
  }, [activeUJ, loadDetail, loadSchedule]);

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
      if (res.ok) {
        await loadDetail(activeUJ);
        await loadActivity();
      }
    } catch {
      /* ignore */
    }
  }

  async function saveSchedule() {
    if (!activeUJ || scheduleLoading) return;
    setScheduleLoading(true);
    setScheduleMsg(null);
    try {
      const res = await fetch("/api/ai/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userJourneyId: activeUJ, hoursPerWeek }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Schedule failed");
      const items = (data.schedule?.milestones ?? []) as ScheduleItem[];
      setSchedule(Array.isArray(items) ? items : []);
      setScheduleMsg(`Plan updated for ${hoursPerWeek} h/week`);
      await loadDetail(activeUJ);
    } catch (e) {
      setScheduleMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setScheduleLoading(false);
    }
  }

  async function togglePublish() {
    const journeyId = enrollment?.journeys?.id || enrollment?.journey_id;
    if (!journeyId || publishLoading) return;
    const next = !Boolean(enrollment?.journeys?.is_published);
    setPublishLoading(true);
    setPublishMsg(null);
    try {
      const res = await fetch("/api/ai/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journeyId, isPublished: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Publish failed");
      setPublishMsg(data.message || (next ? "Published" : "Unpublished"));
      if (activeUJ) await loadDetail(activeUJ);
    } catch (e) {
      setPublishMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setPublishLoading(false);
    }
  }

  async function startDiagnostic() {
    if (!activeUJ || diagLoading) return;
    setDiagLoading(true);
    setDiagError(null);
    setDiagOpen(true);
    setDiagQuestions([]);
    setDiagSessionId(null);
    setDiagSkipIds([]);
    try {
      const res = await fetch("/api/ai/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userJourneyId: activeUJ, action: "generate" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Diagnostic failed");
      setDiagSessionId(data.sessionId);
      setDiagQuestions(data.questions ?? []);
      setDiagEarly((data.milestones ?? []).map((m: { id: string; title: string }) => ({ id: m.id, title: m.title })));
    } catch (e) {
      setDiagError(e instanceof Error ? e.message : "Failed");
    } finally {
      setDiagLoading(false);
    }
  }

  async function applyDiagnosticSkip() {
    if (!activeUJ || !diagSkipIds.length || diagLoading) return;
    setDiagLoading(true);
    setDiagError(null);
    try {
      const res = await fetch("/api/ai/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userJourneyId: activeUJ,
          action: "apply",
          skipMilestoneIds: diagSkipIds,
          sessionId: diagSessionId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Apply failed");
      setDiagOpen(false);
      await loadDetail(activeUJ);
      await loadActivity();
    } catch (e) {
      setDiagError(e instanceof Error ? e.message : "Failed");
    } finally {
      setDiagLoading(false);
    }
  }

  function buildMentorContext(): LearningContext {
    if (learningContext) {
      const activeMs = milestones.find((m) => m.id === activeMilestoneId);
      if (activeMs && learningContext.currentMilestone?.id !== activeMs.id) {
        return {
          ...learningContext,
          currentMilestone: {
            id: activeMs.id,
            title: activeMs.title,
            description: activeMs.description,
            difficulty: (activeMs.metadata?.difficulty as string) || undefined,
          },
          resourceHints: (activeMs.resources || []).slice(0, 5).map((r) => ({
            title: r.title,
            url: r.url,
            pricing_type: r.pricing_type,
          })),
        };
      }
      return learningContext;
    }
    const activeMs = milestones.find((m) => m.id === activeMilestoneId);
    const openIdx = milestones.findIndex((m) => m.id === activeMilestoneId);
    const next = openIdx >= 0 ? milestones[openIdx + 1] : null;
    return {
      userJourneyId: activeUJ,
      journeyTitle: enrollment?.journeys?.title,
      targetOutcome: enrollment?.journeys?.target_outcome,
      progressPercent: enrollment?.progress_percent ?? 0,
      currentMilestone: activeMs
        ? {
            id: activeMs.id,
            title: activeMs.title,
            description: activeMs.description,
            difficulty: (activeMs.metadata?.difficulty as string) || undefined,
          }
        : null,
      nextMilestone: next ? { id: next.id, title: next.title } : null,
      resourceHints: (activeMs?.resources || []).slice(0, 5).map((r) => ({
        title: r.title,
        url: r.url,
        pricing_type: r.pricing_type,
      })),
    };
  }

  async function sendMentor(text: string) {
    const trimmed = text.trim();
    if (!trimmed || chatLoading || sendingRef.current) return;
    sendingRef.current = true;
    setInput("");
    setChatError(null);
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setChatLoading(true);
    const ctx = buildMentorContext();
    try {
      const history = messages.map(({ role, content }) => ({ role, content }));
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history,
          conversationId,
          learningContext: ctx,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      if (data.conversationId) setConversationId(data.conversationId);
      setMessages((m) => [...m, { role: "assistant", content: data.text, provider: data.provider }]);
      void fetch("/api/ai/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityType: "mentor", xp: 5 }),
      }).then(() => loadActivity());
    } catch (e) {
      setChatError(e instanceof Error ? e.message : "Failed");
    } finally {
      setChatLoading(false);
      sendingRef.current = false;
    }
  }

  const activeMs = milestones.find((m) => m.id === activeMilestoneId);
  const isOwner = Boolean(enrollment?.journeys?.created_by);
  const isPublished = Boolean(enrollment?.journeys?.is_published);

  const filteredResources = useMemo(() => {
    return milestones.map((m) => {
      const resources = (m.resources || []).filter((r) => {
        if (resourceFilter === "all") return true;
        const t = `${r.resource_type || ""} ${r.title || ""}`.toLowerCase();
        if (resourceFilter === "video") return /video|youtube|watch|course/.test(t);
        if (resourceFilter === "docs")
          return /doc|article|guide|tutorial|book|text|mdn|official/.test(t) || !/video|youtube/.test(t);
        return true;
      });
      return { ...m, resources };
    });
  }, [milestones, resourceFilter]);

  const scheduleById = useMemo(() => {
    const map = new Map<string, ScheduleItem>();
    for (const s of schedule) {
      if (s.id) map.set(s.id, s);
    }
    return map;
  }, [schedule]);

  return (
    <div className="h-[100dvh] flex flex-col bg-background text-foreground overflow-hidden">
      <header className="h-12 shrink-0 border-b border-border flex items-center gap-3 px-3 sm:px-4">
        <Link href="/dashboard" className="font-semibold text-sm shrink-0">
          SKILLDREM
        </Link>
        <span className="text-muted-foreground text-sm hidden sm:inline">Learn</span>
        {activity && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground ml-2">
            <span className="rounded-full border border-border bg-card px-2 py-0.5" title="Current streak">
              🔥 {activity.currentStreak}d
            </span>
            <span className="rounded-full border border-border bg-card px-2 py-0.5" title="Total XP">
              ⚡ {activity.totalXp} XP
            </span>
          </div>
        )}
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
                Tell SKILLDREM what you want to learn. We will build a personal roadmap and find free resources for every milestone.
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
                  <select value={level} onChange={(e) => setLevel(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-2 text-sm">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Budget</label>
                  <select value={budget} onChange={(e) => setBudget(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-2 text-sm">
                    <option value="free_only">Free only</option>
                    <option value="free_preferred">Free preferred</option>
                    <option value="mixed">Mixed</option>
                    <option value="paid_ok">Paid OK</option>
                  </select>
                </div>
              </div>
              {genError && <p className="mt-3 text-sm text-red-600">{genError}</p>}
              <button type="button" disabled={generating || goal.trim().length < 3} onClick={() => void generateRoadmap()} className="mt-6 w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-40">
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
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold">S</div>
                  <h2 className="mt-4 text-xl font-semibold">AI Mentor</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {activeMs ? `Ready to help with: ${activeMs.title}` : "Ask anything about your learning path, or generate a roadmap first."}
                  </p>
                  {nextAction && (
                    <p className="mt-3 text-xs text-muted-foreground max-w-sm mx-auto">
                      Suggested: <span className="text-foreground font-medium">{nextAction.title}</span> — {nextAction.detail}
                    </p>
                  )}
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {["Explain the current milestone simply", "Give me a 30-minute free practice plan", "What should I learn next?"].map((s) => (
                      <button key={s} type="button" onClick={() => void sendMentor(s)} className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted">{s}</button>
                    ))}
                  </div>
                  {!activeUJ && (
                    <button type="button" onClick={() => setTab("roadmap")} className="mt-6 text-sm text-accent font-medium">Create a roadmap first →</button>
                  )}
                </div>
              ) : (
                <div className="mx-auto max-w-2xl space-y-4">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[min(100%,36rem)] rounded-2xl px-4 py-3 text-[15px] ${m.role === "user" ? "bg-primary text-primary-foreground whitespace-pre-wrap" : "bg-card border border-border shadow-sm"}`}>
                        {m.role === "assistant" ? <MarkdownMessage content={m.content} /> : m.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && <p className="text-sm text-muted-foreground animate-pulse">Mentor is thinking…</p>}
                  {chatError && <p className="text-sm text-red-600">{chatError}</p>}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); void sendMentor(input); }} className="shrink-0 border-t border-border p-3 sm:p-4">
              <div className="mx-auto max-w-2xl flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask your mentor…" disabled={chatLoading} className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
                <button type="submit" disabled={chatLoading || !input.trim()} className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium disabled:opacity-40">Send</button>
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
                    <p className="text-2xl font-semibold text-accent">{Math.round(Number(enrollment?.progress_percent ?? 0))}%</p>
                    <p className="text-xs text-muted-foreground">complete</p>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${Math.min(100, Number(enrollment?.progress_percent ?? 0))}%` }} />
                </div>

                <div className="mt-6 rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Hours per week</p>
                      <p className="text-xs text-muted-foreground mt-0.5">We estimate milestone deadlines from your pace.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" min={1} max={80} value={hoursPerWeek} onChange={(e) => setHoursPerWeek(Math.max(1, Math.min(80, Number(e.target.value) || 1)))} className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-sm" />
                      <button type="button" disabled={scheduleLoading} onClick={() => void saveSchedule()} className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium disabled:opacity-40">
                        {scheduleLoading ? "Saving…" : "Update plan"}
                      </button>
                    </div>
                  </div>
                  {scheduleMsg && <p className="mt-2 text-xs text-muted-foreground">{scheduleMsg}</p>}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" disabled={diagLoading} onClick={() => void startDiagnostic()} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-40">
                    {diagLoading && !diagQuestions.length ? "Generating quiz…" : "Prerequisite diagnostic"}
                  </button>
                  {isOwner && (
                    <button type="button" disabled={publishLoading} onClick={() => void togglePublish()} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-40">
                      {publishLoading ? "Updating…" : isPublished ? "Unpublish from Georny" : "Publish to Georny"}
                    </button>
                  )}
                  {isPublished && <span className="rounded-full bg-accent/10 text-accent px-2 py-1 text-[11px] font-medium self-center">Public</span>}
                </div>
                {publishMsg && <p className="mt-2 text-xs text-muted-foreground">{publishMsg}</p>}

                {diagOpen && (
                  <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/5 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">Prerequisite check</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Answer the quiz, then skip early milestones you already know.</p>
                      </div>
                      <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setDiagOpen(false)}>Close</button>
                    </div>
                    {diagError && <p className="mt-2 text-sm text-red-600">{diagError}</p>}
                    {diagLoading && !diagQuestions.length && <p className="mt-3 text-sm text-muted-foreground animate-pulse">Generating diagnostic…</p>}
                    <ul className="mt-3 space-y-3">
                      {diagQuestions.map((q, idx) => (
                        <li key={q.id} className="rounded-xl border border-border bg-background p-3 text-sm">
                          <p className="text-xs text-muted-foreground">Q{idx + 1}</p>
                          <p className="mt-1 font-medium whitespace-pre-wrap">{q.prompt}</p>
                          {q.options?.length ? (
                            <ul className="mt-2 space-y-1 text-muted-foreground">{q.options.map((o) => <li key={o}>• {o}</li>)}</ul>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                    {diagEarly.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Skip milestones you already know</p>
                        <div className="mt-2 space-y-1.5">
                          {diagEarly.map((m) => (
                            <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                              <input type="checkbox" checked={diagSkipIds.includes(m.id)} onChange={(e) => {
                                setDiagSkipIds((ids) => e.target.checked ? [...ids, m.id] : ids.filter((x) => x !== m.id));
                              }} />
                              <span>{m.title}</span>
                            </label>
                          ))}
                        </div>
                        <button type="button" disabled={diagLoading || !diagSkipIds.length} onClick={() => void applyDiagnosticSkip()} className="mt-3 rounded-lg bg-accent text-accent-foreground px-3 py-1.5 text-xs font-medium disabled:opacity-40">
                          {diagLoading ? "Applying…" : `Skip ${diagSkipIds.length || ""} selected`}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <ol className="mt-8 space-y-4">
                  {milestones.map((m, idx) => {
                    const st = m.progress?.status || "not_started";
                    const selected = m.id === activeMilestoneId;
                    const sched = scheduleById.get(m.id);
                    return (
                      <li key={m.id}>
                        <button type="button" onClick={() => setActiveMilestoneId(m.id)} className={`w-full text-left rounded-2xl border p-4 transition-colors ${selected ? "border-accent bg-accent/5" : "border-border bg-card hover:border-accent/40"}`}>
                          <div className="flex items-start gap-3">
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${st === "completed" || st === "skipped" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                              {st === "completed" ? "✓" : st === "skipped" ? "→" : idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium">{m.title}</p>
                              {m.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{m.description}</p>}
                              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                                {m.estimated_hours != null && <span>~{m.estimated_hours}h</span>}
                                {sched?.suggestedDeadline && <span>Due {sched.suggestedDeadline}</span>}
                                {sched?.estimatedWeeksFromStart != null && <span>Week {Math.max(1, Math.ceil(sched.estimatedWeeksFromStart))}</span>}
                                <span className="capitalize">{st.replace("_", " ")}</span>
                                {m.node_type === "checkpoint" && <span className="text-accent">Remedial</span>}
                              </div>
                              {st !== "completed" && st !== "skipped" && (
                                <div className="mt-3">
                                  <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); void markComplete(m.id); }} onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); void markComplete(m.id); } }} className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted">Mark complete</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Resources by milestone</h2>
                  <p className="text-sm text-muted-foreground mt-1">Discovered via search. Always verify free/paid on the source site.</p>
                </div>
                <div className="flex gap-1 rounded-lg border border-border p-0.5 text-xs">
                  {(["all", "docs", "video"] as const).map((f) => (
                    <button key={f} type="button" onClick={() => setResourceFilter(f)} className={`rounded-md px-2.5 py-1 capitalize ${resourceFilter === f ? "bg-muted font-medium" : "text-muted-foreground"}`}>{f}</button>
                  ))}
                </div>
              </div>
              {filteredResources.map((m) => (
                <section key={m.id} className="mt-6">
                  <h3 className="font-medium text-sm text-muted-foreground">{m.title}</h3>
                  {!m.resources?.length ? (
                    <p className="mt-2 text-sm text-muted-foreground">No resources found for this milestone yet.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {m.resources.map((r) => (
                        <li key={r.id} className="rounded-xl border border-border bg-card px-3 py-2.5">
                          <a href={r.url || "#"} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">{r.title}</a>
                          <p className="mt-0.5 text-xs text-muted-foreground">{[r.provider, r.pricing_type, r.resource_type].filter(Boolean).join(" · ")}</p>
                          {r.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.description}</p>}
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
                difficulty={(activeMs.metadata?.difficulty as string) || enrollment?.journeys?.difficulty || "beginner"}
                milestoneId={activeMs.id}
                userJourneyId={activeUJ}
                onAdapted={() => { void loadDetail(activeUJ); void loadActivity(); }}
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
              <p className="mt-4 text-4xl font-bold text-accent">{Math.round(Number(enrollment?.progress_percent ?? 0))}%</p>
              <p className="text-sm text-muted-foreground">
                {milestones.filter((m) => m.progress?.status === "completed" || m.progress?.status === "skipped").length} of {milestones.length} milestones completed
              </p>
              {activity && (
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-border bg-card p-3 text-center">
                    <p className="text-2xl font-semibold">{activity.currentStreak}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Day streak</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3 text-center">
                    <p className="text-2xl font-semibold">{activity.totalXp}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Total XP</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3 text-center">
                    <p className="text-2xl font-semibold">{activity.badges.length}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Badges</p>
                  </div>
                </div>
              )}
              {activity?.badges && activity.badges.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold">Badges</h3>
                  <ul className="mt-2 space-y-2">
                    {activity.badges.map((b) => (
                      <li key={b.id} className="rounded-xl border border-border bg-card px-3 py-2 text-sm flex justify-between gap-2">
                        <span className="font-medium">{b.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{b.awarded_at ? new Date(b.awarded_at).toLocaleDateString() : b.badge_key}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {nextAction && (
                <div className="mt-6 rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm">
                  <p className="font-medium">Next action</p>
                  <p className="mt-1 text-muted-foreground">{nextAction.title} — {nextAction.detail}</p>
                </div>
              )}
              <ul className="mt-6 space-y-2">
                {milestones.map((m) => (
                  <li key={m.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm">
                    <span className="truncate pr-3">{m.title}</span>
                    <span className="capitalize text-muted-foreground shrink-0">{(m.progress?.status || "not_started").replace("_", " ")}</span>
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
                  <a href={r.url || "#"} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline line-clamp-2">{r.title}</a>
                </li>
              ))}
              {!activeMs.resources?.length && <li className="text-xs text-muted-foreground">None linked yet</li>}
            </ul>
            {activity && (
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Activity</p>
                <p className="mt-1 text-sm">🔥 {activity.currentStreak} day streak · ⚡ {activity.totalXp} XP</p>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
