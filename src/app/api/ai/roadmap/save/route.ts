import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type IncomingMilestone = {
  title: string;
  description?: string;
  estimated_hours?: number;
  node_type?: string;
  practice?: string;
  topics?: string[];
  resources_hint?: string[];
};

type IncomingStage = {
  name: string;
  milestones: IncomingMilestone[];
};

type IncomingRoadmap = {
  title: string;
  description?: string;
  target_outcome?: string;
  difficulty?: string;
  estimated_hours?: number;
  category?: string;
  stages: IncomingStage[];
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = (await request.json()) as { roadmap?: IncomingRoadmap };
    const roadmap = body.roadmap;
    if (!roadmap?.title || !Array.isArray(roadmap.stages) || roadmap.stages.length === 0) {
      return NextResponse.json({ error: "Invalid roadmap payload" }, { status: 400 });
    }

    const { data: journey, error: jErr } = await supabase
      .from("journeys")
      .insert({
        title: roadmap.title.slice(0, 200),
        description: roadmap.description?.slice(0, 2000) ?? null,
        target_outcome: roadmap.target_outcome?.slice(0, 500) ?? null,
        difficulty: ["beginner", "intermediate", "advanced", "expert"].includes(
          roadmap.difficulty || ""
        )
          ? roadmap.difficulty
          : "beginner",
        estimated_hours: roadmap.estimated_hours ?? null,
        category: roadmap.category?.slice(0, 100) ?? "personalized",
        is_published: false,
        is_featured: false,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (jErr || !journey) {
      console.error("[roadmap/save] journey", jErr);
      return NextResponse.json(
        { error: jErr?.message || "Failed to create journey" },
        { status: 500 }
      );
    }

    const flat: {
      journey_id: string;
      title: string;
      description: string | null;
      position: number;
      estimated_hours: number | null;
      node_type: string;
      metadata: Record<string, unknown>;
    }[] = [];

    let pos = 0;
    for (const stage of roadmap.stages) {
      for (const m of stage.milestones || []) {
        if (!m.title) continue;
        flat.push({
          journey_id: journey.id,
          title: m.title.slice(0, 200),
          description: m.description?.slice(0, 2000) ?? null,
          position: pos++,
          estimated_hours: m.estimated_hours ?? null,
          node_type: ["start", "milestone", "project", "checkpoint", "end"].includes(
            m.node_type || ""
          )
            ? (m.node_type as string)
            : "milestone",
          metadata: {
            stage: stage.name,
            practice: m.practice ?? null,
            topics: m.topics ?? [],
            resources_hint: m.resources_hint ?? [],
          },
        });
      }
    }

    if (flat.length === 0) {
      await supabase.from("journeys").delete().eq("id", journey.id);
      return NextResponse.json({ error: "No valid milestones" }, { status: 400 });
    }

    const { error: mErr } = await supabase.from("milestones").insert(flat);
    if (mErr) {
      console.error("[roadmap/save] milestones", mErr);
      await supabase.from("journeys").delete().eq("id", journey.id);
      return NextResponse.json({ error: mErr.message }, { status: 500 });
    }

    const { error: ujErr } = await supabase.from("user_journeys").insert({
      user_id: user.id,
      journey_id: journey.id,
      status: "active",
      progress_percent: 0,
    });

    if (ujErr) {
      console.error("[roadmap/save] user_journeys", ujErr);
      const { error: rollbackErr } = await supabase
        .from("journeys")
        .delete()
        .eq("id", journey.id);

      if (rollbackErr) {
        console.error("[roadmap/save] cleanup after enrollment failure", rollbackErr);
      }

      return NextResponse.json(
        { error: "Failed to enroll saved roadmap. Please retry." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      journey_id: journey.id,
      milestone_count: flat.length,
    });
  } catch (err) {
    console.error("[roadmap/save]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Save failed" },
      { status: 500 }
    );
  }
}
