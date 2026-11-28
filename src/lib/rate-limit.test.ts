import { beforeEach, describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  let now: number;
  beforeEach(() => { now = 1_000; });

  it("allows requests up to the configured limit and then blocks", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1_000, now: () => now });
    expect(limiter.consume("user-a").allowed).toBe(true);
    expect(limiter.consume("user-a").allowed).toBe(true);
    expect(limiter.consume("user-a").allowed).toBe(false);
  });

  it("isolates keys", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1_000, now: () => now });
    expect(limiter.consume("user-a").allowed).toBe(true);
    expect(limiter.consume("user-b").allowed).toBe(true);
    expect(limiter.consume("user-a").allowed).toBe(false);
  });

  it("resets a fixed window after expiry", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1_000, now: () => now });
    expect(limiter.consume("user-a").allowed).toBe(true);
    now += 1_001;
    expect(limiter.consume("user-a").allowed).toBe(true);
  });
});
