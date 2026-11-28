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
const verification = readFileSync(
  new URL("../../../supabase/tests/anon_public_access.sql", import.meta.url),
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
          "ALTER DEFAULT PRIVILEGES FOR ROLE " + role + " IN SCHEMA public\\s+REVOKE ALL ON TABLES FROM anon;",
          "i"
        )
      );
      expect(migration).toMatch(
        new RegExp(
          "ALTER DEFAULT PRIVILEGES FOR ROLE " + role + " IN SCHEMA public\\s+REVOKE ALL ON SEQUENCES FROM anon;",
          "i"
        )
      );
      expect(migration).toMatch(
        new RegExp(
          "ALTER DEFAULT PRIVILEGES FOR ROLE " + role + " IN SCHEMA public\\s+REVOKE EXECUTE ON FUNCTIONS FROM anon;",
          "i"
        )
      );
    }
  });

  it("revokes global default PUBLIC function execution for both observed grantors", () => {
    for (const role of ["postgres", "supabase_admin"]) {
      expect(migration).toMatch(
        new RegExp(
          "ALTER DEFAULT PRIVILEGES FOR ROLE " + role + "\\s+REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;",
          "i"
        )
      );
      expect(migration).not.toMatch(
        new RegExp(
          "ALTER DEFAULT PRIVILEGES FOR ROLE " + role + " IN SCHEMA public\\s+REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;",
          "i"
        )
      );
    }
  });

  it("preserves PUBLIC execution defaults for extension functions outside public", () => {
    for (const role of ["postgres", "supabase_admin"]) {
      expect(migration).toMatch(
        new RegExp(
          "ALTER DEFAULT PRIVILEGES FOR ROLE " + role + " IN SCHEMA extensions\\s+GRANT EXECUTE ON FUNCTIONS TO PUBLIC;",
          "i"
        )
      );
    }
    expect(verification).toMatch(
      /d\.defaclnamespace = 'extensions'::regnamespace[\s\S]*?acl\.grantee = 0[\s\S]*?acl\.privilege_type = 'EXECUTE'/i
    );
  });

  it("verifies anon cannot maintain or read private public-schema relations", () => {
    expect(verification).toMatch(
      /has_table_privilege\('anon', table_record\.relation_oid, 'MAINTAIN'\)/i
    );
    expect(verification).toMatch(
      /table_record\.table_name NOT IN \('journeys', 'resources'\)[\s\S]*?has_table_privilege\('anon', table_record\.relation_oid, 'SELECT'\)/i
    );
    expect(verification).toMatch(
      /c\.relkind IN \('r', 'p', 'v', 'm', 'f'\)/i
    );
  });

  it("verifies anon can read only allowlisted columns on the public catalogues", () => {
    expect(verification).toMatch(/information_schema\.columns/i);
    expect(verification).toMatch(
      /has_column_privilege\('anon', 'public\.journeys', c\.column_name, 'SELECT'\)/i
    );
    expect(verification).toMatch(
      /has_column_privilege\('anon', 'public\.resources', c\.column_name, 'SELECT'\)/i
    );
    expect(verification).toMatch(/c\.column_name NOT IN \([\s\S]*?cover_image_url[\s\S]*?\)/i);
    expect(verification).toMatch(/c\.column_name NOT IN \([\s\S]*?is_published[\s\S]*?\)/i);
  });

  it("verifies effective function access and default privilege state after migration", () => {
    expect(verification).toMatch(
      /has_function_privilege\('anon', p\.oid, 'EXECUTE'\)/i
    );
    expect(verification).toMatch(
      /d\.defaclnamespace = 0[\s\S]*?acl\.grantee = 0[\s\S]*?acl\.privilege_type = 'EXECUTE'/i
    );
    expect(verification).toMatch(
      /d\.defaclnamespace = 'public'::regnamespace[\s\S]*?acl\.grantee = 'anon'::regrole/i
    );
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
    expect(migration).toMatch(/DROP POLICY IF EXISTS journeys_public_read_published ON public[.]journeys;/i);
    expect(migration).toMatch(/DROP POLICY IF EXISTS resources_read_published ON public[.]resources;/i);
    expect(migration).toMatch(/DROP POLICY IF EXISTS resources_public_read_published ON public[.]resources;/i);
    expect(migration).toMatch(
      /CREATE POLICY resources_read_published[\s\S]*?FOR SELECT[\s\S]*?TO anon,\s*authenticated[\s\S]*?USING\s*\(is_published\s*=\s*true\)/i
    );
    expect(migration).not.toMatch(/CREATE POLICY resources_public_read_published/i);
    expect(verification).toContain("policyname = 'resources_read_published'");
    expect(verification).not.toContain("policyname = 'resources_public_read_published'");

    const journeyGrant = migration.match(
      /GRANT SELECT\s*\(([^)]*)\)\s*ON TABLE public\.journeys TO anon;/i
    );
    expect(journeyGrant?.[1]).toBeDefined();
    expect(journeyGrant?.[1]).not.toMatch(/\bcreated_by\b/i);
  });

  it("verifies anonymous column-level grants are limited to approved catalogue columns", () => {
    for (const privilege of ["SELECT", "INSERT", "UPDATE", "REFERENCES"]) {
      expect(verification).toContain(
        "has_column_privilege('anon', c.oid, a.attnum, '" + privilege + "')"
      );
    }
    expect(verification).toContain("c.relname NOT IN ('journeys', 'resources')");
    expect(verification).toContain("a.attname NOT IN (");
  });
});
