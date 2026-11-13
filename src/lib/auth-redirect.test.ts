import { describe, expect, it } from "vitest";
import { safeAuthRedirect } from "./auth-redirect";

describe("safeAuthRedirect", () => {
  it("keeps safe same-origin application paths", () => {
    expect(safeAuthRedirect("/assistant")).toBe("/assistant");
    expect(safeAuthRedirect("/discover?topic=robotics#results")).toBe("/discover?topic=robotics#results");
  });

  it("falls back for external or protocol-relative destinations", () => {
    expect(safeAuthRedirect("https://example.com")).toBe("/assistant");
    expect(safeAuthRedirect("//example.com")).toBe("/assistant");
    expect(safeAuthRedirect("javascript:alert(1)")).toBe("/assistant");
  });

  it("rejects backslash and control-character redirects", () => {
    expect(safeAuthRedirect("/\\\\evil.example")).toBe("/assistant");
    expect(safeAuthRedirect("/path\\nheader")).toBe("/assistant");
  });

  it("handles missing and malformed values", () => {
    expect(safeAuthRedirect(null)).toBe("/assistant");
    expect(safeAuthRedirect("")).toBe("/assistant");
  });
});
