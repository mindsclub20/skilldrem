export type SprintLevel = "beginner" | "some_experience" | "confident";
export type SprintDays = 7 | 14;
export type SprintMinutes = 20 | 40 | 60 | 90;

export type SprintSettings = {
  goal: string;
  level: SprintLevel;
  minutesPerDay: SprintMinutes;
  days: SprintDays;
};

export function buildSprintGoal(settings: SprintSettings): string {
  const goal = settings.goal.trim();
  if (goal.length < 2) {
    throw new Error("Enter a learning goal with at least 2 characters.");
  }
  if (goal.length > 200) {
    throw new Error("Keep your learning goal under 200 characters.");
  }

  const levelLabel =
    settings.level === "some_experience"
      ? "some experience"
      : settings.level === "confident"
        ? "confident / intermediate"
        : "complete beginner";

  return [
    `Create a practical ${settings.days}-day learning sprint for: ${goal}.`,
    `Learner level: ${levelLabel}.`,
    `Available study time: ${settings.minutesPerDay} minutes per day.`,
    "Make the plan realistic for this time limit. Break it into one clearly named daily mission for every day in the sprint.",
    "For each day include: a measurable outcome, a short learning activity, and one tiny hands-on practice task.",
    "Use free resources first and cite only URLs that appear in the live search results. Never invent course titles or links.",
    "Start with prerequisites only when needed. Build difficulty gradually and finish with a small project or demonstration.",
    "Keep explanations concise, make day 1 immediately actionable, and include a checkpoint to review progress.",
  ].join("\n");
}
