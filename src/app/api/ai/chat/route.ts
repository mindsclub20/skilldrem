import { NextResponse } from "next/server";
import { completeWithFallback, listConfiguredProviders, type AIMessage } from "@/lib/ai/provider";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You are SKILLDREM learning assistant. Help learners plan paths, explain milestones, compare free vs paid resources, and suggest next steps.
Be practical and honest about free vs paid. Never invent course prices or claim a resource is free unless the user or context says so.
Keep answers concise and structured.`;

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

    const body = (await request.json()) as {
      message?: string;
      history?: AIMessage[];
      preferred?: "groq" | "gemini";
    };

    const message = body.message?.trim();
    if (!message || message.length > 4000) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const history = (body.history ?? [])
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-12);

    const messages: AIMessage[] = [
      { role: "system", content: SYSTEM },
      ...history,
      { role: "user", content: message },
    ];

    const { text, provider } = await completeWithFallback(messages, {
      preferred: body.preferred,
      temperature: 0.4,
      maxTokens: 1200,
    });

    if (user) {
      await supabase.from("ai_sessions").insert({
        user_id: user.id,
        provider,
        session_type: "chat",
        messages: [...history, { role: "user", content: message }, { role: "assistant", content: text }],
      });
    }

    return NextResponse.json({ text, provider });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI request failed";
    const status = msg.includes("No AI API keys") ? 503 : 502;
    return NextResponse.json({ error: msg }, { status });
  }
}
