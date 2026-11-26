"use client";

import authgear from "@authgear/web";

// Authgear's SDK refreshes the access token and attaches the bearer header.
export async function authgearFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  return authgear.fetch(input, init);
}
