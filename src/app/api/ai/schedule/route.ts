import { NextResponse } from "next/server";
import { buildSchedule } from "@/lib/ai/schedule";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Persist hours/week and return dynamic milestone deadlines. */
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
      hoursPerWeek?: number;
    };

    const userJourneyId = body.userJourneyId?.trim();
    const hoursPerWeek = Number(body.hoursPerWeek);
    if (!userJourneyId || !Number.isFinite(hoursPerWeek)) {
      return NextResponse.json(
        { error: "userJourneyId and hoursPerWeek required" },
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
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await supabase
      .from("user_journeys")
      .update({
        hours_per_week: Math.max(1, Math.min(80, hoursPerWeek)),
        last_accessed_at: new Date().toISOString(),
      })
      .eq("id", userJourneyId);

    // Also update preference default
    await supabase.from("user_preferences").upsert(
      {
        user_id: user.id,
        available_hours_per_week: Math.max(1, Math.min(80, hoursPerWeek)),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    const { data: milestones } = await supabase
      .from("milestones")
      .select("id, title, estimated_hours, position")
      .eq("journey_id", uj.journey_id)
      .order("position", { ascending: true });

    const schedule = buildSchedule(milestones ?? [], hoursPerWeek);
    return NextResponse.json({ schedule });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Schedule failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const userJourneyId = new URL(request.url).searchParams.get("userJourneyId");
    if (!userJourneyId) {
      return NextResponse.json({ error: "userJourneyId required" }, { status: 400 });
    }

    const { data: uj } = await supabase
      .from("user_journeys")
      .select("id, journey_id, hours_per_week")
      .eq("id", userJourneyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!uj) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("available_hours_per_week")
      .eq("user_id", user.id)
      .maybeSingle();

    const hpw = Number(
      uj.hours_per_week ?? prefs?.available_hours_per_week ?? 5
    );

    const { data: milestones } = await supabase
      .from("milestones")
      .select("id, title, estimated_hours, position")
      .eq("journey_id", uj.journey_id)
      .order("position", { ascending: true });

    return NextResponse.json({
      schedule: buildSchedule(milestones ?? [], hpw),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Schedule failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
