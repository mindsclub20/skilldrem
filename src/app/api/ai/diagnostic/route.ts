import { NextResponse } from "next/server";
import { generatePracticeSet } from "@/lib/ai/agents";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Prerequisite diagnostic: generate a short quiz from early milestones,
 * then optionally skip milestones the learner already knows.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = (await request.json()) as {
      userJourneyId?: string;
      action?: "generate" | "apply";
      answers?: Record<string, string>;
      sessionId?: string;
      skipMilestoneIds?: string[];
    };

    const userJourneyId = body.userJourneyId?.trim();
    if (!userJourneyId) {
      return NextResponse.json({ error: "userJourneyId required" }, { status: 400 });
    }

    const { data: uj } = await supabase
      .from("user_journeys")
      .select("id, journey_id")
      .eq("id", userJourneyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!uj) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: milestones } = await supabase
      .from("milestones")
      .select("id, title, description, position")
      .eq("journey_id", uj.journey_id)
      .order("position", { ascending: true });

    const early = (milestones ?? []).slice(0, 3);
    if (!early.length) {
      return NextResponse.json({ error: "No milestones" }, { status: 400 });
    }

    // APPLY: skip selected early milestones
    if (body.action === "apply") {
      const allowed = new Set(early.map((m) => m.id));
      const toSkip = (body.skipMilestoneIds ?? []).filter((id) => allowed.has(id));
      for (const mid of toSkip) {
        await supabase.from("learner_progress").upsert(
          {
            user_id: user.id,
            milestone_id: mid,
            user_journey_id: userJourneyId,
            status: "skipped",
            completed_at: new Date().toISOString(),
            notes: "Skipped via prerequisite diagnostic",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,milestone_id" }
        );
      }

      const { data: allMs } = await supabase
        .from("milestones")
        .select("id")
        .eq("journey_id", uj.journey_id);
      const { data: prog } = await supabase
        .from("learner_progress")
        .select("status")
        .eq("user_id", user.id)
        .eq("user_journey_id", userJourneyId);
      const total = allMs?.length || 1;
      const done =
        prog?.filter((p) => p.status === "completed" || p.status === "skipped")
          .length || 0;
      const percent = Math.round((done / total) * 100);
      await supabase
        .from("user_journeys")
        .update({ progress_percent: percent })
        .eq("id", userJourneyId);

      return NextResponse.json({ ok: true, skipped: toSkip, progress_percent: percent });
    }

    // GENERATE diagnostic quiz covering early milestones
    const topic = early.map((m) => m.title).join("; ");
    const questions = await generatePracticeSet({
      topic: `Prerequisite check: ${topic}`,
      description:
        "Diagnostic quiz to detect prior knowledge of early roadmap milestones. Prefer multiple_choice.",
      difficulty: "beginner",
    });

    const { data: session, error } = await supabase
      .from("practice_sessions")
      .insert({
        user_id: user.id,
        user_journey_id: userJourneyId,
        milestone_id: early[0].id,
        topic: `Diagnostic: ${topic}`.slice(0, 300),
        difficulty: "beginner",
        questions,
        answers: {},
        max_score: questions.length,
      })
      .select("id")
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: error?.message || "Failed to save diagnostic" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      milestones: early,
      questions: questions.map((q) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        difficulty: q.difficulty,
      })),
      hint: "Score well, then choose which early milestones to skip.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Diagnostic failed";
    const status = msg.includes("No AI API keys") ? 503 : 502;
    return NextResponse.json({ error: msg }, { status });
  }
}
