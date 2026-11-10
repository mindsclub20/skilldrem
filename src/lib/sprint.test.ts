import { describe, expect, it } from "vitest";
import { buildSprintGoal, type SprintSettings } from "./sprint";

describe("buildSprintGoal", () => {
  const settings: SprintSettings = {
    goal: "Learn Python",
    level: "beginner",
    minutesPerDay: 40,
    days: 7,
  };

  it("includes the goal, level, duration, and daily time commitment", () => {
    const prompt = buildSprintGoal(settings);
    expect(prompt).toContain("Learn Python");
    expect(prompt).toContain("beginner");
    expect(prompt).toContain("7-day");
    expect(prompt).toContain("40 minutes per day");
  });

  it("trims the goal before building the prompt", () => {
    expect(buildSprintGoal({ ...settings, goal: "  Robotics  " })).toContain("Robotics");
  });

  it("rejects goals that are too short or too long", () => {
    expect(() => buildSprintGoal({ ...settings, goal: " " })).toThrow("Enter a learning goal");
    expect(() => buildSprintGoal({ ...settings, goal: "x".repeat(201) })).toThrow("200 characters");
  });

  it("supports a 14-day sprint", () => {
    expect(buildSprintGoal({ ...settings, days: 14 })).toContain("14-day");
  });
});
