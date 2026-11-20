import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WorkspaceClient from "./WorkspaceClient";

type WorkspaceSearchParams = {
  journey_id?: string | string[];
};

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<WorkspaceSearchParams>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/workspace");

  const params = await searchParams;
  const journeyParam = params.journey_id;
  const initialJourneyId = Array.isArray(journeyParam) ? journeyParam[0] : journeyParam ?? null;

  return <WorkspaceClient initialJourneyId={initialJourneyId} />;
}
