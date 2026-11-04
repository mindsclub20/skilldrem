import { NextResponse } from "next/server";
import { completeWithFallback, listConfiguredProviders, type AIMessage } from "@/lib/ai/provider";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You are SKILLDREM, a friendly and practical AI learning teammate.
You help users plan study paths, pick free vs paid resources carefully, explain concepts simply, and stay motivated.

Rules:
- Be conversational and clear — like a fast chat assistant.
- Use short paragraphs and bullet lists when helpful.
- Default to FREE resources and free websites (MDN, freeCodeCamp, official docs, Khan Academy, YouTube, GitHub, OpenCourseWare, W3Schools, etc.).
- When suggesting a path, always include a "Free websites & platforms" style list and mark FREE / PAID / FREEMIUM / UNKNOWN.
- Never invent course prices or claim something is free without evidence. If unsure, say so and suggest how the learner can verify on the source site.
- Interactively ask about budget when it matters: e.g. "Do you want free-only resources, or is a paid course OK if it saves time?"
- Prefer actionable next steps the user can start in the next 30–60 minutes with a free resource.
- Never invent specific URLs or course names you cannot verify; prefer well-known platform names when linking is uncertain.`;

export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: listConfiguredProviders(),
  });
}

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
      message?: string;
      history?: AIMessage[];
      preferred?: "groq" | "gemini";
    };

    const message = body.message?.trim();
    if (!message || message.length > 8000) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const history = (body.history ?? [])
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-20);

    const messages: AIMessage[] = [
      { role: "system", content: SYSTEM },
      ...history,
      { role: "user", content: message },
    ];

    const { text, provider } = await completeWithFallback(messages, {
      preferred: body.preferred ?? "groq",
      temperature: 0.5,
      maxTokens: 2048,
    });

    await supabase.from("ai_sessions").insert({
      user_id: user.id,
      provider,
      session_type: "chat",
      messages: [...history, { role: "user", content: message }, { role: "assistant", content: text }],
    });

    return NextResponse.json({ text, provider });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI request failed";
    const status = msg.includes("No AI API keys") ? 503 : 502;
    return NextResponse.json({ error: msg }, { status });
  }
}
