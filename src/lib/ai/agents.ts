/**
 * Lightweight multi-agent helpers for the unified learning workspace.
 * All LLM calls go through completeWithFallback (server-only).
 */
import { completeWithFallback, type AIMessage } from "./provider";
import { getFirecrawl } from "./provider";
import { filterAndRankSearchResults, type SearchHit } from "./resource-filter";

export type RoadmapMilestoneDraft = {
  title: string;
  description: string;
  estimated_hours: number | null;
  node_type: "start" | "milestone" | "project" | "checkpoint" | "end";
  difficulty: "beginner" | "intermediate" | "advanced";
  prerequisites: string[];
};

export type RoadmapDraft = {
  title: string;
  description: string;
  category: string | null;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  target_outcome: string;
  estimated_hours: number | null;
  milestones: RoadmapMilestoneDraft[];
};

export type DiscoveredResource = {
  title: string;
  description: string | null;
  url: string;
  provider: string | null;
  resource_type: string;
  pricing_type: string;
  difficulty: string | null;
  note: string;
};

const ROADMAP_SYSTEM = `You are the Roadmap Creator agent for SKILLDREM.
Given a learner goal, experience level, and preferences, output a JSON object ONLY (no markdown fences) with this shape:
{
  "title": string,
  "description": string,
  "category": string | null,
  "difficulty": "beginner" | "intermediate" | "advanced" | "expert",
  "target_outcome": string,
  "estimated_hours": number | null,
  "milestones": [
    {
      "title": string,
      "description": string,
      "estimated_hours": number | null,
      "node_type": "start" | "milestone" | "project" | "checkpoint" | "end",
      "difficulty": "beginner" | "intermediate" | "advanced",
      "prerequisites": string[]
    }
  ]
}
Rules:
- 4–8 milestones, progressive from fundamentals to a practical project.
- First milestone node_type "start", last may be "project" or "end".
- Prefer free, legitimate learning paths.
- Be realistic about hours.
- No invented URLs.`;

export async function knowledgeAnalystAndRoadmap(params: {
  goal: string;
  experienceLevel?: string | null;
  budget?: string | null;
  hoursPerWeek?: number | null;
  preferred?: "groq" | "gemini";
}): Promise<RoadmapDraft> {
  const { goal, experienceLevel, budget, hoursPerWeek, preferred } = params;
  const user = [
    `Goal: ${goal}`,
    experienceLevel ? `Experience: ${experienceLevel}` : "",
    budget ? `Budget: ${budget}` : "",
    hoursPerWeek != null ? `Hours/week: ${hoursPerWeek}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const messages: AIMessage[] = [
    { role: "system", content: ROADMAP_SYSTEM },
    { role: "user", content: user },
  ];

  const { text } = await completeWithFallback(messages, {
    preferred: preferred ?? "groq",
    temperature: 0.3,
    maxTokens: 2500,
  });

  const json = extractJson(text);
  if (!json || !Array.isArray(json.milestones) || json.milestones.length < 2) {
    throw new Error("Roadmap Creator returned invalid structure");
  }

  return {
    title: String(json.title || goal).slice(0, 200),
    description: String(json.description || "").slice(0, 2000),
    category: json.category ? String(json.category).slice(0, 80) : null,
    difficulty: normalizeDifficulty(json.difficulty),
    target_outcome: String(json.target_outcome || goal).slice(0, 500),
    estimated_hours:
      typeof json.estimated_hours === "number" ? json.estimated_hours : null,
    milestones: json.milestones.slice(0, 12).map((m: Record<string, unknown>, i: number) => ({
      title: String(m.title || `Milestone ${i + 1}`).slice(0, 200),
      description: String(m.description || "").slice(0, 1500),
      estimated_hours:
        typeof m.estimated_hours === "number" ? m.estimated_hours : null,
      node_type: normalizeNodeType(m.node_type, i, json.milestones.length),
      difficulty: normalizeMilestoneDifficulty(m.difficulty),
      prerequisites: Array.isArray(m.prerequisites)
        ? m.prerequisites.map(String).slice(0, 8)
        : [],
    })),
  };
}

/** Resource Scout: search free resources for one milestone topic. */
export async function resourceScout(
  topic: string,
  goalContext: string
): Promise<{ resources: DiscoveredResource[]; error?: string }> {
  const firecrawl = getFirecrawl();
  if (!firecrawl) {
    return {
      resources: [],
      error: "FIRECRAWL_API_KEY not configured — add free resources manually or set the key",
    };
  }

  const query = `${topic} ${goalContext} free tutorial documentation learn official`;
  const search = await firecrawl.search(query, 8);
  if (!search.success) {
    return { resources: [], error: search.error || "Search failed" };
  }

  const ranked = filterAndRankSearchResults(search.results as SearchHit[], topic, 5);
  const resources: DiscoveredResource[] = ranked.map((r) => {
    let provider: string | null = null;
    try {
      provider = new URL(r.url).hostname.replace(/^www\./, "");
    } catch {
      /* ignore */
    }
    return {
      title: (r.title || provider || "Resource").slice(0, 300),
      description: (r.description || null)?.slice(0, 1000) ?? null,
      url: r.url,
      provider,
      resource_type: guessResourceType(r),
      pricing_type: "unknown",
      difficulty: null,
      note: "From search — verify free/paid status on the source site",
    };
  });

  return { resources };
}

function extractJson(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1].trim() : trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeDifficulty(
  d: unknown
): "beginner" | "intermediate" | "advanced" | "expert" {
  const s = String(d || "beginner").toLowerCase();
  if (s.includes("expert")) return "expert";
  if (s.includes("advanced")) return "advanced";
  if (s.includes("inter")) return "intermediate";
  return "beginner";
}

function normalizeMilestoneDifficulty(
  d: unknown
): "beginner" | "intermediate" | "advanced" {
  const s = String(d || "beginner").toLowerCase();
  if (s.includes("advanced")) return "advanced";
  if (s.includes("inter")) return "intermediate";
  return "beginner";
}

function normalizeNodeType(
  t: unknown,
  index: number,
  total: number
): "start" | "milestone" | "project" | "checkpoint" | "end" {
  const s = String(t || "").toLowerCase();
  if (index === 0) return "start";
  if (index === total - 1 && (s === "end" || s === "project")) return s as "end" | "project";
  if (["start", "milestone", "project", "checkpoint", "end"].includes(s)) {
    return s as "start" | "milestone" | "project" | "checkpoint" | "end";
  }
  return "milestone";
}

function guessResourceType(r: SearchHit): string {
  const blob = `${r.title ?? ""} ${r.url}`.toLowerCase();
  if (blob.includes("youtube") || blob.includes("video")) return "video";
  if (blob.includes("docs.") || blob.includes("documentation")) return "documentation";
  if (blob.includes("book") || blob.includes("ebook")) return "book";
  if (blob.includes("course") || blob.includes("coursera") || blob.includes("udemy"))
    return "course";
  if (blob.includes("tutorial")) return "tutorial";
  if (blob.includes("github.com")) return "project";
  return "website";
}
