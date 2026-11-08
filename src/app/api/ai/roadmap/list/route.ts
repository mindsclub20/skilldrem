import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/ai/roadmap/list
 * Lists journeys the authenticated user is enrolled in (or created).
 */
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
        created_at,
        updated_at,
        journey:journeys (
          id,
          title,
          description,
          target_outcome,
          difficulty,
          estimated_hours,
          category,
          created_at
        )
      `
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("[roadmap/list]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      journeys: enrollments ?? [],
    });
  } catch (err) {
    console.error("[roadmap/list]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list journeys" },
      { status: 500 }
    );
  }
}
