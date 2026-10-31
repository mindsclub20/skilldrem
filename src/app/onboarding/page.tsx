"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const INTERESTS = ["Programming","Data Science","Design","Business","Languages","Math","Science","AI/ML","Web Dev","Mobile"];
const LEVELS = ["beginner","intermediate","advanced","expert"] as const;
const BUDGETS = ["free_only","free_preferred","mixed","paid_ok"] as const;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [level, setLevel] = useState<string>("beginner");
  const [budget, setBudget] = useState<string>("free_preferred");
  const [hours, setHours] = useState(5);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function toggleInterest(i: string) {
    setInterests((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);
  }

  async function finish() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }
    await supabase.from("user_preferences").upsert({
      user_id: user.id,
      interests,
      experience_level: level,
      budget_preference: budget,
      available_hours_per_week: hours,
    });
    await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-xl font-bold">Set up your learning profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Step {step + 1} of 3</p>
        {step === 0 && (
          <div className="mt-6">
            <p className="font-medium mb-3">What are you interested in?</p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((i) => (
                <button key={i} type="button" onClick={() => toggleInterest(i)}
                  className={`rounded-full px-3 py-1.5 text-sm border ${interests.includes(i) ? "bg-accent text-accent-foreground border-accent" : "border-border"}`}>
                  {i}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setStep(1)} className="mt-8 w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium">Next</button>
          </div>
        )}
        {step === 1 && (
          <div className="mt-6 space-y-4">
            <div>
              <p className="font-medium mb-2">Experience level</p>
              <div className="grid grid-cols-2 gap-2">
                {LEVELS.map((l) => (
                  <button key={l} type="button" onClick={() => setLevel(l)}
                    className={`rounded-xl border px-3 py-2 text-sm capitalize ${level === l ? "border-accent bg-accent/10" : "border-border"}`}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="font-medium mb-2">Budget preference</p>
              <div className="grid grid-cols-2 gap-2">
                {BUDGETS.map((b) => (
                  <button key={b} type="button" onClick={() => setBudget(b)}
                    className={`rounded-xl border px-3 py-2 text-sm ${budget === b ? "border-accent bg-accent/10" : "border-border"}`}>{b.replace(/_/g, " ")}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(0)} className="flex-1 h-11 rounded-xl border border-border">Back</button>
              <button type="button" onClick={() => setStep(2)} className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-medium">Next</button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="font-medium">Hours available per week: {hours}</label>
              <input type="range" min={1} max={40} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full mt-2" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 h-11 rounded-xl border border-border">Back</button>
              <button type="button" onClick={finish} disabled={loading} className="flex-1 h-11 rounded-xl bg-accent text-accent-foreground font-medium disabled:opacity-60">
                {loading ? "Saving…" : "Finish"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
