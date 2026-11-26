import { jwtVerify, type JWTVerifyGetKey } from "jose";
import { validateAuthgearClaims, type AuthgearConfig } from "@/lib/authgear-token";

export async function verifyAuthgearAccessToken(
  token: string,
  jwks: JWTVerifyGetKey,
  config: AuthgearConfig
) {
  const endpoint = config.endpoint.replace(/\/$/, "");
  const { payload } = await jwtVerify(token, jwks, {
    issuer: endpoint,
    audience: endpoint,
    algorithms: ["RS256"],
  });
  return validateAuthgearClaims(payload, { ...config, endpoint });
}
