"use client";

import authgear from "@authgear/web";

export async function authgearFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  await authgear.refreshAccessTokenIfNeeded();
  const token = authgear.accessToken;
  if (!token) throw new Error("Sign in is required to continue.");

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(input, { ...init, headers });
}
