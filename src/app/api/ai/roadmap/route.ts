import { NextResponse } from "next/server";
import { completeWithFallback, type AIMessage } from "@/lib/ai/provider";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 90;

const ROADMAP_SYSTEM = `You are SKILLDREM Roadmap Architect — an expert learning path designer for self-learners, especially students in India and globally.

Your job: given a learning goal and the user's current knowledge level, produce a practical, realistic, personalized roadmap as STRICT JSON (no markdown, no commentary outside the JSON).

OUTPUT FORMAT (valid JSON only):
{
  "title": "string - short roadmap title",
  "description": "string - 1-2 sentence overview",
  "target_outcome": "string - what the learner can do at the end",
  "difficulty": "beginner|intermediate|advanced",
  "estimated_hours": number,
  "category": "string",
  "stages": [
    {
      "name": "string - stage name e.g. Foundations",
      "milestones": [
        {
          "title": "string",
          "description": "string - what and why",
          "estimated_hours": number,
          "node_type": "milestone|project|checkpoint",
          "prerequisites": ["string"],
          "topics": ["string"],
          "practice": "string - concrete exercise or project idea",
          "resources_hint": ["string - suggested resource types or well-known free platforms, no invented URLs"]
        }
      ]
    }
  ],
  "career_paths": ["string"],
  "next_steps_after": "string"
}

RULES:
- Make it personalized to the stated experience level. Do not give the same generic path to beginners and intermediates.
- Prefer free, high-quality resources (official docs, freeCodeCamp, MDN, Khan Academy, YouTube channels like freeCodeCamp, CS50, official Arduino docs, etc.). Never invent specific course URLs.
- Keep total estimated hours realistic (e.g. 80-200h for a career pivot, not 2000h).
- Include practical projects at each stage.
- 4-7 milestones total is ideal for focus. Break into 2-4 stages.
- Use clear, motivating language.
- Output ONLY the JSON object. No code fences, no extra text.`;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = (await request.json()) as {
      goal?: string;
      experience_level?: string;
      available_hours_per_week?: number;
      budget_preference?: string;
      current_knowledge?: string;
      preferred?: "groq" | "gemini";
    };

    const goal = body.goal?.trim();
    if (!goal || goal.length < 5 || goal.length > 500) {
      return NextResponse.json({ error: "Provide a clear learning goal (5-500 chars)" }, { status: 400 });
    }

    // Load user preferences for personalization
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const experience = body.experience_level || prefs?.experience_level || "beginner";
    const hours = body.available_hours_per_week ?? prefs?.available_hours_per_week ?? 10;
    const budget = body.budget_preference || prefs?.budget_preference || "free_preferred";
    const knowledge = body.current_knowledge?.trim() || "Not specified";

    const userPrompt = `Learning goal: ${goal}

Current experience level: ${experience}
Self-reported current knowledge: ${knowledge}
Available hours per week: ${hours}
Budget preference: ${budget}

Generate a personalized, practical roadmap. Focus on free resources first. Include concrete projects.`;

    const messages: AIMessage[] = [
      { role: "system", content: ROADMAP_SYSTEM },
      { role: "user", content: userPrompt },
    ];

    const { text, provider } = await completeWithFallback(messages, {
      preferred: body.preferred,
      temperature: 0.3,
      maxTokens: 3500,
    });

    // Extract JSON (handle possible code fences)
    let jsonStr = text.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();
    const firstBrace = jsonStr.indexOf("{");
    const lastBrace = jsonStr.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
    }

    let roadmap: Record<string, unknown>;
    try {
      roadmap = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again.", raw: text.slice(0, 500), provider },
        { status: 502 }
      );
    }

    // Basic validation
    if (!roadmap.title || !Array.isArray(roadmap.stages)) {
      return NextResponse.json(
        { error: "Incomplete roadmap structure from AI", provider },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      roadmap,
      provider,
      meta: { experience, hours, budget },
    });
  } catch (err) {
    console.error("[roadmap]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Roadmap generation failed" },
      { status: 500 }
    );
  }
}
