"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { onboardingSaveError } from "@/lib/onboarding";

const INTERESTS = ["Programming", "Data Science", "Design", "Business", "Languages", "Math", "Science", "AI/ML", "Web Dev", "Mobile"];
const LEVELS = ["beginner", "intermediate", "advanced", "expert"] as const;
const BUDGETS = ["free_only", "free_preferred", "mixed", "paid_ok"] as const;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [level, setLevel] = useState<string>("beginner");
  const [budget, setBudget] = useState<string>("free_preferred");
  const [hours, setHours] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function toggleInterest(interest: string) {
    setInterests((previous) =>
      previous.includes(interest)
        ? previous.filter((item) => item !== interest)
        : [...previous, interest],
    );
  }

  async function finish() {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error("We couldn't verify your session. Please sign in again.");
      }
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { error: preferencesError } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          interests,
          experience_level: level,
          budget_preference: budget,
          available_hours_per_week: hours,
        });

      if (preferencesError) {
        throw new Error(onboardingSaveError("preferences"));
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);

      if (profileError) {
        throw new Error(onboardingSaveError("profile"));
      }

      router.push("/dashboard");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Something went wrong while saving your profile. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-xl font-bold">Set up your learning profile</h1>
        <p className="text-sm text-muted-foreground mt-1" aria-live="polite">
          Step {step + 1} of 3
        </p>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          >
            {error}
          </div>
        )}

        {step === 0 && (
          <fieldset className="mt-6">
            <legend className="font-medium mb-3">What are you interested in?</legend>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  aria-pressed={interests.includes(interest)}
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full px-3 py-1.5 text-sm border ${interests.includes(interest) ? "bg-accent text-accent-foreground border-accent" : "border-border"}`}
                >
                  {interest}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mt-8 w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium"
            >
              Next
            </button>
          </fieldset>
        )}

        {step === 1 && (
          <div className="mt-6 space-y-4">
            <fieldset>
              <legend className="font-medium mb-2">Experience level</legend>
              <div className="grid grid-cols-2 gap-2">
                {LEVELS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={level === option}
                    onClick={() => setLevel(option)}
                    className={`rounded-xl border px-3 py-2 text-sm capitalize ${level === option ? "border-accent bg-accent/10" : "border-border"}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="font-medium mb-2">Budget preference</legend>
              <div className="grid grid-cols-2 gap-2">
                {BUDGETS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={budget === option}
                    onClick={() => setBudget(option)}
                    className={`rounded-xl border px-3 py-2 text-sm ${budget === option ? "border-accent bg-accent/10" : "border-border"}`}
                  >
                    {option.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="flex-1 h-11 rounded-xl border border-border"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="weekly-hours" className="font-medium">
                Hours available per week: {hours}
              </label>
              <input
                id="weekly-hours"
                type="range"
                min={1}
                max={40}
                value={hours}
                aria-valuetext={`${hours} hours per week`}
                onChange={(event) => setHours(Number(event.target.value))}
                className="w-full mt-2"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 h-11 rounded-xl border border-border"
              >
                Back
              </button>
              <button
                type="button"
                onClick={finish}
                disabled={loading}
                className="flex-1 h-11 rounded-xl bg-accent text-accent-foreground font-medium disabled:opacity-60"
              >
                {loading ? "Saving…" : "Finish"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
