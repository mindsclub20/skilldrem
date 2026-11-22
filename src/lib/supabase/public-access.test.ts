import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PUBLIC_JOURNEY_SELECT, PUBLIC_RESOURCE_SELECT } from "./public-select";

const migration = readFileSync(
  new URL(
    "../../../supabase/migrations/20261122150000_restrict_anon_public_schema_access.sql",
    import.meta.url
  ),
  "utf8"
);

const fields = (selection: string) =>
  selection.split(",").map((field) => field.trim());

describe("anonymous public Supabase access", () => {
  it("selects only the approved public journey columns", () => {
    expect(fields(PUBLIC_JOURNEY_SELECT)).toEqual([
      "id",
      "slug",
      "title",
      "description",
      "category",
      "difficulty",
      "target_outcome",
      "estimated_hours",
      "is_published",
      "is_featured",
      "cover_image_url",
    ]);
    expect(fields(PUBLIC_JOURNEY_SELECT)).not.toContain("created_by");
  });

  it("selects only the approved public resource columns", () => {
    expect(fields(PUBLIC_RESOURCE_SELECT)).toEqual([
      "id",
      "title",
      "description",
      "url",
      "resource_type",
      "provider",
      "language",
      "pricing_type",
      "difficulty",
      "duration_hours",
      "has_certificate",
      "quality_score",
      "is_published",
    ]);
  });

  it("revokes unsafe existing anonymous table, sequence, and function privileges", () => {
    expect(migration).toMatch(
      /REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;/i
    );
    expect(migration).toMatch(
      /REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon;/i
    );
    expect(migration).toMatch(
      /REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;/i
    );
    expect(migration).toMatch(
      /REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;/i
    );
  });

  it("removes broad default grants from both observed public-schema grantors", () => {
    for (const role of ["postgres", "supabase_admin"]) {
      expect(migration).toMatch(
        new RegExp(
          `ALTER DEFAULT PRIVILEGES FOR ROLE ${role} IN SCHEMA public\\s+REVOKE ALL ON TABLES FROM anon;`,
          "i"
        )
      );
      expect(migration).toMatch(
        new RegExp(
          `ALTER DEFAULT PRIVILEGES FOR ROLE ${role} IN SCHEMA public\\s+REVOKE ALL ON SEQUENCES FROM anon;`,
          "i"
        )
      );
      expect(migration).toMatch(
        new RegExp(
          `ALTER DEFAULT PRIVILEGES FOR ROLE ${role} IN SCHEMA public\\s+REVOKE EXECUTE ON FUNCTIONS FROM anon;`,
          "i"
        )
      );
    }
  });

  it("grants anonymous read-only access only to published journeys and resources", () => {
    expect(migration).toMatch(
      /GRANT SELECT\s*\([\s\S]*\)\s*ON TABLE public\.journeys TO anon;/i
    );
    expect(migration).toMatch(
      /GRANT SELECT\s*\([\s\S]*\)\s*ON TABLE public\.resources TO anon;/i
    );
    expect(migration).toMatch(
      /CREATE POLICY journeys_public_read_published[\s\S]*?FOR SELECT[\s\S]*?TO anon[\s\S]*?USING\s*\(is_published\s*=\s*true\)/i
    );
    expect(migration).toMatch(
      /CREATE POLICY resources_public_read_published[\s\S]*?FOR SELECT[\s\S]*?TO anon[\s\S]*?USING\s*\(is_published\s*=\s*true\)/i
    );

    const journeyGrant = migration.match(
      /GRANT SELECT\s*\(([^)]*)\)\s*ON TABLE public\.journeys TO anon;/i
    );
    expect(journeyGrant?.[1]).toBeDefined();
    expect(journeyGrant?.[1]).not.toMatch(/\bcreated_by\b/i);
  });
});
