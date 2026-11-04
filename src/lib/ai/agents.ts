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

export type PracticeQuestion = {
  id: string;
  type: "multiple_choice" | "short_answer" | "coding";
  prompt: string;
  options?: string[];
  /** Index into options for MCQ; model answer for short/coding */
  correctAnswer: string;
  explanation: string;
  difficulty: "beginner" | "intermediate" | "advanced";
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

const PRACTICE_SYSTEM = `You are the Practice Coach for SKILLDREM.
Generate a short practice set as JSON ONLY (no markdown fences):
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice" | "short_answer" | "coding",
      "prompt": string,
      "options": string[] (required for multiple_choice, 3–5 options),
      "correctAnswer": string (for MCQ: exact option text; for others: model answer),
      "explanation": string,
      "difficulty": "beginner" | "intermediate" | "advanced"
    }
  ]
}
Rules:
- 3–5 questions mixed types when the topic allows coding; otherwise MCQ + short answer.
- Match the given difficulty and milestone topic.
- Explanations must teach, not only reveal the answer.
- No external URLs required.`;

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
    const pricing = guessPricingType(r.url, r.title, r.description);
    return {
      title: (r.title || provider || "Resource").slice(0, 300),
      description: (r.description || null)?.slice(0, 1000) ?? null,
      url: r.url,
      provider,
      resource_type: guessResourceType(r),
      pricing_type: pricing.type,
      difficulty: null,
      note: pricing.note,
    };
  });

  return { resources };
}

export async function generatePracticeSet(params: {
  topic: string;
  description?: string | null;
  difficulty?: string | null;
  preferred?: "groq" | "gemini";
}): Promise<PracticeQuestion[]> {
  const { topic, description, difficulty, preferred } = params;
  const messages: AIMessage[] = [
    { role: "system", content: PRACTICE_SYSTEM },
    {
      role: "user",
      content: [
        `Topic: ${topic}`,
        description ? `Context: ${description}` : "",
        `Difficulty: ${difficulty || "beginner"}`,
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];

  const { text } = await completeWithFallback(messages, {
    preferred: preferred ?? "groq",
    temperature: 0.4,
    maxTokens: 2000,
  });

  const json = extractJson(text);
  const raw = Array.isArray(json?.questions) ? json!.questions : null;
  if (!raw || raw.length < 1) {
    throw new Error("Practice generator returned invalid structure");
  }

  return raw.slice(0, 6).map((q: Record<string, unknown>, i: number) => {
    const type =
      q.type === "coding" || q.type === "short_answer" || q.type === "multiple_choice"
        ? q.type
        : "short_answer";
    const options = Array.isArray(q.options)
      ? q.options.map(String).slice(0, 6)
      : undefined;
    return {
      id: String(q.id || `q${i + 1}`).slice(0, 32),
      type,
      prompt: String(q.prompt || "Practice question").slice(0, 2000),
      options: type === "multiple_choice" ? options : undefined,
      correctAnswer: String(q.correctAnswer || "").slice(0, 2000),
      explanation: String(q.explanation || "").slice(0, 2000),
      difficulty: normalizeMilestoneDifficulty(q.difficulty),
    } as PracticeQuestion;
  });
}

/** Known hosts that are generally free educational content — never over-claim. */
export function guessPricingType(
  url: string,
  title?: string | null,
  description?: string | null
): { type: string; note: string } {
  const host = (() => {
    try {
      return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      return "";
    }
  })();
  const blob = `${title ?? ""} ${description ?? ""}`.toLowerCase();

  const freeHosts =
    /^(developer\.mozilla\.org|mdn\.|docs\.python\.org|react\.dev|nodejs\.org|typescriptlang\.org|freecodecamp\.org|khanacademy\.org|ocw\.mit\.edu|cs50\.harvard\.edu|web\.mit\.edu|github\.com|gitlab\.com|wikipedia\.org|w3schools\.com|devdocs\.io|learn\.microsoft\.com|cloud\.google\.com\/.*\/docs)/i;

  if (
    freeHosts.test(host) ||
    host.endsWith(".edu") ||
    host.includes("freecodecamp") ||
    host.includes("khanacademy") ||
    host.includes("mozilla.org")
  ) {
    return {
      type: "completely_free",
      note: "Likely free educational content (known open/docs host) — still verify on the site",
    };
  }

  if (host.includes("youtube.com") || host === "youtu.be") {
    return {
      type: "completely_free",
      note: "YouTube video — free to watch (ads may appear); verify channel/content",
    };
  }

  if (host.includes("coursera.org") || host.includes("edx.org")) {
    return {
      type: "free_audit",
      note: "Platform often offers free audit — certificate or graded tracks may be paid",
    };
  }

  if (host.includes("udemy.com") || host.includes("pluralsight.com")) {
    return {
      type: "paid",
      note: "Typically paid platform — do not assume free access",
    };
  }

  if (/\bfree\b/.test(blob) && !/\b(premium|paid|subscribe)\b/.test(blob)) {
    return {
      type: "unknown",
      note: "Snippet mentions free — verify free/paid status on the source site",
    };
  }

  return {
    type: "unknown",
    note: "From search — verify free/paid status on the source site",
  };
}

export function extractJson(text: string): Record<string, unknown> | null {
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
