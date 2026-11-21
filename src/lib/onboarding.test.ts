import { describe, expect, it } from "vitest";
import { onboardingProfileSaveError, onboardingSaveError } from "./onboarding";

describe("onboardingSaveError", () => {
  it("explains when learner preferences could not be saved", () => {
    expect(onboardingSaveError("preferences")).toMatch(/couldn't save your learning preferences/i);
  });

  it("distinguishes a profile completion failure after preferences are saved", () => {
    expect(onboardingSaveError("profile")).toMatch(/preferences were saved/i);
    expect(onboardingSaveError("profile")).toMatch(/profile could not be marked complete/i);
  });
});

describe("onboardingProfileSaveError", () => {
  it("treats a zero-row profile upsert as a failed completion", () => {
    expect(onboardingProfileSaveError(null, null)).toMatch(/profile could not be marked complete/i);
  });

  it("treats a profile write error as a failed completion", () => {
    expect(onboardingProfileSaveError(null, { message: "permission denied" })).toMatch(
      /profile could not be marked complete/i,
    );
  });

  it("accepts a confirmed profile row", () => {
    expect(onboardingProfileSaveError({ id: "user-1" }, null)).toBeNull();
  });
});
