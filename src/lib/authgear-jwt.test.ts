import { describe, expect, it } from "vitest";
import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
} from "jose";
import { verifyAuthgearAccessToken } from "./authgear-jwt";

const endpoint = "https://hazard-vaa5a1.authgear.cloud";
const config = { endpoint, clientId: "2b273d19926b6daa" };
const subject = "e3079029-f123-4c56-80c1-c2cd63a5b6af";

async function makeKeySet() {
  const pair = await generateKeyPair("RS256");
  const jwk = await exportJWK(pair.publicKey);
  jwk.kid = "test-key";
  jwk.alg = "RS256";
  jwk.use = "sig";
  return { pair, jwks: createLocalJWKSet({ keys: [jwk] }) };
}

async function makeToken(privateKey: Parameters<SignJWT["sign"]>[0], overrides: Record<string, unknown> = {}) {
  return new SignJWT({
    client_id: config.clientId,
    role: "authenticated",
    email: "learner@example.com",
    "https://authgear.com/claims/user/is_verified": true,
    ...overrides,
  })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setIssuer(endpoint)
    .setAudience(endpoint)
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(privateKey);
}

describe("verifyAuthgearAccessToken", () => {
  it("verifies a valid RS256 token against the configured Authgear JWKS", async () => {
    const { pair, jwks } = await makeKeySet();
    const token = await makeToken(pair.privateKey);
    await expect(verifyAuthgearAccessToken(token, jwks, config)).resolves.toMatchObject({ id: subject });
  });

  it("rejects a token signed by a key that is not in the trusted JWKS", async () => {
    const trusted = await makeKeySet();
    const attacker = await generateKeyPair("RS256");
    const token = await makeToken(attacker.privateKey);
    await expect(verifyAuthgearAccessToken(token, trusted.jwks, config)).rejects.toThrow();
  });

  it("rejects an expired token", async () => {
    const { pair, jwks } = await makeKeySet();
    const token = await new SignJWT({
      client_id: config.clientId,
      role: "authenticated",
      "https://authgear.com/claims/user/is_verified": true,
    })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setIssuer(endpoint)
      .setAudience(endpoint)
      .setSubject(subject)
      .setIssuedAt()
      .setExpirationTime("0s")
      .sign(pair.privateKey);
    await expect(verifyAuthgearAccessToken(token, jwks, config)).rejects.toThrow();
  });

  it("rejects a token with the wrong issuer or audience", async () => {
    const { pair, jwks } = await makeKeySet();
    const wrongIssuer = await new SignJWT({
      client_id: config.clientId,
      role: "authenticated",
      "https://authgear.com/claims/user/is_verified": true,
    }).setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setIssuer("https://untrusted.example")
      .setAudience(endpoint)
      .setSubject(subject)
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(pair.privateKey);
    const wrongAudience = await makeToken(pair.privateKey, { aud: "https://untrusted.example" });
    await expect(verifyAuthgearAccessToken(wrongIssuer, jwks, config)).rejects.toThrow();
    await expect(verifyAuthgearAccessToken(wrongAudience, jwks, config)).rejects.toThrow();
  });
});
