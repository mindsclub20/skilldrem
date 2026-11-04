import { NextResponse } from "next/server";
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

    // Ownership check
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

    // Fallback if unique constraint name differs — try update then insert
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

    // Recompute progress
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

    return NextResponse.json({ ok: true, progress_percent: percent });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Progress update failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** Get progress + milestones + resources for a user_journey. */
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
        journeys (
          id,
          title,
          description,
          difficulty,
          estimated_hours,
          target_outcome,
          category
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

    const progressMap = new Map(
      (progress ?? []).map((p) => [p.milestone_id, p])
    );

    const msIds = (milestones ?? []).map((m) => m.id);
    let resourcesByMs: Record<string, unknown[]> = {};

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

    return NextResponse.json({
      enrollment: uj,
      milestones: (milestones ?? []).map((m) => ({
        ...m,
        progress: progressMap.get(m.id) ?? {
          status: "not_started",
          completed_at: null,
          notes: null,
        },
        resources: resourcesByMs[m.id] || [],
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load progress";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
