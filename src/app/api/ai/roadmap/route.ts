import { NextResponse } from "next/server";
import { knowledgeAnalystAndRoadmap, resourceScout } from "@/lib/ai/agents";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Generate a personalized roadmap, discover free resources per milestone,
 * and persist journey + milestones + resources + user_journey.
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
      goal?: string;
      experienceLevel?: string;
      budget?: string;
      hoursPerWeek?: number;
      preferred?: "groq" | "gemini";
    };

    const goal = body.goal?.trim();
    if (!goal || goal.length < 3 || goal.length > 2000) {
      return NextResponse.json(
        { error: "Provide a learning goal (3–2000 characters)" },
        { status: 400 }
      );
    }

    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("experience_level, budget_preference, available_hours_per_week")
      .eq("user_id", user.id)
      .maybeSingle();

    const experienceLevel =
      body.experienceLevel || prefs?.experience_level || "beginner";
    const budget = body.budget || prefs?.budget_preference || "free_preferred";
    const hoursPerWeek =
      body.hoursPerWeek ??
      (prefs?.available_hours_per_week != null
        ? Number(prefs.available_hours_per_week)
        : null);

    const draft = await knowledgeAnalystAndRoadmap({
      goal,
      experienceLevel,
      budget,
      hoursPerWeek,
      preferred: body.preferred,
    });

    const slugBase = draft.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    const slug = `${slugBase}-${Date.now().toString(36)}`;

    const { data: journey, error: jErr } = await supabase
      .from("journeys")
      .insert({
        slug,
        title: draft.title,
        description: draft.description,
        category: draft.category,
        difficulty: draft.difficulty,
        target_outcome: draft.target_outcome,
        estimated_hours: draft.estimated_hours,
        is_published: false,
        is_featured: false,
        created_by: user.id,
      })
      .select("id, title, description, difficulty, estimated_hours, target_outcome")
      .single();

    if (jErr || !journey) {
      return NextResponse.json(
        { error: jErr?.message || "Failed to create journey" },
        { status: 500 }
      );
    }

    const milestoneRows = draft.milestones.map((m, i) => ({
      journey_id: journey.id,
      title: m.title,
      description: m.description,
      position: i,
      estimated_hours: m.estimated_hours,
      node_type: m.node_type,
      metadata: {
        difficulty: m.difficulty,
        prerequisites: m.prerequisites,
        goal_context: goal,
      },
    }));

    const { data: milestones, error: mErr } = await supabase
      .from("milestones")
      .insert(milestoneRows)
      .select("id, title, description, position, estimated_hours, node_type, metadata");

    if (mErr || !milestones?.length) {
      return NextResponse.json(
        { error: mErr?.message || "Failed to create milestones" },
        { status: 500 }
      );
    }

    const resourcesByMilestone: Record<
      string,
      {
        id: string;
        title: string;
        description: string | null;
        url: string | null;
        provider: string | null;
        pricing_type: string | null;
        resource_type: string;
        note?: string;
      }[]
    > = {};
    const scoutErrors: string[] = [];

    for (const ms of milestones) {
      const { resources, error } = await resourceScout(ms.title, goal, { budget });
      if (error) scoutErrors.push(`${ms.title}: ${error}`);
      resourcesByMilestone[ms.id] = [];

      for (let ri = 0; ri < resources.length; ri++) {
        const r = resources[ri];
        const { data: resRow, error: rErr } = await supabase
          .from("resources")
          .insert({
            title: r.title,
            description: r.description,
            url: r.url,
            canonical_url: r.url,
            resource_type: r.resource_type,
            provider: r.provider,
            pricing_type: r.pricing_type,
            difficulty: r.difficulty,
            is_verified: false,
            is_published: false,
            metadata: { note: r.note, discovered_for_milestone: ms.id },
          })
          .select("id, title, description, url, provider, pricing_type, resource_type")
          .single();

        if (rErr || !resRow) continue;

        await supabase.from("milestone_resources").insert({
          milestone_id: ms.id,
          resource_id: resRow.id,
          is_primary: ri === 0,
          position: ri,
        });

        resourcesByMilestone[ms.id].push({
          ...resRow,
          note: r.note,
        });
      }
    }

    const { data: userJourney, error: ujErr } = await supabase
      .from("user_journeys")
      .insert({
        user_id: user.id,
        journey_id: journey.id,
        status: "active",
        progress_percent: 0,
      })
      .select("id, status, progress_percent")
      .single();

    if (ujErr || !userJourney) {
      return NextResponse.json(
        { error: ujErr?.message || "Failed to enroll user" },
        { status: 500 }
      );
    }

    const progressRows = milestones.map((ms) => ({
      user_id: user.id,
      milestone_id: ms.id,
      user_journey_id: userJourney.id,
      status: "not_started" as const,
    }));
    await supabase.from("learner_progress").insert(progressRows);

    await supabase.from("learning_goals").insert({
      user_id: user.id,
      title: goal.slice(0, 200),
      description: draft.target_outcome,
      status: "active",
    });

    return NextResponse.json({
      journey,
      userJourney,
      milestones: milestones.map((ms) => ({
        ...ms,
        resources: resourcesByMilestone[ms.id] || [],
      })),
      scoutErrors: scoutErrors.length ? scoutErrors : undefined,
      disclaimer:
        "Resources come from public search when available. Always verify free/paid status on the source site.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Roadmap generation failed";
    const status = msg.includes("No AI API keys") ? 503 : 502;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const { data: enrollments, error } = await supabase
      .from("user_journeys")
      .select(
        `
        id,
        status,
        progress_percent,
        started_at,
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
      .eq("user_id", user.id)
      .order("last_accessed_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ enrollments: enrollments ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list roadmaps";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
