import { describe, expect, it } from "vitest";
import {
  normalizeProgressUpdates,
  restoreRoadmapFromProgress,
  type ProgressPayload,
} from "./roadmap-progress";

const payload: ProgressPayload = {
  journey_id: "journey-1",
  journey: {
    id: "journey-1",
    title: "Learn robotics",
    description: "A practical path",
    target_outcome: "Build a robot",
    difficulty: "beginner",
    estimated_hours: 12,
    category: "robotics",
  },
  milestones: [
    {
      id: "m-2",
      title: "Wire sensors",
      description: "Connect the sensor",
      position: 1,
      estimated_hours: 3,
      node_type: "project",
      metadata: { stage: "Build", practice: "Test readings", topics: ["I2C"] },
    },
    {
      id: "m-1",
      title: "Learn circuits",
      description: "Understand voltage",
      position: 0,
      estimated_hours: 2,
      node_type: "milestone",
      metadata: { stage: "Foundations", resources_hint: ["Arduino docs"] },
    },
  ],
  completed: { "m-1": true },
};

describe("restoreRoadmapFromProgress", () => {
  it("rebuilds ordered stages and maps server IDs to UI keys", () => {
    const restored = restoreRoadmapFromProgress(payload);
    expect(restored?.roadmap.stages.map((stage) => stage.name)).toEqual(["Foundations", "Build"]);
    expect(restored?.roadmap.stages[0].milestones[0].title).toBe("Learn circuits");
    expect(restored?.milestoneIdsByKey).toEqual({ "0-0": "m-1", "1-0": "m-2" });
    expect(restored?.completedByKey).toEqual({ "0-0": true });
  });

  it("preserves optional practice metadata and safe defaults", () => {
    const restored = restoreRoadmapFromProgress(payload);
    expect(restored?.roadmap.stages[1].milestones[0].practice).toBe("Test readings");
    expect(restored?.roadmap.stages[1].milestones[0].topics).toEqual(["I2C"]);
    expect(restored?.roadmap.stages[0].milestones[0].resources_hint).toEqual(["Arduino docs"]);
  });

  it("uses a fallback stage name when metadata is absent", () => {
    const restored = restoreRoadmapFromProgress({
      ...payload,
      milestones: [{ id: "m-3", title: "Start", position: 0 }],
      completed: {},
    });
    expect(restored?.roadmap.stages[0].name).toBe("Learning path");
  });

  it("returns null for journeys without milestones", () => {
    expect(restoreRoadmapFromProgress({ ...payload, milestones: [] })).toBeNull();
  });
});

describe("normalizeProgressUpdates", () => {
  const milestones = [{ id: "m-1", position: 0 }, { id: "m-2", position: 1 }];

  it("accepts a single milestone ID update", () => {
    expect(normalizeProgressUpdates({ milestone_id: "m-1", completed: true }, milestones)).toEqual({
      updates: [{ milestone_id: "m-1", completed: true }],
    });
  });

  it("supports position-based updates for existing clients", () => {
    expect(normalizeProgressUpdates({ position: 1, completed: false }, milestones)).toEqual({
      updates: [{ milestone_id: "m-2", completed: false }],
    });
  });

  it("normalizes a valid batch", () => {
    expect(normalizeProgressUpdates({
      updates: [
        { milestone_id: "m-1", completed: true },
        { position: 1, completed: false },
      ],
    }, milestones)).toEqual({
      updates: [
        { milestone_id: "m-1", completed: true },
        { milestone_id: "m-2", completed: false },
      ],
    });
  });

  it("rejects unknown milestone IDs", () => {
    expect(normalizeProgressUpdates({ milestone_id: "other", completed: true }, milestones)).toHaveProperty("error");
  });

  it("rejects non-boolean completion values", () => {
    expect(normalizeProgressUpdates({ milestone_id: "m-1", completed: "true" }, milestones)).toHaveProperty("error");
  });

  it("rejects duplicate milestone updates in a batch", () => {
    expect(normalizeProgressUpdates({
      updates: [
        { milestone_id: "m-1", completed: true },
        { milestone_id: "m-1", completed: false },
      ],
    }, milestones)).toHaveProperty("error");
  });

  it("rejects an empty batch", () => {
    expect(normalizeProgressUpdates({ updates: [] }, milestones)).toHaveProperty("error");
  });
});
