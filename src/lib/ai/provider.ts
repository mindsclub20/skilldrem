/**
 * Provider-independent AI abstraction.
 * Live API credentials are out of scope for this phase.
 * Swap implementations without rewriting the app.
 */

export type AIMessage = { role: "system" | "user" | "assistant"; content: string };

export interface AIProvider {
  id: string;
  name: string;
  complete(messages: AIMessage[], options?: { temperature?: number }): Promise<string>;
}

/** Placeholder — returns structured guidance, not live model output */
export class StubAIProvider implements AIProvider {
  id = "stub";
  name = "Stub (no live API)";
  async complete(messages: AIMessage[]): Promise<string> {
    const last = messages.filter((m) => m.role === "user").pop()?.content ?? "";
    return [
      "AI provider is not configured with live credentials.",
      "This is the integration interface for future providers (OpenAI, Anthropic, Grok, etc.).",
      "",
      `Your request: ${last.slice(0, 200)}`,
      "",
      "Suggested next steps:",
      "1. Review prerequisites for your goal",
      "2. Pick a free or free-audit course",
      "3. Attach an AI mentor for explanations",
      "4. Track progress inside a Georny",
    ].join("\n");
  }
}

let active: AIProvider = new StubAIProvider();

export function setAIProvider(provider: AIProvider) {
  active = provider;
}

export function getAIProvider(): AIProvider {
  return active;
}
