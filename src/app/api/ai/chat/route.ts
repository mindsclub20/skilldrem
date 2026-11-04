import { NextResponse } from "next/server";
import { completeWithFallback, listConfiguredProviders, type AIMessage } from "@/lib/ai/provider";
import { titleFromMessage } from "@/lib/ai/resource-filter";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You are SKILLDREM, a friendly and practical AI learning teammate.
You help users plan study paths, pick free vs paid resources carefully, explain concepts simply, and stay motivated.

Rules:
- Be conversational and clear — like a fast chat assistant.
- Use short paragraphs and Markdown (headings, lists, bold, links) when helpful.
- Default to FREE resources and free websites (MDN, freeCodeCamp, official docs, Khan Academy, YouTube, GitHub, OpenCourseWare, W3Schools, etc.).
- When recommending a resource, use this format for each item:
  **Title** — Platform — [FREE|FREEMIUM|PAID|UNKNOWN] — Level: beginner|intermediate|advanced
  URL: https://... (only real, known public URLs; never invent links)
  Why: one short sentence
- Never invent course prices or claim something is free without evidence. If unsure, say so and suggest how the learner can verify on the source site.
- Interactively ask about budget when it matters: e.g. "Do you want free-only resources, or is a paid course OK if it saves time?"
- Prefer actionable next steps the user can start in the next 30–60 minutes with a free resource.
- Never invent specific URLs or course names you cannot verify; prefer well-known platform names when linking is uncertain.`;

type ChatMsg = { role: "user" | "assistant"; content: string };

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
      conversationId?: string | null;
    };

    const message = body.message?.trim();
    if (!message || message.length > 8000) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    let conversationId = body.conversationId?.trim() || null;
    let existingMessages: ChatMsg[] = [];

    if (conversationId) {
      const { data: existing, error: loadErr } = await supabase
        .from("ai_sessions")
        .select("id, messages")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (loadErr) {
        return NextResponse.json({ error: loadErr.message }, { status: 500 });
      }
      if (!existing) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }
      const raw = (existing.messages ?? []) as ChatMsg[];
      existingMessages = raw.filter(
        (m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
      );
    }

    // Prefer server-side history when conversation is known; else client history (capped)
    const historySource =
      conversationId && existingMessages.length
        ? existingMessages
        : (body.history ?? [])
            .filter(
              (m) =>
                m &&
                (m.role === "user" || m.role === "assistant") &&
                typeof m.content === "string"
            )
            .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const history = historySource.slice(-20);

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

    const nextMessages: ChatMsg[] = [
      ...history,
      { role: "user", content: message },
      { role: "assistant", content: text },
    ];

    if (conversationId) {
      const { error: updErr } = await supabase
        .from("ai_sessions")
        .update({
          messages: nextMessages,
          provider,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId)
        .eq("user_id", user.id);
      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 500 });
      }
    } else {
      const title = titleFromMessage(message);
      const { data: inserted, error: insErr } = await supabase
        .from("ai_sessions")
        .insert({
          user_id: user.id,
          provider,
          session_type: "chat",
          title,
          messages: nextMessages,
        })
        .select("id")
        .single();
      if (insErr) {
        return NextResponse.json({ error: insErr.message }, { status: 500 });
      }
      conversationId = inserted.id;
    }

    return NextResponse.json({
      text,
      provider,
      conversationId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI request failed";
    const status = msg.includes("No AI API keys") ? 503 : 502;
    return NextResponse.json({ error: msg }, { status });
  }
}
