import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Owner publishes/unpublishes a journey to the Georny gallery. */
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
      journeyId?: string;
      isPublished?: boolean;
    };

    const journeyId = body.journeyId?.trim();
    if (!journeyId || typeof body.isPublished !== "boolean") {
      return NextResponse.json(
        { error: "journeyId and isPublished required" },
        { status: 400 }
      );
    }

    const { data: journey } = await supabase
      .from("journeys")
      .select("id, created_by, title")
      .eq("id", journeyId)
      .maybeSingle();

    if (!journey || journey.created_by !== user.id) {
      return NextResponse.json({ error: "Only the owner can publish this path" }, { status: 403 });
    }

    const { data: updated, error } = await supabase
      .from("journeys")
      .update({
        is_published: body.isPublished,
        updated_at: new Date().toISOString(),
      })
      .eq("id", journeyId)
      .eq("created_by", user.id)
      .select("id, title, is_published, slug")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      journey: updated,
      message: body.isPublished
        ? "Published to Georny gallery"
        : "Unpublished — private again",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Publish failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** List published journeys (community gallery). */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("journeys")
      .select(
        "id, slug, title, description, category, difficulty, estimated_hours, target_outcome, created_at"
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ journeys: data ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "List failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
