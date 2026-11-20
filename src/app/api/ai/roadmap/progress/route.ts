import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeProgressUpdates, type ProgressUpdateInput } from "@/lib/roadmap-progress";

export const runtime = "nodejs";

type JourneySummary = {
  id: string;
  title: string;
  description: string | null;
  target_outcome: string | null;
  difficulty: string | null;
  estimated_hours: number | null;
  category: string | null;
};

const journeyColumns = "id, title, description, target_outcome, difficulty, estimated_hours, category, created_by";

/** GET /api/ai/roadmap/progress?journey_id= */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const journeyId = new URL(request.url).searchParams.get("journey_id")?.trim();
    if (!journeyId) return NextResponse.json({ error: "journey_id required" }, { status: 400 });

    const { data: journey, error: journeyErr } = await supabase
      .from("journeys")
      .select(journeyColumns)
      .eq("id", journeyId)
      .maybeSingle();
    if (journeyErr) return NextResponse.json({ error: journeyErr.message }, { status: 500 });
    if (!journey) return NextResponse.json({ error: "Journey not found" }, { status: 404 });

    const { data: enrollment, error: enrollmentErr } = await supabase
      .from("user_journeys")
      .select("id, progress_percent, status")
      .eq("user_id", user.id)
      .eq("journey_id", journeyId)
      .maybeSingle();
    if (enrollmentErr) return NextResponse.json({ error: enrollmentErr.message }, { status: 500 });
    if (!enrollment && journey.created_by !== user.id) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }

    const { data: milestones, error: milestoneErr } = await supabase
      .from("milestones")
      .select("id, title, description, position, estimated_hours, node_type, metadata")
      .eq("journey_id", journeyId)
      .order("position", { ascending: true });
    if (milestoneErr) return NextResponse.json({ error: milestoneErr.message }, { status: 500 });

    const { data: progressRows, error: progressErr } = await supabase
      .from("user_milestone_progress")
      .select("milestone_id, completed, completed_at")
      .eq("user_id", user.id)
      .eq("journey_id", journeyId);

    const journeySummary: JourneySummary = {
      id: journey.id,
      title: journey.title,
      description: journey.description,
      target_outcome: journey.target_outcome,
      difficulty: journey.difficulty,
      estimated_hours: journey.estimated_hours,
      category: journey.category,
    };

    if (progressErr) {
      if (progressErr.message?.includes("does not exist") || progressErr.code === "42P01") {
        return NextResponse.json({
          error: "Progress table not available. The current project schema needs review before progress can be synced.",
          code: "MIGRATION_REQUIRED",
          journey_id: journeyId,
          journey: journeySummary,
          milestones: milestones ?? [],
          completed: {},
          progress_percent: enrollment?.progress_percent ?? 0,
        }, { status: 503 });
      }
      return NextResponse.json({ error: progressErr.message }, { status: 500 });
    }

    const completed: Record<string, boolean> = {};
    for (const row of progressRows ?? []) {
      if (row.completed) completed[row.milestone_id] = true;
    }

    const total = milestones?.length ?? 0;
    const done = Object.keys(completed).length;
    const progress_percent = total ? Math.round((done / total) * 100) : 0;

    return NextResponse.json({
      ok: true,
      journey_id: journeyId,
      journey: journeySummary,
      milestones: milestones ?? [],
      completed,
      progress_percent,
      done_count: done,
      total_count: total,
    });
  } catch (err) {
    console.error("[progress GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load progress" },
      { status: 500 }
    );
  }
}

/** POST /api/ai/roadmap/progress — upsert one or more milestone completions */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    let body: ProgressUpdateInput & { journey_id?: string };
    try {
      const parsed: unknown = await request.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }
      body = parsed as ProgressUpdateInput & { journey_id?: string };
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (typeof body.journey_id !== "string" || !body.journey_id.trim()) {
      return NextResponse.json({ error: "journey_id required" }, { status: 400 });
    }
    const journeyId = body.journey_id.trim();

    const { data: enrollment, error: enrollmentErr } = await supabase
      .from("user_journeys")
      .select("id")
      .eq("user_id", user.id)
      .eq("journey_id", journeyId)
      .maybeSingle();
    if (enrollmentErr) return NextResponse.json({ error: enrollmentErr.message }, { status: 500 });

    if (!enrollment) {
      const { data: owned, error: ownedErr } = await supabase
        .from("journeys")
        .select("id, created_by")
        .eq("id", journeyId)
        .maybeSingle();
      if (ownedErr) return NextResponse.json({ error: ownedErr.message }, { status: 500 });
      if (!owned || owned.created_by !== user.id) {
        return NextResponse.json({ error: "Journey not found" }, { status: 404 });
      }

      const { error: enrollmentUpsertErr } = await supabase.from("user_journeys").upsert(
        { user_id: user.id, journey_id: journeyId, status: "active", progress_percent: 0 },
        { onConflict: "user_id,journey_id" }
      );
      if (enrollmentUpsertErr) {
        return NextResponse.json({ error: enrollmentUpsertErr.message }, { status: 500 });
      }
    }

    const { data: milestones, error: milestoneErr } = await supabase
      .from("milestones")
      .select("id, position")
      .eq("journey_id", journeyId)
      .order("position", { ascending: true });
    if (milestoneErr) return NextResponse.json({ error: milestoneErr.message }, { status: 500 });
    if (!milestones?.length) {
      return NextResponse.json({ error: "No milestones for journey" }, { status: 400 });
    }

    const normalized = normalizeProgressUpdates(body, milestones);
    if ("error" in normalized) {
      return NextResponse.json({ error: normalized.error }, { status: 400 });
    }

    const now = new Date().toISOString();
    const rows = normalized.updates.map((update) => ({
      user_id: user.id,
      journey_id: journeyId,
      milestone_id: update.milestone_id,
      completed: update.completed,
      completed_at: update.completed ? now : null,
      updated_at: now,
    }));

    const { error: upsertErr } = await supabase.from("user_milestone_progress").upsert(rows, {
      onConflict: "user_id,milestone_id",
    });
    if (upsertErr) {
      if (upsertErr.message?.includes("does not exist") || upsertErr.code === "42P01") {
        return NextResponse.json({
          error: "Progress table not available. The current project schema needs review before progress can be synced.",
          code: "MIGRATION_REQUIRED",
        }, { status: 503 });
      }
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    const { data: completedRows, error: countErr } = await supabase
      .from("user_milestone_progress")
      .select("milestone_id")
      .eq("user_id", user.id)
      .eq("journey_id", journeyId)
      .eq("completed", true);

    const total = milestones.length;
    const done = countErr ? null : completedRows?.length ?? 0;
    const progress_percent = done === null || total === 0
      ? null
      : Math.min(100, Math.max(0, Math.round((done / total) * 100)));
    let warning: string | undefined;

    if (countErr) {
      warning = "Milestone saved, but the progress summary could not be recalculated.";
    } else if (progress_percent !== null) {
      const { error: summaryErr } = await supabase
        .from("user_journeys")
        .update({ progress_percent, updated_at: now })
        .eq("user_id", user.id)
        .eq("journey_id", journeyId);
      if (summaryErr) {
        warning = "Milestone saved, but the dashboard progress summary could not be refreshed.";
      }
    }

    return NextResponse.json({
      ok: true,
      journey_id: journeyId,
      updated: normalized.updates.length,
      progress_percent,
      done_count: done,
      total_count: total,
      ...(warning ? { warning } : {}),
    });
  } catch (err) {
    console.error("[progress POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save progress" },
      { status: 500 }
    );
  }
}
