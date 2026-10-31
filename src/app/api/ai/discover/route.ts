import { NextResponse } from "next/server";
import { completeWithFallback, getFirecrawl, listConfiguredProviders } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      goal?: string;
      url?: string;
      preferred?: "groq" | "gemini";
    };

    const goal = body.goal?.trim();
    if (!goal || goal.length > 2000) {
      return NextResponse.json({ error: "Provide a learning goal" }, { status: 400 });
    }

    let scraped: { title?: string; description?: string; markdown?: string; url?: string; error?: string } | null = null;
    if (body.url?.trim()) {
      const firecrawl = getFirecrawl();
      if (!firecrawl) {
        scraped = { error: "FIRECRAWL_API_KEY not configured" };
      } else {
        try {
          const result = await firecrawl.scrape(body.url.trim());
          scraped = result;
        } catch (e) {
          scraped = { error: e instanceof Error ? e.message : "Scrape failed" };
        }
      }
    }

    const contextParts = [
      `Learner goal: ${goal}`,
      scraped?.title ? `Page title: ${scraped.title}` : "",
      scraped?.description ? `Page description: ${scraped.description}` : "",
      scraped?.markdown ? `Page content (excerpt):\n${scraped.markdown.slice(0, 6000)}` : "",
      scraped?.error ? `Scrape note: ${scraped.error}` : "",
    ].filter(Boolean);

    const { text, provider } = await completeWithFallback(
      [
        {
          role: "system",
          content: `You are SKILLDREM discovery engine. Given a learning goal (and optional page content), produce:
1) Recommended learning sequence (milestones)
2) What to learn first vs next
3) Resource types to seek (free course, docs, practice, AI mentor use)
4) Prerequisites
Do not invent specific paid prices. Label uncertainty clearly.`,
        },
        { role: "user", content: contextParts.join("\n\n") },
      ],
      { preferred: body.preferred, temperature: 0.35, maxTokens: 1500 }
    );

    return NextResponse.json({
      plan: text,
      provider,
      scrape: scraped
        ? { ok: !scraped.error, title: scraped.title, url: scraped.url, error: scraped.error }
        : null,
      configured: listConfiguredProviders(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Discovery failed";
    const status = msg.includes("No AI API keys") ? 503 : 502;
    return NextResponse.json({ error: msg }, { status });
  }
}
