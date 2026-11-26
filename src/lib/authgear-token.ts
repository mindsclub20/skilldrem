export type AuthgearClaims = {
  iss?: unknown;
  aud?: unknown;
  sub?: unknown;
  client_id?: unknown;
  role?: unknown;
  email?: unknown;
  name?: unknown;
  picture?: unknown;
  exp?: unknown;
  "https://authgear.com/claims/user/is_verified"?: unknown;
};

export type AuthgearConfig = {
  endpoint: string;
  clientId: string;
};

export type AuthgearIdentity = {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateAuthgearClaims(
  claims: AuthgearClaims,
  config: AuthgearConfig
): AuthgearIdentity {
  const endpoint = config.endpoint.replace(/\/$/, "");
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];

  if (claims.iss !== endpoint) throw new Error("Invalid Authgear issuer");
  if (!audience.includes(endpoint)) throw new Error("Invalid Authgear audience");
  if (claims.client_id !== config.clientId) throw new Error("Invalid Authgear client");
  if (claims.role !== "authenticated") {
    throw new Error("Authgear token must include role=authenticated");
  }
  if (claims["https://authgear.com/claims/user/is_verified"] !== true) {
    throw new Error("Authgear user must satisfy the configured verification requirement");
  }
  if (typeof claims.sub !== "string" || !UUID_PATTERN.test(claims.sub)) {
    throw new Error("Authgear subject must be a UUID for the current Skilldrem schema");
  }

  return {
    id: claims.sub,
    ...(typeof claims.email === "string" ? { email: claims.email } : {}),
    ...(typeof claims.name === "string" ? { name: claims.name } : {}),
    ...(typeof claims.picture === "string" ? { picture: claims.picture } : {}),
  };
}
