import { describe, it, expect } from "vitest";
import { filterAndRankSearchResults, titleFromMessage } from "../resource-filter";

describe("filterAndRankSearchResults", () => {
  it("drops unsafe and error-fragment results", () => {
    const out = filterAndRankSearchResults(
      [
        { title: "Good", url: "https://docs.python.org/3/", description: "Official docs" },
        { title: "Bad", url: "http://insecure.example/", description: "http only" },
        { title: "Auth wall", url: "https://example.com/x", description: "401 Unauthorized" },
      ],
      "learn python"
    );
    expect(out).toHaveLength(1);
    expect(out[0].url).toContain("python.org");
  });

  it("dedupes by host+path", () => {
    const out = filterAndRankSearchResults(
      [
        { title: "A", url: "https://mdn.dev/guide/", description: "guide" },
        { title: "B", url: "https://mdn.dev/guide/", description: "same" },
      ],
      "web"
    );
    expect(out).toHaveLength(1);
  });

  it("ranks authoritative hosts higher", () => {
    const out = filterAndRankSearchResults(
      [
        { title: "Random blog", url: "https://random-blog.example/post", description: "python tips" },
        { title: "Docs", url: "https://docs.python.org/3/tutorial/", description: "python tutorial" },
      ],
      "python tutorial"
    );
    expect(out[0].url).toContain("docs.python.org");
  });
});

describe("titleFromMessage", () => {
  it("truncates long titles", () => {
    const long = "a".repeat(100);
    expect(titleFromMessage(long).length).toBeLessThanOrEqual(61);
  });
  it("handles empty", () => {
    expect(titleFromMessage("")).toBe("New chat");
  });
});
