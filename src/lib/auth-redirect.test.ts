import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { safeAuthRedirect, safeAuthRedirectUrl } from "./auth-redirect";

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

  it("preserves path, query, and fragment in an absolute same-origin redirect URL", () => {
    const target = safeAuthRedirectUrl(
      "/discover?topic=robotics#results",
      "https://skilldrem.example/auth/login?redirect=ignored"
    );

    expect(target.origin).toBe("https://skilldrem.example");
    expect(target.pathname).toBe("/discover");
    expect(target.search).toBe("?topic=robotics");
    expect(target.hash).toBe("#results");
  });

  it("keeps unsafe redirect URLs on the same-origin homepage", () => {
    const target = safeAuthRedirectUrl("//evil.example/path", "https://skilldrem.example");

    expect(target.origin).toBe("https://skilldrem.example");
    expect(target.pathname).toBe("/");
    expect(target.search).toBe("");
    expect(target.hash).toBe("");
  });
});

describe("protected route login return path", () => {
  it("preserves the protected route query string when sending a learner to login", async () => {
    const middleware = await readFile(
      new URL("./supabase/middleware.ts", import.meta.url),
      "utf8"
    );
    expect(middleware).toMatch(
      /searchParams\\.set\\("redirect",\\s*`\\$\\{path\\}\\$\\{request\\.nextUrl\\.search\\}`\\)/
    );
  });
});
