import { NextResponse } from "next/server";
import { buildRemedialMilestoneDraft } from "@/lib/ai/orchestrator";
import { resourceScout } from "@/lib/ai/agents";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Adaptive roadmap: after weak practice, insert a remedial checkpoint
 * after the current milestone and optionally attach free resources.
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
      milestoneId?: string;
      weakTopics?: string[];
      practiceSessionId?: string;
    };

    const userJourneyId = body.userJourneyId?.trim();
    const milestoneId = body.milestoneId?.trim();
    if (!userJourneyId || !milestoneId) {
      return NextResponse.json(
        { error: "userJourneyId and milestoneId required" },
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
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    const { data: current } = await supabase
      .from("milestones")
      .select("id, title, position, journey_id")
      .eq("id", milestoneId)
      .eq("journey_id", uj.journey_id)
      .maybeSingle();

    if (!current) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    // Avoid duplicate remedial for same topic in last 3 positions
    const { data: nearby } = await supabase
      .from("milestones")
      .select("id, title, metadata")
      .eq("journey_id", uj.journey_id)
      .gte("position", current.position)
      .lte("position", current.position + 2);

    const already = (nearby ?? []).some((m) =>
      String(m.title).toLowerCase().startsWith("review:") &&
      String(m.title).toLowerCase().includes(current.title.toLowerCase().slice(0, 24))
    );
    if (already) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        message: "Remedial checkpoint already present near this milestone",
      });
    }

    const weak = Array.isArray(body.weakTopics)
      ? body.weakTopics.map(String).slice(0, 5)
      : [];
    const draft = buildRemedialMilestoneDraft(current.title, weak);

    // Shift later milestones down
    const { data: later } = await supabase
      .from("milestones")
      .select("id, position")
      .eq("journey_id", uj.journey_id)
      .gt("position", current.position);

    for (const m of later ?? []) {
      await supabase
        .from("milestones")
        .update({ position: Number(m.position) + 1 })
        .eq("id", m.id);
    }

    const { data: inserted, error: insErr } = await supabase
      .from("milestones")
      .insert({
        journey_id: uj.journey_id,
        title: draft.title,
        description: draft.description,
        position: current.position + 1,
        estimated_hours: draft.estimated_hours,
        node_type: draft.node_type,
        metadata: {
          difficulty: draft.difficulty,
          prerequisites: draft.prerequisites,
          adaptive: true,
          source_milestone_id: current.id,
          weak_topics: weak,
          practice_session_id: body.practiceSessionId || null,
        },
      })
      .select("id, title, description, position, node_type, metadata")
      .single();

    if (insErr || !inserted) {
      return NextResponse.json(
        { error: insErr?.message || "Failed to insert remedial milestone" },
        { status: 500 }
      );
    }

    await supabase.from("learner_progress").insert({
      user_id: user.id,
      milestone_id: inserted.id,
      user_journey_id: userJourneyId,
      status: "not_started",
    });

    // Optional resource scout for remedial topic
    const { resources } = await resourceScout(inserted.title, current.title);
    const attached = [];
    for (let i = 0; i < Math.min(resources.length, 3); i++) {
      const r = resources[i];
      const { data: resRow } = await supabase
        .from("resources")
        .insert({
          title: r.title,
          description: r.description,
          url: r.url,
          canonical_url: r.url,
          resource_type: r.resource_type,
          provider: r.provider,
          pricing_type: r.pricing_type,
          is_verified: false,
          is_published: false,
          metadata: { note: r.note, adaptive: true },
        })
        .select("id, title, url, pricing_type")
        .single();
      if (resRow) {
        await supabase.from("milestone_resources").insert({
          milestone_id: inserted.id,
          resource_id: resRow.id,
          is_primary: i === 0,
          position: i,
        });
        attached.push(resRow);
      }
    }

    // Recompute progress percent denominator change
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
      prog?.filter((p) => p.status === "completed" || p.status === "skipped").length || 0;
    const percent = Math.round((done / total) * 100);
    await supabase
      .from("user_journeys")
      .update({ progress_percent: percent, last_accessed_at: new Date().toISOString() })
      .eq("id", userJourneyId);

    return NextResponse.json({
      ok: true,
      milestone: inserted,
      resources: attached,
      progress_percent: percent,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Adapt failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
