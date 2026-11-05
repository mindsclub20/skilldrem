import { NextResponse } from "next/server";
import { recommendNextAction, type LearningContext } from "@/lib/ai/orchestrator";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Recommend the next learning action from live progress + practice. */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const url = new URL(request.url);
    const userJourneyId = url.searchParams.get("userJourneyId");
    if (!userJourneyId) {
      return NextResponse.json({ error: "userJourneyId required" }, { status: 400 });
    }

    const { data: uj } = await supabase
      .from("user_journeys")
      .select(
        `
        id,
        progress_percent,
        journey_id,
        journeys ( title, target_outcome )
      `
      )
      .eq("id", userJourneyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!uj) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: milestones } = await supabase
      .from("milestones")
      .select("id, title, description, position, metadata")
      .eq("journey_id", uj.journey_id)
      .order("position", { ascending: true });

    const { data: progress } = await supabase
      .from("learner_progress")
      .select("milestone_id, status")
      .eq("user_id", user.id)
      .eq("user_journey_id", userJourneyId);

    const statusByMs = new Map((progress ?? []).map((p) => [p.milestone_id, p.status]));

    const open =
      (milestones ?? []).find((m) => statusByMs.get(m.id) !== "completed" && statusByMs.get(m.id) !== "skipped") ??
      null;
    const nextAfterOpen = open
      ? (milestones ?? []).find(
          (m) =>
            m.position > open.position &&
            statusByMs.get(m.id) !== "completed" &&
            statusByMs.get(m.id) !== "skipped"
        )
      : null;

    const { data: practice } = await supabase
      .from("practice_sessions")
      .select("topic, score, max_score, completed_at, milestone_id")
      .eq("user_id", user.id)
      .eq("user_journey_id", userJourneyId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(5);

    const recent = practice?.[0];
    const weakTopics: string[] = [];
    for (const p of practice ?? []) {
      if (p.max_score && Number(p.score) / Number(p.max_score) < 0.6) {
        weakTopics.push(String(p.topic));
      }
    }

    let resourceHints: LearningContext["resourceHints"] = [];
    if (open) {
      const { data: links } = await supabase
        .from("milestone_resources")
        .select("resources ( title, url, pricing_type )")
        .eq("milestone_id", open.id)
        .limit(5);
      resourceHints = (links ?? [])
        .map((l) => l.resources as { title?: string; url?: string; pricing_type?: string } | null)
        .filter(Boolean)
        .map((r) => ({
          title: r!.title || "Resource",
          url: r!.url,
          pricing_type: r!.pricing_type,
        }));
    }

    const journey = uj.journeys as { title?: string; target_outcome?: string } | null;
    const ctx: LearningContext = {
      userJourneyId: uj.id,
      journeyTitle: journey?.title,
      targetOutcome: journey?.target_outcome,
      progressPercent: Number(uj.progress_percent ?? 0),
      currentMilestone: open
        ? {
            id: open.id,
            title: open.title,
            description: open.description,
            difficulty: (open.metadata as { difficulty?: string } | null)?.difficulty,
          }
        : null,
      nextMilestone: nextAfterOpen
        ? { id: nextAfterOpen.id, title: nextAfterOpen.title }
        : null,
      weakTopics: [...new Set(weakTopics)].slice(0, 5),
      recentPracticeScore: recent
        ? {
            score: Number(recent.score ?? 0),
            maxScore: Number(recent.max_score ?? 0),
            topic: String(recent.topic),
          }
        : null,
      resourceHints,
    };

    return NextResponse.json({
      nextAction: recommendNextAction(ctx),
      context: ctx,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Recommend failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
