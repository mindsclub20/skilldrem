import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  PUBLIC_JOURNEY_SELECT,
  PUBLIC_MILESTONE_SELECT,
  PUBLIC_RESOURCE_SELECT,
} from "./public-select";

const migration = readFileSync(
  new URL(
    "../../../supabase/migrations/20261126120000_authgear_primary_auth.sql",
    import.meta.url
  ),
  "utf8"
);
const verification = readFileSync(
  new URL("../../../supabase/tests/anon_public_access.sql", import.meta.url),
  "utf8"
);
const geornyListPage = readFileSync(
  new URL("../../app/georny/page.tsx", import.meta.url),
  "utf8"
);
const geornyDetailPage = readFileSync(
  new URL("../../app/georny/[id]/page.tsx", import.meta.url),
  "utf8"
);
const coursesPage = readFileSync(
  new URL("../../app/courses/page.tsx", import.meta.url),
  "utf8"
);
const booksPage = readFileSync(
  new URL("../../app/books/page.tsx", import.meta.url),
  "utf8"
);

const fields = (selection: string) =>
  selection.split(",").map((field) => field.trim());

describe("anonymous public Supabase access", () => {
  it("limits public journey projections and excludes owner identifiers", () => {
    expect(fields(PUBLIC_JOURNEY_SELECT)).toEqual([
      "id", "slug", "title", "description", "category", "difficulty",
      "target_outcome", "estimated_hours", "is_published", "is_featured",
      "cover_image_url",
    ]);
    expect(PUBLIC_JOURNEY_SELECT).not.toContain("created_by");
  });

  it("limits public resource projections to catalogue fields", () => {
    expect(fields(PUBLIC_RESOURCE_SELECT)).toEqual([
      "id", "title", "description", "url", "resource_type", "provider",
      "language", "pricing_type", "difficulty", "duration_hours",
      "has_certificate", "quality_score", "is_published",
    ]);
    expect(PUBLIC_RESOURCE_SELECT).not.toContain("is_verified");
  });

  it("limits public milestone projections to fields rendered by Georny", () => {
    expect(fields(PUBLIC_MILESTONE_SELECT)).toEqual([
      "id", "journey_id", "title", "description", "position",
      "node_type", "estimated_hours",
    ]);
  });

  it("uses explicit projections on every public catalogue page", () => {
    expect(geornyListPage).toContain(".select(PUBLIC_JOURNEY_SELECT)");
    expect(geornyDetailPage).toContain(".select(PUBLIC_JOURNEY_SELECT)");
    expect(geornyDetailPage).toContain(".select(PUBLIC_MILESTONE_SELECT)");
    expect(coursesPage).toContain(".select(PUBLIC_RESOURCE_SELECT)");
    expect(booksPage).toContain(".select(PUBLIC_RESOURCE_SELECT)");
    for (const page of [geornyListPage, geornyDetailPage, coursesPage, booksPage]) {
      expect(page).not.toContain('.select("*")');
    }
  });

  it("does not query the unavailable milestone dependency relation", () => {
    expect(geornyDetailPage).not.toContain('.from("milestone_dependencies")');
    expect(geornyDetailPage).toContain(
      "const dependencies: Array<{ milestone_id: string; depends_on_id: string }> = [];"
    );
    expect(geornyDetailPage).toContain("dependencies={dependencies}");
    expect(geornyDetailPage).toContain("Explicit prerequisite links are not available yet.");
  });

  it("revokes broad anonymous table, sequence, and function privileges", () => {
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
    for (const role of ["postgres", "supabase_admin"]) {
      expect(migration).toMatch(
        new RegExp(
          "ALTER DEFAULT PRIVILEGES FOR ROLE " + role +
            " IN SCHEMA public\\s+REVOKE ALL ON TABLES FROM anon;",
          "i"
        )
      );
      expect(migration).toMatch(
        new RegExp(
          "ALTER DEFAULT PRIVILEGES FOR ROLE " + role +
            " IN SCHEMA public\\s+REVOKE ALL ON SEQUENCES FROM anon;",
          "i"
        )
      );
    }
  });

  it("grants anonymous SELECT only on explicit published-catalogue columns", () => {
    for (const table of ["journeys", "resources", "milestones"]) {
      expect(migration).toMatch(
        new RegExp(
          "GRANT SELECT\\s*\\([\\s\\S]*?\\)\\s*ON TABLE public\\." +
            table + " TO anon;",
          "i"
        )
      );
    }
    expect(migration).toMatch(
      /CREATE POLICY journeys_public_read_published[\s\S]*?FOR SELECT[\s\S]*?TO anon[\s\S]*?USING\s*\(is_published\s*=\s*true\)/i
    );
    expect(migration).toMatch(
      /CREATE POLICY milestones_public_read_published[\s\S]*?FOR SELECT[\s\S]*?TO anon[\s\S]*?USING\s*\([\s\S]*?j\.is_published\s*=\s*true[\s\S]*?\)/i
    );
    expect(migration).toMatch(
      /CREATE POLICY journeys_read_published_or_owned[\s\S]*?TO authenticated[\s\S]*?created_by/i
    );
    expect(migration).toMatch(
      /CREATE POLICY milestones_read_accessible_journey[\s\S]*?TO authenticated[\s\S]*?created_by/i
    );
  });

  it("verifies effective anonymous privileges across public relations", () => {
    expect(verification).toMatch(/relkind IN \('r', 'p', 'v', 'm', 'f'\)/i);
    for (const privilege of [
      "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER", "MAINTAIN",
    ]) {
      expect(verification).toContain(
        "has_table_privilege('anon', table_record.relation_oid, '" + privilege + "')"
      );
    }
    expect(verification).toMatch(/has_column_privilege\('anon'/i);
    expect(verification).toMatch(/has_sequence_privilege\('anon'/i);
    expect(verification).toMatch(/has_function_privilege\('anon'/i);
  });
});
