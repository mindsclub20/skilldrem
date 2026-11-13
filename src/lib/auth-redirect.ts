const FALLBACK_REDIRECT = "/assistant";

export function safeAuthRedirect(value: string | null | undefined): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return FALLBACK_REDIRECT;
  }

  try {
    const base = "https://skilldrem.invalid";
    const parsed = new URL(value, base);
    if (parsed.origin !== base) return FALLBACK_REDIRECT;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return FALLBACK_REDIRECT;
  }
}
