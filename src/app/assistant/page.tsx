"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MarkdownMessage } from "@/components/ai/MarkdownMessage";

type Msg = { role: "user" | "assistant"; content: string; provider?: string };
type ConversationMeta = {
  id: string;
  title: string | null;
  provider: string | null;
  created_at: string;
  updated_at: string;
};

const SUGGESTIONS = [
  "Teach me Python from zero with free resources only",
  "Create a robotics learning roadmap",
  "Explain machine learning simply",
  "Find free courses for web development",
  "Help me build my first project",
];

export default function AssistantPage() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferred, setPreferred] = useState<"groq" | "gemini" | "auto">("groq");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendingRef = useRef(false);
  const openedFromQuery = useRef(false);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/conversations");
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch {
      /* ignore list errors on load */
    } finally {
      setLoadingList(false);
    }
  }, []);

  const openConversation = useCallback(async (id: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/conversations?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      const msgs = (data.conversation?.messages ?? []) as Msg[];
      setMessages(msgs.filter((m) => m.role === "user" || m.role === "assistant"));
      setConversationId(id);
      setSidebarOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chat");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const c = searchParams.get("c");
    if (c && !openedFromQuery.current) {
      openedFromQuery.current = true;
      void openConversation(c);
    }
  }, [searchParams, openConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function resizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  async function deleteConversation(id: string) {
    try {
      const res = await fetch("/api/ai/conversations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      setConversations((list) => list.filter((x) => x.id !== id));
      if (conversationId === id) {
        setConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function sendMessage(text: string, opts?: { regenerate?: boolean }) {
    const trimmed = text.trim();
    if (!trimmed || loading || sendingRef.current) return;
    sendingRef.current = true;
    setInput("");
    setError(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    let baseMessages = messages;
    if (opts?.regenerate) {
      const copy = [...messages];
      if (copy.length && copy[copy.length - 1].role === "assistant") copy.pop();
      baseMessages = copy;
      setMessages(copy);
    } else {
      setMessages([...messages, { role: "user", content: trimmed }]);
    }

    setLastUserMessage(trimmed);
    setLoading(true);
    setSaving(true);
    try {
      const history = baseMessages.map(({ role, content }) => ({ role, content }));
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history,
          preferred: preferred === "auto" ? undefined : preferred,
          conversationId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      if (data.conversationId) setConversationId(data.conversationId);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.text, provider: data.provider },
      ]);
      void loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
      setSaving(false);
      sendingRef.current = false;
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
    setConversationId(null);
    setError(null);
    setInput("");
    setLastUserMessage(null);
    setSidebarOpen(false);
  }

  async function copyLastAssistant() {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last) return;
    try {
      await navigator.clipboard.writeText(last.content);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="h-[100dvh] flex bg-transparent text-foreground overflow-hidden">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[min(18rem,85vw)] border-r border-border bg-card/95 backdrop-blur-md flex flex-col transition-transform md:static md:translate-x-0 ${
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
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <p className="px-2 text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
            History
          </p>
          {loadingList && (
            <p className="px-2 text-xs text-muted-foreground">Loading…</p>
          )}
          {!loadingList && conversations.length === 0 && (
            <p className="px-2 text-xs text-muted-foreground">No saved chats yet.</p>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`group flex items-start gap-1 rounded-lg px-2 py-2 text-sm hover:bg-muted ${
                conversationId === c.id ? "bg-muted" : ""
              }`}
            >
              <button
                type="button"
                className="flex-1 text-left min-w-0"
                onClick={() => void openConversation(c.id)}
              >
                <span className="block truncate font-medium">{c.title || "Chat"}</span>
                <span className="block text-[10px] text-muted-foreground">
                  {new Date(c.updated_at).toLocaleString()}
                </span>
              </button>
              <button
                type="button"
                aria-label="Delete conversation"
                className="shrink-0 text-muted-foreground hover:text-red-600 text-xs px-1 opacity-70 group-hover:opacity-100"
                onClick={() => void deleteConversation(c.id)}
              >
                ✕
              </button>
            </div>
          ))}
          <div className="border-t border-border mt-3 pt-3 space-y-1">
            <p className="px-2 text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
              Explore
            </p>
            <Link href="/discover" className="block rounded-lg px-3 py-2 hover:bg-muted text-sm">
              Discover paths
            </Link>
            <Link href="/dashboard" className="block rounded-lg px-3 py-2 hover:bg-muted text-sm">
              Dashboard
            </Link>
          </div>
        </div>
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
        <header className="h-12 flex items-center gap-3 px-3 border-b border-border/60 shrink-0">
          <button
            type="button"
            className="md:hidden rounded-lg border border-border px-2.5 py-1.5 text-sm"
            onClick={() => setSidebarOpen(true)}
          >
            Menu
          </button>
          <span className="text-sm font-medium text-muted-foreground truncate">Learning chat</span>
          {saving && (
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Saving…</span>
          )}
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              className="text-xs rounded-lg border border-border px-2 py-1 hover:bg-muted disabled:opacity-40"
              disabled={!messages.some((m) => m.role === "assistant")}
              onClick={() => void copyLastAssistant()}
            >
              Copy
            </button>
            <button
              type="button"
              className="text-xs rounded-lg border border-border px-2 py-1 hover:bg-muted disabled:opacity-40"
              disabled={loading || !lastUserMessage}
              onClick={() =>
                lastUserMessage && void sendMessage(lastUserMessage, { regenerate: true })
              }
            >
              Regenerate
            </button>
          </div>
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
                Free resources first. Chats are saved to your account.
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
            <div className="mx-auto w-full max-w-3xl px-3 sm:px-4 py-6 space-y-6">
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
                    className={`max-w-[min(100%,42rem)] rounded-2xl px-4 py-3 ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground whitespace-pre-wrap text-[15px]"
                        : "bg-card/90 border border-border shadow-sm"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <MarkdownMessage content={m.content} />
                    ) : (
                      m.content
                    )}
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
                  {lastUserMessage && (
                    <button
                      type="button"
                      className="mt-2 block text-xs underline"
                      onClick={() => void sendMessage(lastUserMessage)}
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="border-t border-border/60 bg-background/70 backdrop-blur-md shrink-0">
          <form onSubmit={onSubmit} className="mx-auto max-w-3xl px-3 sm:px-4 py-3 sm:py-4">
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
