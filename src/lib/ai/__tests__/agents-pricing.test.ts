import { describe, expect, it } from "vitest";
import { extractJson, guessPricingType } from "../agents";

describe("guessPricingType", () => {
  it("marks MDN as completely_free", () => {
    const r = guessPricingType("https://developer.mozilla.org/en-US/docs/Web/JavaScript");
    expect(r.type).toBe("completely_free");
  });

  it("marks Udemy as paid", () => {
    const r = guessPricingType("https://www.udemy.com/course/foo");
    expect(r.type).toBe("paid");
  });

  it("marks Coursera as free_audit", () => {
    const r = guessPricingType("https://www.coursera.org/learn/ml");
    expect(r.type).toBe("free_audit");
  });

  it("defaults unknown hosts to unknown", () => {
    const r = guessPricingType("https://example.com/some-course");
    expect(r.type).toBe("unknown");
  });
});

describe("extractJson", () => {
  it("parses fenced json", () => {
    const j = extractJson('```json\n{"a":1}\n```');
    expect(j).toEqual({ a: 1 });
  });

  it("parses raw object", () => {
    const j = extractJson('prefix {"questions":[]} trailing');
    expect(j).toEqual({ questions: [] });
  });
});
