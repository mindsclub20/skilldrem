export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIProviderId = "groq" | "gemini";

export interface AICompleteOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AIProvider {
  id: AIProviderId;
  name: string;
  complete(messages: AIMessage[], options?: AICompleteOptions): Promise<string>;
}
