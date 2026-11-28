import { describe, expect, it } from "vitest";
import { resolveBrowserSupabaseConfig } from "./config";

describe("resolveBrowserSupabaseConfig", () => {
  it("returns the public URL and anon key after trimming whitespace", () => {
    expect(
      resolveBrowserSupabaseConfig(
        " https://example.supabase.co ",
        " public-anon-key "
      )
    ).toEqual({
      url: "https://example.supabase.co",
      anonKey: "public-anon-key",
    });
  });

  it("rejects a missing public URL", () => {
    expect(() => resolveBrowserSupabaseConfig(undefined, "public-anon-key")).toThrow(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured"
    );
  });

  it("rejects a missing browser-safe anon key", () => {
    expect(() => resolveBrowserSupabaseConfig("https://example.supabase.co", undefined)).toThrow(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured"
    );
  });

  it("rejects blank public configuration", () => {
    expect(() => resolveBrowserSupabaseConfig(" ", " ")).toThrow(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured"
    );
  });
});
