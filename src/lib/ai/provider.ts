import type { AIMessage, AICompleteOptions, AIProvider, AIProviderId } from "./types";
import { GroqProvider } from "./groq";
import { GeminiProvider } from "./gemini";
import { FirecrawlClient } from "./firecrawl";

export type { AIMessage, AICompleteOptions, AIProvider, AIProviderId } from "./types";
export { FirecrawlClient } from "./firecrawl";

export function getAIProvider(preferred?: AIProviderId): AIProvider | null {
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();

  if (preferred === "groq" && groqKey) return new GroqProvider(groqKey);
  if (preferred === "gemini" && geminiKey) return new GeminiProvider(geminiKey);

  if (groqKey) return new GroqProvider(groqKey);
  if (geminiKey) return new GeminiProvider(geminiKey);
  return null;
}

export function getFirecrawl(): FirecrawlClient | null {
  const key = process.env.FIRECRAWL_API_KEY?.trim();
  if (!key) return null;
  return new FirecrawlClient(key);
}

export function listConfiguredProviders(): { llm: string[]; firecrawl: boolean } {
  const llm: string[] = [];
  if (process.env.GROQ_API_KEY?.trim()) llm.push("groq");
  if (process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()) {
    llm.push("gemini");
  }
  return { llm, firecrawl: Boolean(process.env.FIRECRAWL_API_KEY?.trim()) };
}

export async function completeWithFallback(
  messages: AIMessage[],
  options?: AICompleteOptions & { preferred?: AIProviderId }
): Promise<{ text: string; provider: string }> {
  const order: AIProviderId[] =
    options?.preferred === "gemini" ? ["gemini", "groq"] : ["groq", "gemini"];

  const errors: string[] = [];
  for (const id of order) {
    const provider = getAIProvider(id);
    if (!provider) continue;
    try {
      const text = await provider.complete(messages, options);
      return { text, provider: provider.id };
    } catch (e) {
      errors.push(`${id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  throw new Error(
    errors.length
      ? `All AI providers failed. ${errors.join(" | ")}`
      : "No AI API keys configured. Set GROQ_API_KEY and/or GEMINI_API_KEY."
  );
}
