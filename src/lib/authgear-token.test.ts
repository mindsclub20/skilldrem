import { describe, expect, it } from "vitest";
import { validateAuthgearClaims } from "./authgear-token";

const config = {
  endpoint: "https://hazard-vaa5a1.authgear.cloud",
  clientId: "2b273d19926b6daa",
};

const validClaims = {
  iss: config.endpoint,
  aud: [config.endpoint],
  sub: "e3079029-f123-4c56-80c1-c2cd63a5b6af",
  client_id: config.clientId,
  role: "authenticated",
  exp: 1_900_000_000,
};

describe("validateAuthgearClaims", () => {
  it("accepts a correctly scoped Authgear identity", () => {
    expect(validateAuthgearClaims(validClaims, config)).toMatchObject({
      id: validClaims.sub,
    });
  });

  it("rejects tokens from a different issuer or audience", () => {
    expect(() => validateAuthgearClaims({ ...validClaims, iss: "https://evil.example" }, config)).toThrow();
    expect(() => validateAuthgearClaims({ ...validClaims, aud: ["other"] }, config)).toThrow();
  });

  it("rejects a different Authgear client", () => {
    expect(() => validateAuthgearClaims({ ...validClaims, client_id: "another-client" }, config)).toThrow();
  });

  it("requires the authenticated database role", () => {
    expect(() => validateAuthgearClaims({ ...validClaims, role: "anon" }, config)).toThrow();
    expect(() => validateAuthgearClaims({ ...validClaims, role: undefined }, config)).toThrow();
  });

  it("requires a UUID subject because Skilldrem's ownership columns are UUID", () => {
    expect(() => validateAuthgearClaims({ ...validClaims, sub: "user_123" }, config)).toThrow();
  });
});
