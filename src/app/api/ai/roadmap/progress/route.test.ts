import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

const route = await readFile(new URL("./route.ts", import.meta.url), "utf8");
const getHandler = route.slice(0, route.indexOf("type ProgressBody"));
const postHandler = route.slice(route.indexOf("export async function POST"));

describe("roadmap progress API ownership boundaries", () => {
  it("derives GET and POST identity from the authenticated server session", () => {
    expect(route.match(/supabase\.auth\.getUser\(\)/g) ?? []).toHaveLength(2);
    expect(route).toMatch(/if \(!user\) return NextResponse\.json\([\s\S]*?status: 401/);
    expect(postHandler).not.toMatch(/body\.user_id/);
  });

  it("loads progress only after confirming enrollment or journey ownership", () => {
    expect(getHandler).toMatch(/\.from\("user_journeys"\)[\s\S]*?\.eq\("user_id", user\.id\)[\s\S]*?\.eq\("journey_id", journeyId\)/);
    expect(getHandler).toMatch(/if \(!enrollment && journey\.created_by !== user\.id\)/);
    expect(getHandler).toMatch(/\.from\("milestones"\)[\s\S]*?\.eq\("journey_id", journeyId\)/);
    expect(getHandler).toMatch(/\.from\("user_milestone_progress"\)[\s\S]*?\.eq\("user_id", user\.id\)[\s\S]*?\.eq\("journey_id", journeyId\)/);
  });

  it("validates every submitted milestone against the selected journey", () => {
    expect(postHandler).toMatch(/\.from\("milestones"\)[\s\S]*?\.eq\("journey_id", journeyId\)/);
    expect(postHandler).toMatch(/normalizeProgressUpdates\(body, milestones\)/);
    expect(postHandler).toMatch(/if \("error" in normalized\)/);
  });

  it("writes completion rows and dashboard summaries for the authenticated owner only", () => {
    expect(postHandler).toMatch(/user_id: user\.id/);
    expect(postHandler).toMatch(/journey_id: journeyId/);
    expect(postHandler).toMatch(/\.from\("user_milestone_progress"\)\.upsert/);
    expect(postHandler).toMatch(/\.eq\("user_id", user\.id\)[\s\S]*?\.eq\("journey_id", journeyId\)/);
    expect(postHandler).toMatch(/\.from\("user_journeys"\)[\s\S]*?\.eq\("user_id", user\.id\)[\s\S]*?\.eq\("journey_id", journeyId\)/);
  });
});
