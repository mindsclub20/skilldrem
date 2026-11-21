export type OnboardingSaveStage = "preferences" | "profile";

export function onboardingSaveError(stage: OnboardingSaveStage): string {
  if (stage === "preferences") {
    return "We couldn't save your learning preferences. Your profile has not been marked complete. Please try again.";
  }

  return "Your preferences were saved, but your profile could not be marked complete. Please try again.";
}

export function onboardingProfileSaveError(
  profile: { id: string } | null,
  error: unknown,
): string | null {
  if (error || !profile?.id) {
    return onboardingSaveError("profile");
  }

  return null;
}
