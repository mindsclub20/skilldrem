import { NextResponse } from "next/server";
import { getAuthgearSupabase } from "@/lib/authgear-server";
import { normalizeRoadmapForSave } from "@/lib/roadmap-save";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await getAuthgearSupabase(request);
    if (!auth) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = (await request.json()) as { roadmap?: unknown };
    const normalized = normalizeRoadmapForSave(body.roadmap as Parameters<typeof normalizeRoadmapForSave>[0]);
    if (!normalized) {
      return NextResponse.json(
        { error: "Invalid roadmap. Include a title and between 1 and 100 valid milestones." },
        { status: 400 }
      );
    }

    // One PostgreSQL function call makes journey, milestones, and enrollment atomic.
    const { data, error } = await auth.supabase.rpc("create_authgear_journey", {
      p_journey: normalized.journey,
      p_milestones: normalized.milestones,
    });

    if (error) {
      console.error("[roadmap/save] atomic RPC failed", error);
      const migrationMissing = error.code === "PGRST202" || error.code === "42883";
      return NextResponse.json(
        {
          error: migrationMissing
            ? "Roadmap save is not enabled yet. The atomic roadmap migration must be applied to the connected Supabase project."
            : "Unable to save the complete roadmap. No partial roadmap was committed.",
          code: migrationMissing ? "MIGRATION_REQUIRED" : "ROADMAP_SAVE_FAILED",
        },
        { status: migrationMissing ? 503 : 500 }
      );
    }

    const result = data as { journey_id?: string; milestone_count?: number } | null;
    if (!result?.journey_id || result.milestone_count !== normalized.milestones.length) {
      console.error("[roadmap/save] unexpected atomic RPC response", data);
      return NextResponse.json({ error: "Roadmap save returned an invalid result." }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      journey_id: result.journey_id,
      milestone_count: result.milestone_count,
    });
  } catch (err) {
    console.error("[roadmap/save]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Save failed" },
      { status: 500 }
    );
  }
}
