/**
 * Lightweight orchestrator for the unified learning workspace.
 * Coordinates roadmap, practice signals, and mentor context without extra agent hops.
 */

export type LearningContext = {
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
  nextMilestone?: {
    id: string;
    title: string;
  } | null;
  weakTopics?: string[];
  recentPracticeScore?: { score: number; maxScore: number; topic: string } | null;
  resourceHints?: { title: string; url?: string | null; pricing_type?: string | null }[];
};

export type NextAction = {
  type: "practice" | "study_resource" | "complete_milestone" | "start_milestone" | "remediate" | "celebrate";
  title: string;
  detail: string;
  milestoneId?: string;
};

export function recommendNextAction(ctx: LearningContext): NextAction {
  const pct = Number(ctx.progressPercent ?? 0);
  if (pct >= 100) {
    return {
      type: "celebrate",
      title: "Path complete",
      detail: "Review your notes or start a new goal in the workspace.",
    };
  }

  const recent = ctx.recentPracticeScore;
  if (recent && recent.maxScore > 0 && recent.score / recent.maxScore < 0.5) {
    return {
      type: "remediate",
      title: "Strengthen weak areas",
      detail: `Practice score on "${recent.topic}" was ${recent.score}/${recent.maxScore}. Revisit the current milestone with the mentor, then retry practice.`,
      milestoneId: ctx.currentMilestone?.id,
    };
  }

  if (ctx.weakTopics && ctx.weakTopics.length > 0) {
    return {
      type: "practice",
      title: "Practice weak topics",
      detail: `Focus on: ${ctx.weakTopics.slice(0, 3).join(", ")}.`,
      milestoneId: ctx.currentMilestone?.id,
    };
  }

  const freeResource = ctx.resourceHints?.find(
    (r) =>
      r.pricing_type === "completely_free" ||
      r.pricing_type === "free_audit" ||
      r.pricing_type === "unknown"
  );
  if (ctx.currentMilestone && freeResource?.url) {
    return {
      type: "study_resource",
      title: `Study: ${freeResource.title}`,
      detail: "Open a free/unknown-pricing resource for the current milestone, then mark complete when ready.",
      milestoneId: ctx.currentMilestone.id,
    };
  }

  if (ctx.currentMilestone) {
    return {
      type: "complete_milestone",
      title: `Finish: ${ctx.currentMilestone.title}`,
      detail: ctx.currentMilestone.description || "Work through this milestone, practice, then mark it complete.",
      milestoneId: ctx.currentMilestone.id,
    };
  }

  if (ctx.nextMilestone) {
    return {
      type: "start_milestone",
      title: `Start: ${ctx.nextMilestone.title}`,
      detail: "Begin the next open milestone in your roadmap.",
      milestoneId: ctx.nextMilestone.id,
    };
  }

  return {
    type: "start_milestone",
    title: "Create or open a roadmap",
    detail: "Generate a learning path from the Roadmap tab to get personalized next steps.",
  };
}

export function buildMentorSystemAddon(ctx: LearningContext): string {
  const lines: string[] = [
    "You are teaching inside the learner's active SKILLDREM workspace.",
    "Prefer short progressive explanations, then one example, then one check question.",
    "Do not invent URLs. Prefer resources already linked in context.",
  ];
  if (ctx.journeyTitle) lines.push(`Roadmap: ${ctx.journeyTitle}`);
  if (ctx.targetOutcome) lines.push(`Target outcome: ${ctx.targetOutcome}`);
  if (ctx.currentMilestone) {
    lines.push(
      `Current milestone: ${ctx.currentMilestone.title}${ctx.currentMilestone.description ? ` — ${ctx.currentMilestone.description}` : ""}`
    );
  }
  if (ctx.nextMilestone) lines.push(`Next milestone: ${ctx.nextMilestone.title}`);
  if (ctx.progressPercent != null) lines.push(`Progress: ${ctx.progressPercent}%`);
  if (ctx.weakTopics?.length) lines.push(`Weak topics from practice: ${ctx.weakTopics.join(", ")}`);
  if (ctx.recentPracticeScore) {
    lines.push(
      `Recent practice: ${ctx.recentPracticeScore.score}/${ctx.recentPracticeScore.maxScore} on ${ctx.recentPracticeScore.topic}`
    );
  }
  if (ctx.resourceHints?.length) {
    lines.push(
      "Linked resources (cite only these URLs if linking):\n" +
        ctx.resourceHints
          .slice(0, 5)
          .map(
            (r) =>
              `- ${r.title}${r.url ? ` — ${r.url}` : ""}${r.pricing_type ? ` [${r.pricing_type}]` : ""}`
          )
          .join("\n")
    );
  }
  const next = recommendNextAction(ctx);
  lines.push(`Suggested next action: ${next.title} — ${next.detail}`);
  return lines.join("\n");
}

/** Suggest a remedial milestone title/description from weak practice. */
export function buildRemedialMilestoneDraft(topic: string, weakTopics: string[]): {
  title: string;
  description: string;
  estimated_hours: number;
  node_type: "checkpoint";
  difficulty: "beginner";
  prerequisites: string[];
} {
  const focus = weakTopics.slice(0, 3).join(", ") || topic;
  return {
    title: `Review: ${topic}`.slice(0, 200),
    description: `Remedial checkpoint based on practice results. Revisit fundamentals and focus on: ${focus}. Use the AI mentor and free resources before advancing.`,
    estimated_hours: 2,
    node_type: "checkpoint",
    difficulty: "beginner",
    prerequisites: [topic],
  };
}
