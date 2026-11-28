import { describe, expect, it } from "vitest";
import { normalizeRoadmapForSave } from "./roadmap-save";

describe("normalizeRoadmapForSave", () => {
  it("flattens stages into ordered milestones and keeps stage metadata", () => {
    const result = normalizeRoadmapForSave({
      title: "  Robotics roadmap ",
      difficulty: "intermediate",
      stages: [
        { name: "Basics", milestones: [{ title: "Python", topics: ["syntax"] }] },
        { name: "Build", milestones: [{ title: "Robot", node_type: "project" }] },
      ],
    });

    expect(result?.journey.title).toBe("Robotics roadmap");
    expect(result?.milestones).toHaveLength(2);
    expect(result?.milestones[0]).toMatchObject({
      position: 0,
      node_type: "milestone",
      metadata: { stage: "Basics", topics: ["syntax"] },
    });
    expect(result?.milestones[1]).toMatchObject({
      position: 1,
      node_type: "project",
      metadata: { stage: "Build" },
    });
  });

  it("rejects a missing title or stages", () => {
    expect(normalizeRoadmapForSave({ title: "", stages: [] })).toBeNull();
    expect(normalizeRoadmapForSave({ title: "Valid", stages: [] })).toBeNull();
  });

  it("rejects empty milestone sets", () => {
    expect(normalizeRoadmapForSave({
      title: "Valid",
      stages: [{ name: "Empty", milestones: [{ title: " " }] }],
    })).toBeNull();
  });

  it("rejects oversized milestone collections", () => {
    expect(normalizeRoadmapForSave({
      title: "Valid",
      stages: [{ name: "Stage", milestones: Array.from({ length: 101 }, (_, i) => ({ title: `M${i}` })) }],
    })).toBeNull();
  });

  it("sanitizes unsupported difficulty and invalid estimated hours", () => {
    const result = normalizeRoadmapForSave({
      title: "Valid",
      difficulty: "untrusted",
      estimated_hours: -4,
      stages: [{ name: "Stage", milestones: [{ title: "M", estimated_hours: -1 }] }],
    });

    expect(result?.journey.difficulty).toBe("beginner");
    expect(result?.journey.estimated_hours).toBeNull();
    expect(result?.milestones[0].estimated_hours).toBeNull();
  });
});
