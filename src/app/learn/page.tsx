import { redirect } from "next/navigation";

/**
 * Canonical learning workspace is /workspace.
 * Keep /learn as a backwards-compatible alias.
 */
export default function LearnRedirectPage() {
  redirect("/workspace");
}
