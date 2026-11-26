"use client";

// Load the browser-only SDK on demand so Next.js can prerender server routes.
export async function authgearFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const { default: authgear } = await import("@authgear/web");
  return authgear.fetch(input, init);
}
