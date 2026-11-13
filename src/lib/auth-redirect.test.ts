import { describe, expect, it } from "vitest";
import { safeAuthRedirect } from "./auth-redirect";

describe("safeAuthRedirect", () => {
  it("keeps safe same-origin application paths", () => {
    expect(safeAuthRedirect("/assistant")).toBe("/assistant");
    expect(safeAuthRedirect("/discover?topic=robotics#results")).toBe("/discover?topic=robotics#results");
  });

  it("defaults to the public homepage when no destination is supplied", () => {
    expect(safeAuthRedirect(null)).toBe("/");
    expect(safeAuthRedirect("")).toBe("/");
    expect(safeAuthRedirect(undefined)).toBe("/");
  });

  it("falls back to the homepage for external or protocol-relative destinations", () => {
    expect(safeAuthRedirect("https://example.com")).toBe("/");
    expect(safeAuthRedirect("//example.com")).toBe("/");
    expect(safeAuthRedirect("javascript:alert(1)")).toBe("/");
  });

  it("rejects backslash and control-character redirects", () => {
    expect(safeAuthRedirect("/\\\\evil.example")).toBe("/");
    expect(safeAuthRedirect("/path\\nheader")).toBe("/");
  });
});
