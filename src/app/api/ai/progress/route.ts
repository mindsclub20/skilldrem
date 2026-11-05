import { NextResponse } from "next/server";
import { recommendNextAction, type LearningContext } from "@/lib/ai/orchestrator";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Mark a milestone complete / in progress and recompute user_journey progress. */
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
      milestoneId?: string;
      userJourneyId?: string;
      status?: "not_started" | "in_progress" | "completed" | "skipped";
      notes?: string;
    };

    const milestoneId = body.milestoneId?.trim();
    const userJourneyId = body.userJourneyId?.trim();
    const status = body.status || "completed";

    if (!milestoneId || !userJourneyId) {
      return NextResponse.json(
        { error: "milestoneId and userJourneyId required" },
        { status: 400 }
      );
    }

    const { data: uj } = await supabase
      .from("user_journeys")
      .select("id, journey_id")
      .eq("id", userJourneyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!uj) {
      return NextResponse.json({ error: "Journey enrollment not found" }, { status: 404 });
    }

    const completedAt = status === "completed" ? new Date().toISOString() : null;

    const { error: upErr } = await supabase.from("learner_progress").upsert(
      {
        user_id: user.id,
        milestone_id: milestoneId,
        user_journey_id: userJourneyId,
        status,
        completed_at: completedAt,
        notes: body.notes?.slice(0, 2000) ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,milestone_id" }
    );

    if (upErr) {
      const { data: existing } = await supabase
        .from("learner_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("milestone_id", milestoneId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("learner_progress")
          .update({
            status,
            completed_at: completedAt,
            notes: body.notes?.slice(0, 2000) ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("learner_progress").insert({
          user_id: user.id,
          milestone_id: milestoneId,
          user_journey_id: userJourneyId,
          status,
          completed_at: completedAt,
          notes: body.notes?.slice(0, 2000) ?? null,
        });
      }
    }

    // Streak / XP for completing or progressing
    if (status === "completed" || status === "in_progress") {
      await supabase.from("learning_activity").upsert(
        {
          user_id: user.id,
          activity_date: new Date().toISOString().slice(0, 10),
          activity_type: status === "completed" ? "milestone_complete" : "study",
          xp: status === "completed" ? 25 : 10,
          metadata: { milestoneId, userJourneyId },
        },
        { onConflict: "user_id,activity_date,activity_type" }
      );
    }

    const { data: allMs } = await supabase
      .from("milestones")
      .select("id")
      .eq("journey_id", uj.journey_id);

    const { data: progress } = await supabase
      .from("learner_progress")
      .select("status")
      .eq("user_id", user.id)
      .eq("user_journey_id", userJourneyId);

    const total = allMs?.length || 1;
    const done =
      progress?.filter((p) => p.status === "completed" || p.status === "skipped")
        .length || 0;
    const percent = Math.round((done / total) * 100);

    await supabase
      .from("user_journeys")
      .update({
        progress_percent: percent,
        last_accessed_at: new Date().toISOString(),
        status: percent >= 100 ? "completed" : "active",
        completed_at: percent >= 100 ? new Date().toISOString() : null,
      })
      .eq("id", userJourneyId)
      .eq("user_id", user.id);

    let badge = null;
    if (percent >= 100) {
      const { data: journey } = await supabase
        .from("journeys")
        .select("id, title")
        .eq("id", uj.journey_id)
        .maybeSingle();

      const { data: awarded } = await supabase
        .from("skill_badges")
        .upsert(
          {
            user_id: user.id,
            badge_key: "path_complete",
            title: `Completed: ${journey?.title || "Learning path"}`,
            description: "Finished every milestone on this roadmap.",
            journey_id: uj.journey_id,
          },
          { onConflict: "user_id,badge_key,journey_id" }
        )
        .select("id, title, badge_key, awarded_at")
        .maybeSingle();
      badge = awarded;
    }

    return NextResponse.json({
      ok: true,
      progress_percent: percent,
      badge,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Progress update failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** Get progress + milestones + resources + nextAction for a user_journey. */
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
        status,
        progress_percent,
        journey_id,
        hours_per_week,
        journeys (
          id,
          title,
          description,
          difficulty,
          estimated_hours,
          target_outcome,
          category,
          is_published,
          created_by
        )
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
      .select("id, title, description, position, estimated_hours, node_type, metadata")
      .eq("journey_id", uj.journey_id)
      .order("position", { ascending: true });

    const { data: progress } = await supabase
      .from("learner_progress")
      .select("milestone_id, status, completed_at, notes")
      .eq("user_id", user.id)
      .eq("user_journey_id", userJourneyId);

    const progressMap = new Map((progress ?? []).map((p) => [p.milestone_id, p]));

    const msIds = (milestones ?? []).map((m) => m.id);
    const resourcesByMs: Record<string, unknown[]> = {};

    if (msIds.length) {
      const { data: links } = await supabase
        .from("milestone_resources")
        .select(
          `
          milestone_id,
          is_primary,
          position,
          resources (
            id,
            title,
            description,
            url,
            provider,
            pricing_type,
            resource_type,
            difficulty,
            is_verified
          )
        `
        )
        .in("milestone_id", msIds)
        .order("position", { ascending: true });

      for (const link of links ?? []) {
        const mid = link.milestone_id as string;
        if (!resourcesByMs[mid]) resourcesByMs[mid] = [];
        if (link.resources) resourcesByMs[mid].push(link.resources);
      }
    }

    const enriched = (milestones ?? []).map((m) => ({
      ...m,
      progress: progressMap.get(m.id) ?? {
        status: "not_started",
        completed_at: null,
        notes: null,
      },
      resources: resourcesByMs[m.id] || [],
    }));

    const open =
      enriched.find(
        (m) => m.progress.status !== "completed" && m.progress.status !== "skipped"
      ) ?? null;
    const nextAfter = open
      ? enriched.find(
          (m) =>
            m.position > open.position &&
            m.progress.status !== "completed" &&
            m.progress.status !== "skipped"
        )
      : null;

    const { data: practice } = await supabase
      .from("practice_sessions")
      .select("topic, score, max_score, completed_at")
      .eq("user_id", user.id)
      .eq("user_journey_id", userJourneyId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(3);

    const recent = practice?.[0];
    const weakTopics: string[] = [];
    for (const p of practice ?? []) {
      if (p.max_score && Number(p.score) / Number(p.max_score) < 0.6) {
        weakTopics.push(String(p.topic));
      }
    }

    const journey = uj.journeys as {
      title?: string;
      target_outcome?: string;
    } | null;

    const resourceHints =
      (open?.resources as { title?: string; url?: string; pricing_type?: string }[] | undefined)?.map(
        (r) => ({
          title: r.title || "Resource",
          url: r.url,
          pricing_type: r.pricing_type,
        })
      ) ?? [];

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
      nextMilestone: nextAfter ? { id: nextAfter.id, title: nextAfter.title } : null,
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
      enrollment: uj,
      milestones: enriched,
      nextAction: recommendNextAction(ctx),
      learningContext: ctx,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load progress";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
