import { describe, expect, it } from "vitest";
import {
  getCatalogBooks,
  getCatalogCourses,
  VERIFIED_BOOKS,
  VERIFIED_COURSES,
} from "./verified-catalog";

describe("verified catalog", () => {
  it("includes India official platforms among courses", () => {
    const titles = VERIFIED_COURSES.map((c) => c.title.toLowerCase()).join(" ");
    expect(titles).toMatch(/swayam/);
    expect(titles).toMatch(/nptel/);
    expect(titles).toMatch(/ncert/);
    expect(titles).toMatch(/diksha/);
  });

  it("filters courses by subject", () => {
    const math = getCatalogCourses({ subject: "Mathematics" });
    expect(math.length).toBeGreaterThan(0);
    expect(math.every((c) => c.subject.toLowerCase().includes("math"))).toBe(true);
  });

  it("filters courses by search query", () => {
    const python = getCatalogCourses({ q: "python" });
    expect(python.some((c) => /python/i.test(c.title + c.description))).toBe(true);
  });

  it("returns only completely free books when pricing filter set", () => {
    const free = getCatalogBooks({ pricing: "completely_free" });
    expect(free.length).toBe(VERIFIED_BOOKS.length);
    expect(free.every((b) => b.pricing_type === "completely_free")).toBe(true);
  });

  it("every catalog item has https url and verified date", () => {
    for (const item of [...VERIFIED_COURSES, ...VERIFIED_BOOKS]) {
      expect(item.url.startsWith("https://")).toBe(true);
      expect(item.verified_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(item.title.length).toBeGreaterThan(3);
    }
  });
});
