import type { AIMessage, AICompleteOptions, AIProvider } from "./types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
/** Free-tier friendly production model on Groq (Nov 2026). */
const DEFAULT_MODEL = "openai/gpt-oss-20b";

export class GroqProvider implements AIProvider {
  id = "groq" as const;
  name = "Groq";

  constructor(private apiKey: string) {}

  async complete(messages: AIMessage[], options?: AICompleteOptions): Promise<string> {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options?.model ?? DEFAULT_MODEL,
        messages,
        temperature: options?.temperature ?? 0.4,
        max_tokens: options?.maxTokens ?? 1024,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Groq error ${res.status}: ${body.slice(0, 400)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Groq returned empty content");
    return text;
  }
}
