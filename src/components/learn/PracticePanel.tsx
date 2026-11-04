"use client";

import { useEffect, useState } from "react";

type PracticeQ = {
  id: string;
  type: string;
  prompt: string;
  options?: string[];
  difficulty?: string;
};

type PracticeResult = {
  id: string;
  correct: boolean;
  correctAnswer: string;
  explanation: string;
  yourAnswer: string;
};

type Props = {
  topic: string;
  description?: string | null;
  difficulty?: string | null;
  milestoneId?: string | null;
  userJourneyId?: string | null;
};

export function PracticePanel({
  topic,
  description,
  difficulty,
  milestoneId,
  userJourneyId,
}: Props) {
  const [practiceQs, setPracticeQs] = useState<PracticeQ[]>([]);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string>>({});
  const [practiceSessionId, setPracticeSessionId] = useState<string | null>(null);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceError, setPracticeError] = useState<string | null>(null);
  const [practiceResults, setPracticeResults] = useState<PracticeResult[] | null>(null);
  const [practiceScore, setPracticeScore] = useState<{ score: number; maxScore: number } | null>(
    null
  );
  const [practiceHistory, setPracticeHistory] = useState<
    {
      id: string;
      topic: string;
      score: number | null;
      max_score: number | null;
      completed_at: string | null;
    }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const qs = milestoneId
          ? `?milestoneId=${encodeURIComponent(milestoneId)}`
          : "";
        const res = await fetch(`/api/ai/practice${qs}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setPracticeHistory(data.sessions ?? []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [milestoneId]);

  async function startPractice() {
    if (!topic || practiceLoading) return;
    setPracticeLoading(true);
    setPracticeError(null);
    setPracticeResults(null);
    setPracticeScore(null);
    setPracticeAnswers({});
    try {
      const res = await fetch("/api/ai/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          description,
          difficulty: difficulty || "beginner",
          milestoneId: milestoneId || undefined,
          userJourneyId: userJourneyId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate practice");
      setPracticeSessionId(data.sessionId);
      setPracticeQs(data.questions ?? []);
      // refresh history
      const h = await fetch(
        milestoneId
          ? `/api/ai/practice?milestoneId=${encodeURIComponent(milestoneId)}`
          : "/api/ai/practice"
      );
      if (h.ok) {
        const hd = await h.json();
        setPracticeHistory(hd.sessions ?? []);
      }
    } catch (e) {
      setPracticeError(e instanceof Error ? e.message : "Failed");
    } finally {
      setPracticeLoading(false);
    }
  }

  async function submitPractice() {
    if (!practiceSessionId || practiceLoading) return;
    setPracticeLoading(true);
    setPracticeError(null);
    try {
      const res = await fetch("/api/ai/practice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: practiceSessionId,
          answers: practiceAnswers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");
      setPracticeResults(data.results ?? []);
      setPracticeScore({ score: data.score, maxScore: data.maxScore });
    } catch (e) {
      setPracticeError(e instanceof Error ? e.message : "Failed");
    } finally {
      setPracticeLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-lg font-semibold">Practice</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        AI-generated exercises for{" "}
        <span className="font-medium text-foreground">{topic}</span>. Answers are scored
        against model solutions.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={practiceLoading}
          onClick={() => void startPractice()}
          className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          {practiceLoading && !practiceQs.length
            ? "Generating…"
            : practiceQs.length
              ? "New set"
              : "Generate practice set"}
        </button>
        {practiceQs.length > 0 && !practiceResults && (
          <button
            type="button"
            disabled={practiceLoading}
            onClick={() => void submitPractice()}
            className="rounded-xl bg-accent text-accent-foreground px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            {practiceLoading ? "Scoring…" : "Submit answers"}
          </button>
        )}
      </div>
      {practiceError && <p className="mt-3 text-sm text-red-600">{practiceError}</p>}
      {practiceScore && (
        <p className="mt-4 text-sm font-medium">
          Score: {practiceScore.score} / {practiceScore.maxScore}
        </p>
      )}
      <ul className="mt-6 space-y-4">
        {practiceQs.map((q, idx) => {
          const result = practiceResults?.find((r) => r.id === q.id);
          return (
            <li key={q.id} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {idx + 1}. {q.type.replace("_", " ")}
                {q.difficulty ? ` · ${q.difficulty}` : ""}
              </p>
              <p className="mt-1 font-medium text-sm whitespace-pre-wrap">{q.prompt}</p>
              {q.type === "multiple_choice" && q.options ? (
                <div className="mt-3 space-y-1.5">
                  {q.options.map((opt) => (
                    <label key={opt} className="flex items-start gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        disabled={Boolean(practiceResults)}
                        checked={practiceAnswers[q.id] === opt}
                        onChange={() =>
                          setPracticeAnswers((a) => ({
                            ...a,
                            [q.id]: opt,
                          }))
                        }
                        className="mt-1"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  value={practiceAnswers[q.id] || ""}
                  disabled={Boolean(practiceResults)}
                  onChange={(e) =>
                    setPracticeAnswers((a) => ({
                      ...a,
                      [q.id]: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Your answer…"
                  className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
                />
              )}
              {result && (
                <div
                  className={`mt-3 rounded-xl px-3 py-2 text-sm ${
                    result.correct
                      ? "bg-accent/10 text-foreground"
                      : "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200"
                  }`}
                >
                  <p className="font-medium">{result.correct ? "Correct" : "Not quite"}</p>
                  {!result.correct && (
                    <p className="mt-1">Expected: {result.correctAnswer}</p>
                  )}
                  {result.explanation && (
                    <p className="mt-1 text-muted-foreground">{result.explanation}</p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {practiceHistory.length > 0 && (
        <div className="mt-10">
          <h3 className="text-sm font-semibold">Recent sessions</h3>
          <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
            {practiceHistory.map((s) => (
              <li key={s.id} className="flex justify-between gap-3 px-3 py-2 text-sm">
                <span className="truncate">{s.topic}</span>
                <span className="text-muted-foreground shrink-0">
                  {s.score != null ? `${s.score}/${s.max_score ?? "?"}` : "open"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
