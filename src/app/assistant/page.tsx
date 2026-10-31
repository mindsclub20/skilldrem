"use client";

import { useState } from "react";
import Link from "next/link";

type Msg = { role: "user" | "assistant"; content: string; provider?: string };

export default function AssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferred, setPreferred] = useState<"groq" | "gemini" | "auto">("auto");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    const nextHistory = [...messages, { role: "user" as const, content: text }];
    setMessages(nextHistory);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: nextHistory.map(({ role, content }) => ({ role, content })),
          preferred: preferred === "auto" ? undefined : preferred,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMessages((m) => [...m, { role: "assistant", content: data.text, provider: data.provider }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-40">
        <div className="mx-auto max-w-3xl h-14 flex items-center justify-between px-4">
          <Link href="/" className="font-semibold">SKILLDREM</Link>
          <div className="flex items-center gap-3 text-sm">
            <label className="text-muted-foreground flex items-center gap-2">
              Model
              <select
                value={preferred}
                onChange={(e) => setPreferred(e.target.value as typeof preferred)}
                className="rounded-lg border border-border bg-card px-2 py-1"
              >
                <option value="auto">Auto (Groq → Gemini)</option>
                <option value="groq">Groq</option>
                <option value="gemini">Gemini</option>
              </select>
            </label>
            <Link href="/discover" className="text-muted-foreground hover:text-foreground">Discover</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-6 flex flex-col">
        <h1 className="text-xl font-bold">Learning assistant</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Powered by Groq and/or Google Gemini free-tier keys. Keys stay on the server.
        </p>

        <div className="mt-6 flex-1 space-y-4 min-h-[40vh]">
          {!messages.length && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
              Ask about prerequisites, study plans, or how to use a free course path.
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                m.role === "user" ? "bg-primary text-primary-foreground ml-8" : "bg-card border border-border mr-8"
              }`}
            >
              {m.content}
              {m.provider && (
                <p className="mt-2 text-[10px] uppercase tracking-wide opacity-60">via {m.provider}</p>
              )}
            </div>
          ))}
          {loading && <p className="text-sm text-muted-foreground">Thinking…</p>}
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <form onSubmit={send} className="mt-4 flex gap-2 pb-6">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What should I learn first for…?"
            className="flex-1 h-12 rounded-xl border border-border bg-card px-4 focus:ring-2 focus:ring-ring focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-12 rounded-xl bg-accent px-5 font-medium text-accent-foreground disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </main>
    </div>
  );
}
