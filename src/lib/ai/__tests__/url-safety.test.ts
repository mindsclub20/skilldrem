import { describe, it, expect } from "vitest";
import { isSafeHttpUrl } from "../firecrawl";

describe("isSafeHttpUrl", () => {
  it("allows public https URLs", () => {
    expect(isSafeHttpUrl("https://docs.python.org/3/tutorial/")).toBe(true);
  });

  it("rejects http", () => {
    expect(isSafeHttpUrl("http://example.com")).toBe(false);
  });

  it("rejects localhost and private ranges", () => {
    expect(isSafeHttpUrl("https://localhost/admin")).toBe(false);
    expect(isSafeHttpUrl("https://127.0.0.1/")).toBe(false);
    expect(isSafeHttpUrl("https://192.168.1.1/")).toBe(false);
    expect(isSafeHttpUrl("https://10.0.0.5/")).toBe(false);
  });

  it("rejects invalid strings", () => {
    expect(isSafeHttpUrl("not-a-url")).toBe(false);
  });
});
