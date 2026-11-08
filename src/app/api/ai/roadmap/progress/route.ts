import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** GET /api/ai/roadmap/progress?journey_id= */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const journeyId = new URL(request.url).searchParams.get("journey_id")?.trim();
    if (!journeyId) return NextResponse.json({ error: "journey_id required" }, { status: 400 });

    const { data: enrollment } = await supabase
      .from("user_journeys")
      .select("id, progress_percent, status")
      .eq("user_id", user.id)
      .eq("journey_id", journeyId)
      .maybeSingle();

    if (!enrollment) {
      const { data: owned } = await supabase
        .from("journeys")
        .select("id")
        .eq("id", journeyId)
        .eq("created_by", user.id)
        .maybeSingle();
      if (!owned) return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }

    const { data: milestones, error: mErr } = await supabase
      .from("milestones")
      .select("id, title, position, metadata")
      .eq("journey_id", journeyId)
      .order("position", { ascending: true });
    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

    const { data: progressRows, error: pErr } = await supabase
      .from("user_milestone_progress")
      .select("milestone_id, completed, completed_at")
      .eq("user_id", user.id)
      .eq("journey_id", journeyId);

    if (pErr) {
      if (pErr.message?.includes("does not exist") || pErr.code === "42P01") {
        return NextResponse.json({
          error: "Progress table not available. Apply user_milestone_progress migration.",
          code: "MIGRATION_REQUIRED",
          journey_id: journeyId,
          milestones: milestones ?? [],
          completed: {},
          progress_percent: enrollment?.progress_percent ?? 0,
        }, { status: 503 });
      }
      return NextResponse.json({ error: pErr.message }, { status: 500 });
    }

    const completedByMilestoneId: Record<string, boolean> = {};
    for (const row of progressRows ?? []) {
      if (row.completed) completedByMilestoneId[row.milestone_id] = true;
    }

    const list = milestones ?? [];
    const done = Object.keys(completedByMilestoneId).length;
    const total = list.length;
    const progress_percent = enrollment?.progress_percent ?? (total ? Math.round((done / total) * 100) : 0);

    return NextResponse.json({
      ok: true,
      journey_id: journeyId,
      milestones: list,
      completed: completedByMilestoneId,
      progress_percent,
      done_count: done,
      total_count: total,
    });
  } catch (err) {
    console.error("[progress GET]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to load progress" }, { status: 500 });
  }
}

type ProgressBody = {
  journey_id?: string;
  milestone_id?: string;
  position?: number;
  completed?: boolean;
  updates?: { milestone_id?: string; position?: number; completed: boolean }[];
};

/** POST /api/ai/roadmap/progress — upsert completions */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const body = (await request.json()) as ProgressBody;
    const journeyId = body.journey_id?.trim();
    if (!journeyId) return NextResponse.json({ error: "journey_id required" }, { status: 400 });

    const { data: enrollment } = await supabase
      .from("user_journeys")
      .select("id")
      .eq("user_id", user.id)
      .eq("journey_id", journeyId)
      .maybeSingle();

    if (!enrollment) {
      const { data: owned } = await supabase
        .from("journeys")
        .select("id")
        .eq("id", journeyId)
        .eq("created_by", user.id)
        .maybeSingle();
      if (!owned) return NextResponse.json({ error: "Journey not found" }, { status: 404 });
      await supabase.from("user_journeys").upsert(
        { user_id: user.id, journey_id: journeyId, status: "active", progress_percent: 0 },
        { onConflict: "user_id,journey_id" }
      );
    }

    const { data: milestones, error: mErr } = await supabase
      .from("milestones")
      .select("id, position")
      .eq("journey_id", journeyId)
      .order("position", { ascending: true });
    if (mErr || !milestones?.length) {
      return NextResponse.json({ error: mErr?.message || "No milestones for journey" }, { status: 400 });
    }

    const byPosition = new Map(milestones.map((m) => [m.position, m.id]));
    const validIds = new Set(milestones.map((m) => m.id));
    const updates: { milestone_id: string; completed: boolean }[] = [];

    if (Array.isArray(body.updates) && body.updates.length > 0) {
      for (const u of body.updates) {
        let mid = u.milestone_id;
        if (!mid && typeof u.position === "number") mid = byPosition.get(u.position);
        if (!mid || !validIds.has(mid)) continue;
        updates.push({ milestone_id: mid, completed: Boolean(u.completed) });
      }
    } else {
      let mid = body.milestone_id;
      if (!mid && typeof body.position === "number") mid = byPosition.get(body.position);
      if (!mid || !validIds.has(mid)) {
        return NextResponse.json({ error: "Valid milestone_id or position required" }, { status: 400 });
      }
      updates.push({ milestone_id: mid, completed: Boolean(body.completed) });
    }

    if (updates.length === 0) return NextResponse.json({ error: "No valid updates" }, { status: 400 });

    const now = new Date().toISOString();
    const rows = updates.map((u) => ({
      user_id: user.id,
      journey_id: journeyId,
      milestone_id: u.milestone_id,
      completed: u.completed,
      completed_at: u.completed ? now : null,
      updated_at: now,
    }));

    const { error: upErr } = await supabase.from("user_milestone_progress").upsert(rows, {
      onConflict: "user_id,milestone_id",
    });

    if (upErr) {
      if (upErr.message?.includes("does not exist") || upErr.code === "42P01") {
        return NextResponse.json({
          error: "Progress table not available. Apply user_milestone_progress migration.",
          code: "MIGRATION_REQUIRED",
        }, { status: 503 });
      }
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    const { count: doneCount } = await supabase
      .from("user_milestone_progress")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("journey_id", journeyId)
      .eq("completed", true);

    const total = milestones.length;
    const progress_percent = total
      ? Math.min(100, Math.max(0, Math.round(((doneCount ?? 0) / total) * 100)))
      : 0;

    await supabase
      .from("user_journeys")
      .update({ progress_percent, updated_at: now })
      .eq("user_id", user.id)
      .eq("journey_id", journeyId);

    return NextResponse.json({
      ok: true,
      journey_id: journeyId,
      updated: updates.length,
      progress_percent,
      done_count: doneCount ?? 0,
      total_count: total,
    });
  } catch (err) {
    console.error("[progress POST]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to save progress" }, { status: 500 });
  }
}
