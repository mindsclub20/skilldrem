import type { AIMessage, AICompleteOptions, AIProvider } from "./types";

/** Current free-tier Gemini flash model (Nov 2026). */
const DEFAULT_MODEL = "gemini-3.8-flash";

export class GeminiProvider implements AIProvider {
  id = "gemini" as const;
  name = "Google Gemini";

  constructor(private apiKey: string) {}

  async complete(messages: AIMessage[], options?: AICompleteOptions): Promise<string> {
    const model = options?.model ?? DEFAULT_MODEL;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n");
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    if (system && contents.length > 0 && contents[0].role === "user") {
      contents[0] = {
        role: "user",
        parts: [{ text: `${system}\n\n${contents[0].parts[0].text}` }],
      };
    } else if (system) {
      contents.unshift({ role: "user", parts: [{ text: system }] });
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: options?.temperature ?? 0.4,
          maxOutputTokens: options?.maxTokens ?? 1024,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Gemini error ${res.status}: ${body.slice(0, 400)}`);
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
    if (!text) throw new Error("Gemini returned empty content");
    return text;
  }
}
