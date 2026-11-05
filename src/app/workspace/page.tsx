import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WorkspaceClient from "./WorkspaceClient";

export default async function WorkspacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/workspace");

  return <WorkspaceClient />;
}
