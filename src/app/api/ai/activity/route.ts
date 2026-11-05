import { NextResponse } from "next/server";
import { computeStreak } from "@/lib/ai/schedule";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Log daily learning activity (streak + XP). Idempotent per day/type. */
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
      activityType?: string;
      xp?: number;
      metadata?: Record<string, unknown>;
    };

    const activityType = (body.activityType || "study").slice(0, 40);
    const xp = Math.max(1, Math.min(100, Number(body.xp) || 10));

    const { error } = await supabase.from("learning_activity").upsert(
      {
        user_id: user.id,
        activity_date: new Date().toISOString().slice(0, 10),
        activity_type: activityType,
        xp,
        metadata: body.metadata || {},
      },
      { onConflict: "user_id,activity_date,activity_type" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return GET_internal(supabase, user.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Activity failed";
    return NextResponse.json({ error: msg }, { status: 500 });
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
    return GET_internal(supabase, user.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Activity failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function GET_internal(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
) {
  const { data: rows } = await supabase
    .from("learning_activity")
    .select("activity_date, xp, activity_type")
    .eq("user_id", userId)
    .order("activity_date", { ascending: false })
    .limit(120);

  const dates = (rows ?? []).map((r: { activity_date: string }) => r.activity_date);
  const streak = computeStreak(dates);
  const totalXp = (rows ?? []).reduce(
    (s: number, r: { xp: number }) => s + Number(r.xp || 0),
    0
  );

  const { data: badges } = await supabase
    .from("skill_badges")
    .select("id, badge_key, title, description, awarded_at, journey_id")
    .eq("user_id", userId)
    .order("awarded_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    ...streak,
    totalXp,
    recent: rows ?? [],
    badges: badges ?? [],
  });
}
