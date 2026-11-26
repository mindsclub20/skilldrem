import { NextResponse } from "next/server";
import { getAuthgearSupabase } from "@/lib/authgear-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await getAuthgearSupabase(request);
  if (!auth) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { supabase, user } = auth;
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[admin/overview] profile lookup failed", profileError);
    return NextResponse.json({ error: "Unable to verify administrator access." }, { status: 500 });
  }

  if (profile?.is_admin !== true) {
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  }

  const [journeys, resources, profiles] = await Promise.all([
    supabase.from("journeys").select("id", { count: "exact", head: true }),
    supabase.from("resources").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const queryError = journeys.error ?? resources.error ?? profiles.error;
  if (queryError) {
    console.error("[admin/overview] count query failed", queryError);
    return NextResponse.json({ error: "Unable to load administrator metrics." }, { status: 500 });
  }

  return NextResponse.json({
    profile: { is_admin: true, full_name: profile.full_name },
    counts: {
      journeys: journeys.count ?? 0,
      resources: resources.count ?? 0,
      users: profiles.count ?? 0,
    },
  });
}
