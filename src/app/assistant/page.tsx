"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Msg = { role: "user" | "assistant"; content: string; provider?: string };

const SUGGESTIONS = [
  "Build me a free-only 4-week plan to learn Python from zero",
  "What free websites and resources should I use for web development?",
  "Explain React hooks simply with free practice links",
  "Free path vs paid course — which is better for junior developer interviews?",
];

export default function AssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferred, setPreferred] = useState<"groq" | "gemini" | "auto">("groq");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function resizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setError(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const nextHistory: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextHistory);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: nextHistory.map(({ role, content }) => ({ role, content })),
          preferred: preferred === "auto" ? undefined : preferred,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.text, provider: data.provider },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  function newChat() {
    setMessages([]);
    setError(null);
    setInput("");
    setSidebarOpen(false);
  }

  return (
    <div className="h-[100dvh] flex bg-transparent text-foreground">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-card/95 backdrop-blur-md flex flex-col transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-3 border-b border-border flex items-center justify-between gap-2">
          <Link href="/" className="font-semibold text-sm tracking-tight">
            SKILLDREM
          </Link>
          <button
            type="button"
            onClick={newChat}
            className="text-xs rounded-lg border border-border px-2.5 py-1.5 hover:bg-muted transition-colors"
          >
            New chat
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-sm">
          <p className="px-2 text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Explore</p>
          <Link href="/discover" className="block rounded-lg px-3 py-2 hover:bg-muted">
            Discover paths
          </Link>
          <Link href="/georny" className="block rounded-lg px-3 py-2 hover:bg-muted">
            Geornies
          </Link>
          <Link href="/courses" className="block rounded-lg px-3 py-2 hover:bg-muted">
            Courses
          </Link>
          <Link href="/dashboard" className="block rounded-lg px-3 py-2 hover:bg-muted">
            Dashboard
          </Link>
        </nav>
        <div className="p-3 border-t border-border">
          <label className="block text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 px-1">
            Model
          </label>
          <select
            value={preferred}
            onChange={(e) => setPreferred(e.target.value as typeof preferred)}
            className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm"
          >
            <option value="groq">Groq (primary)</option>
            <option value="gemini">Gemini</option>
            <option value="auto">Auto fallback</option>
          </select>
          <form action="/auth/logout" method="post" className="mt-3">
            <button
              type="submit"
              className="w-full text-left text-sm rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-12 flex items-center gap-3 px-3 border-b border-border/60 md:border-none">
          <button
            type="button"
            className="md:hidden rounded-lg border border-border px-2.5 py-1.5 text-sm"
            onClick={() => setSidebarOpen(true)}
          >
            Menu
          </button>
          <span className="text-sm font-medium text-muted-foreground">Learning chat</span>
        </header>

        <div className="flex-1 overflow-y-auto">
          {!messages.length && !loading ? (
            <div className="min-h-full flex flex-col items-center justify-center px-4 pb-24 pt-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-lg font-bold shadow-lg shadow-primary/20">
                S
              </div>
              <h1 className="mt-5 text-2xl sm:text-3xl font-semibold tracking-tight text-center">
                What do you want to learn?
              </h1>
              <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
                Chat with SKILLDREM — free resources first. Ask for plans, free websites, or whether paid is worth it.
              </p>
              <div className="mt-8 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void sendMessage(s)}
                    className="rounded-xl border border-border bg-card/80 backdrop-blur px-4 py-3 text-left text-sm hover:border-accent/50 hover:bg-card transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-3xl px-4 py-6 space-y-6">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.role === "assistant" && (
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                      S
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card/90 border border-border shadow-sm"
                    }`}
                  >
                    {m.content}
                    {m.provider && m.role === "assistant" && (
                      <p className="mt-2 text-[10px] uppercase tracking-wider opacity-50">
                        {m.provider}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 items-center text-sm text-muted-foreground">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary text-xs font-bold">
                    S
                  </div>
                  <span className="animate-pulse">Thinking…</span>
                </div>
              )}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 text-red-700 dark:text-red-300 text-sm px-4 py-3">
                  {error}
                  {error.includes("API") && (
                    <p className="mt-1 text-xs opacity-80">
                      Check that GROQ_API_KEY (and optional GEMINI_API_KEY) are set on Vercel.
                    </p>
                  )}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="border-t border-border/60 bg-background/70 backdrop-blur-md">
          <form
            onSubmit={onSubmit}
            className="mx-auto max-w-3xl px-3 sm:px-4 py-3 sm:py-4"
          >
            <div className="rounded-2xl border border-border bg-card shadow-sm focus-within:ring-2 focus-within:ring-ring/40 transition-shadow">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  resizeTextarea();
                }}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Message SKILLDREM…"
                disabled={loading}
                className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-[15px] focus:outline-none placeholder:text-muted-foreground disabled:opacity-60"
              />
              <div className="flex items-center justify-between px-3 pb-3">
                <p className="text-[11px] text-muted-foreground hidden sm:block">
                  Enter to send · Shift+Enter for new line
                </p>
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="ml-auto rounded-xl bg-primary text-primary-foreground text-sm font-medium px-4 py-2 disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  {loading ? "…" : "Send"}
                </button>
              </div>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              AI can make mistakes. Verify free/paid resources on the source site.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
