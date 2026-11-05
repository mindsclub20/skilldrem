/** Pure helpers for roadmap time estimation (no LLM). */

export type ScheduleMilestone = {
  id: string;
  title: string;
  estimated_hours: number | null;
  position: number;
};

export type ScheduledMilestone = ScheduleMilestone & {
  cumulativeHours: number;
  estimatedWeeksFromStart: number;
  suggestedDeadline: string; // ISO date
};

export function buildSchedule(
  milestones: ScheduleMilestone[],
  hoursPerWeek: number,
  startDate: Date = new Date()
): {
  hoursPerWeek: number;
  totalHours: number;
  totalWeeks: number;
  completionDate: string;
  milestones: ScheduledMilestone[];
} {
  const hpw = Math.max(1, Math.min(80, Number(hoursPerWeek) || 5));
  let cumulative = 0;
  const start = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));

  const scheduled: ScheduledMilestone[] = [...milestones]
    .sort((a, b) => a.position - b.position)
    .map((m) => {
      const hours = m.estimated_hours != null && m.estimated_hours > 0 ? Number(m.estimated_hours) : 4;
      cumulative += hours;
      const weeks = cumulative / hpw;
      const days = Math.ceil(weeks * 7);
      const deadline = new Date(start);
      deadline.setUTCDate(deadline.getUTCDate() + days);
      return {
        ...m,
        estimated_hours: hours,
        cumulativeHours: cumulative,
        estimatedWeeksFromStart: Math.round(weeks * 10) / 10,
        suggestedDeadline: deadline.toISOString().slice(0, 10),
      };
    });

  const totalHours = cumulative;
  const totalWeeks = Math.round((totalHours / hpw) * 10) / 10;
  const completion = scheduled[scheduled.length - 1]?.suggestedDeadline
    ?? start.toISOString().slice(0, 10);

  return {
    hoursPerWeek: hpw,
    totalHours,
    totalWeeks,
    completionDate: completion,
    milestones: scheduled,
  };
}

export function computeStreak(activityDates: string[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (!activityDates.length) return { currentStreak: 0, longestStreak: 0 };
  const days = [...new Set(activityDates)].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1] + "T00:00:00Z").getTime();
    const cur = new Date(days[i] + "T00:00:00Z").getTime();
    const diff = (cur - prev) / 86400000;
    if (diff === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else if (diff > 1) {
      run = 1;
    }
  }

  // Current streak from today or yesterday
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const y = new Date(today);
  y.setUTCDate(y.getUTCDate() - 1);
  const yStr = y.toISOString().slice(0, 10);
  const set = new Set(days);
  if (!set.has(todayStr) && !set.has(yStr)) {
    return { currentStreak: 0, longestStreak: longest };
  }
  let current = 0;
  let cursor = set.has(todayStr) ? todayStr : yStr;
  while (set.has(cursor)) {
    current += 1;
    const d = new Date(cursor + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - 1);
    cursor = d.toISOString().slice(0, 10);
  }
  return { currentStreak: current, longestStreak: Math.max(longest, current) };
}
