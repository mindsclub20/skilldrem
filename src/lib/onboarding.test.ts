import { describe, expect, it } from "vitest";
import { onboardingSaveError } from "./onboarding";

describe("onboardingSaveError", () => {
  it("explains when learner preferences could not be saved", () => {
    expect(onboardingSaveError("preferences")).toMatch(/couldn't save your learning preferences/i);
  });

  it("distinguishes a profile completion failure after preferences are saved", () => {
    expect(onboardingSaveError("profile")).toMatch(/preferences were saved/i);
    expect(onboardingSaveError("profile")).toMatch(/profile could not be marked complete/i);
  });
});
