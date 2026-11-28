export type IncomingRoadmapMilestone = {
  title?: unknown;
  description?: unknown;
  estimated_hours?: unknown;
  node_type?: unknown;
  practice?: unknown;
  topics?: unknown;
  resources_hint?: unknown;
};

export type IncomingRoadmapStage = {
  name?: unknown;
  milestones?: unknown;
};

export type IncomingRoadmap = {
  title?: unknown;
  description?: unknown;
  target_outcome?: unknown;
  difficulty?: unknown;
  estimated_hours?: unknown;
  category?: unknown;
  stages?: unknown;
};

type NormalizedJourney = {
  title: string;
  description: string | null;
  target_outcome: string | null;
  difficulty: string;
  estimated_hours: number | null;
  category: string;
};

type NormalizedMilestone = {
  title: string;
  description: string | null;
  position: number;
  estimated_hours: number | null;
  node_type: string;
  metadata: Record<string, unknown>;
};

function boundedText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function boundedHours(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100_000
    ? value
    : null;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, 300))
    .filter(Boolean)
    .slice(0, 20);
}

export function normalizeRoadmapForSave(input: IncomingRoadmap | null | undefined): {
  journey: NormalizedJourney;
  milestones: NormalizedMilestone[];
} | null {
  const title = boundedText(input?.title, 200);
  if (!title || !Array.isArray(input?.stages) || input.stages.length === 0 || input.stages.length > 20) {
    return null;
  }

  const difficulty = ["beginner", "intermediate", "advanced", "expert"].includes(
    typeof input.difficulty === "string" ? input.difficulty : ""
  ) ? input.difficulty as string : "beginner";

  const journey: NormalizedJourney = {
    title,
    description: boundedText(input.description, 2000),
    target_outcome: boundedText(input.target_outcome, 500),
    difficulty,
    estimated_hours: boundedHours(input.estimated_hours),
    category: boundedText(input.category, 100) ?? "personalized",
  };

  const milestones: NormalizedMilestone[] = [];
  for (const rawStage of input.stages as IncomingRoadmapStage[]) {
    const stageName = boundedText(rawStage?.name, 200) ?? "Learning stage";
    if (!Array.isArray(rawStage?.milestones)) continue;

    for (const rawMilestone of rawStage.milestones as IncomingRoadmapMilestone[]) {
      const milestoneTitle = boundedText(rawMilestone?.title, 200);
      if (!milestoneTitle) continue;
      if (milestones.length >= 100) return null;

      const nodeType = ["start", "milestone", "project", "checkpoint", "end"].includes(
        typeof rawMilestone.node_type === "string" ? rawMilestone.node_type : ""
      ) ? rawMilestone.node_type as string : "milestone";

      milestones.push({
        title: milestoneTitle,
        description: boundedText(rawMilestone.description, 2000),
        position: milestones.length,
        estimated_hours: boundedHours(rawMilestone.estimated_hours),
        node_type: nodeType,
        metadata: {
          stage: stageName,
          practice: boundedText(rawMilestone.practice, 1000),
          topics: stringArray(rawMilestone.topics),
          resources_hint: stringArray(rawMilestone.resources_hint),
        },
      });
    }
  }

  if (milestones.length === 0) return null;
  return { journey, milestones };
}
