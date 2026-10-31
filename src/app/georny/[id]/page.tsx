import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GeornyGraph } from "@/components/georny/GeornyGraph";

export default async function GeornyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const isUuid = /^[0-9a-f-]{36}$/i.test(id);
  let q = supabase.from("journeys").select("*").eq("is_published", true);
  const { data: journey } = isUuid
    ? await q.eq("id", id).maybeSingle()
    : await q.eq("slug", id).maybeSingle();

  if (!journey) notFound();

  const { data: milestones } = await supabase
    .from("milestones")
    .select("*")
    .eq("journey_id", journey.id)
    .order("position");

  const milestoneIds = (milestones ?? []).map((m) => m.id);
  const { data: deps } = milestoneIds.length
    ? await supabase
        .from("milestone_dependencies")
        .select("milestone_id, depends_on_id")
        .in("milestone_id", milestoneIds)
    : { data: [] };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-40">
        <div className="mx-auto max-w-6xl h-14 flex items-center justify-between px-4">
          <Link href="/" className="font-semibold">SKILLDREM</Link>
          <Link href="/georny" className="text-sm text-muted-foreground hover:text-foreground">All Geornies</Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-xs font-medium text-accent uppercase tracking-wide">{journey.category} · {journey.difficulty}</p>
        <h1 className="text-2xl font-bold mt-1">{journey.title}</h1>
        {journey.description && (
          <p className="mt-2 text-muted-foreground max-w-2xl">{journey.description}</p>
        )}
        {journey.target_outcome && (
          <p className="mt-2 text-sm"><span className="font-medium">Outcome:</span> {journey.target_outcome}</p>
        )}
        <div className="mt-8">
          <h2 className="font-semibold mb-3">Interactive path</h2>
          <GeornyGraph milestones={milestones ?? []} dependencies={deps ?? []} />
        </div>
        <section className="mt-10">
          <h2 className="font-semibold mb-3">Milestones (list)</h2>
          <ol className="space-y-3">
            {(milestones ?? []).map((m, i) => (
              <li key={m.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">{i + 1}</span>
                  <div>
                    <h3 className="font-medium">{m.title}</h3>
                    {m.description && <p className="text-sm text-muted-foreground mt-1">{m.description}</p>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
