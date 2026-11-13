export type Milestone = {
  id?: string;
  title: string;
  description: string;
  estimated_hours: number;
  node_type: string;
  practice?: string;
  topics?: string[];
  resources_hint?: string[];
  completed?: boolean;
};

export type Stage = {
  name: string;
  milestones: Milestone[];
};

export type Roadmap = {
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

export type ProgressPayload = {
  journey_id: string;
  journey: {
    id: string;
    title: string;
    description?: string | null;
    target_outcome?: string | null;
    difficulty?: string | null;
    estimated_hours?: number | null;
    category?: string | null;
  };
  milestones: Array<{
    id: string;
    title: string;
    description?: string | null;
    position: number;
    estimated_hours?: number | null;
    node_type?: string | null;
    metadata?: Record<string, unknown> | null;
  }>;
  completed?: Record<string, boolean>;
};

export type ProgressUpdateInput = {
  journey_id?: string;
  milestone_id?: unknown;
  position?: unknown;
  completed?: unknown;
  updates?: unknown;
};

export type NormalizedProgressUpdate = {
  milestone_id: string;
  completed: boolean;
};

export type NormalizeProgressResult =
  | { updates: NormalizedProgressUpdate[]; error?: never }
  | { error: string; updates?: never };

export type RestoredRoadmap = {
  roadmap: Roadmap;
  completedByKey: Record<string, boolean>;
  milestoneIdsByKey: Record<string, string>;
};

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === "string");
}

export function restoreRoadmapFromProgress(payload: ProgressPayload): RestoredRoadmap | null {
  if (!payload?.journey?.title || !Array.isArray(payload.milestones) || payload.milestones.length === 0) {
    return null;
  }

  const stages: Stage[] = [];
  const stageIndexes = new Map<string, number>();
  const completedByKey: Record<string, boolean> = {};
  const milestoneIdsByKey: Record<string, string> = {};

  const orderedMilestones = [...payload.milestones].sort((a, b) => a.position - b.position);
  for (const item of orderedMilestones) {
    const metadata = item.metadata ?? {};
    const stageName =
      typeof metadata.stage === "string" && metadata.stage.trim()
        ? metadata.stage.trim()
        : "Learning path";

    let stageIndex = stageIndexes.get(stageName);
    if (stageIndex === undefined) {
      stageIndex = stages.length;
      stageIndexes.set(stageName, stageIndex);
      stages.push({ name: stageName, milestones: [] });
    }

    const milestoneIndex = stages[stageIndex].milestones.length;
    const key = `${stageIndex}-${milestoneIndex}`;
    stages[stageIndex].milestones.push({
      id: item.id,
      title: item.title,
      description: item.description ?? "",
      estimated_hours: item.estimated_hours ?? 0,
      node_type: item.node_type ?? "milestone",
      practice: typeof metadata.practice === "string" ? metadata.practice : undefined,
      topics: stringArray(metadata.topics),
      resources_hint: stringArray(metadata.resources_hint),
    });
    milestoneIdsByKey[key] = item.id;
    if (payload.completed?.[item.id]) completedByKey[key] = true;
  }

  return {
    roadmap: {
      title: payload.journey.title,
      description: payload.journey.description ?? "",
      target_outcome: payload.journey.target_outcome ?? "",
      difficulty: payload.journey.difficulty ?? "beginner",
      estimated_hours: payload.journey.estimated_hours ?? 0,
      category: payload.journey.category ?? "personalized",
      stages,
    },
    completedByKey,
    milestoneIdsByKey,
  };
}

export function normalizeProgressUpdates(
  body: ProgressUpdateInput,
  milestones: Array<{ id: string; position: number }>
): NormalizeProgressResult {
  const candidates = Array.isArray(body.updates) ? body.updates : [body];
  if (Array.isArray(body.updates) && body.updates.length === 0) {
    return { error: "At least one progress update is required." };
  }

  const validIds = new Set(milestones.map((milestone) => milestone.id));
  const byPosition = new Map(milestones.map((milestone) => [milestone.position, milestone.id]));
  const seen = new Set<string>();
  const updates: NormalizedProgressUpdate[] = [];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") {
      return { error: "Each progress update must be an object." };
    }

    const update = candidate as Record<string, unknown>;
    if (typeof update.completed !== "boolean") {
      return { error: "completed must be a boolean." };
    }

    let milestoneId = typeof update.milestone_id === "string" ? update.milestone_id.trim() : "";
    if (!milestoneId && typeof update.position === "number" && Number.isInteger(update.position)) {
      milestoneId = byPosition.get(update.position) ?? "";
    }
    if (!milestoneId || !validIds.has(milestoneId)) {
      return { error: "Each update must reference a valid milestone ID or position." };
    }
    if (seen.has(milestoneId)) {
      return { error: "A milestone can only appear once in a progress update batch." };
    }

    seen.add(milestoneId);
    updates.push({ milestone_id: milestoneId, completed: update.completed });
  }

  return updates.length ? { updates } : { error: "No valid progress updates were provided." };
}
