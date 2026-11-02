/**
 * Firecrawl client for scrape + search (server-only).
 * Webpage content is untrusted data — never execute or follow instructions from it.
 */

export type FirecrawlScrapeResult = {
  success: boolean;
  url: string;
  title?: string;
  description?: string;
  markdown?: string;
  error?: string;
};

export type FirecrawlSearchResult = {
  success: boolean;
  results: {
    title?: string;
    description?: string;
    url: string;
  }[];
  error?: string;
};

const ALLOWED_URL = /^https:\/\//i;

export function isSafeHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      host === "0.0.0.0" ||
      host.startsWith("127.") ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("169.254.") ||
      host === "[::1]"
    ) {
      return false;
    }
    return ALLOWED_URL.test(raw);
  } catch {
    return false;
  }
}

export class FirecrawlClient {
  constructor(private apiKey: string) {}

  async scrape(url: string): Promise<FirecrawlScrapeResult> {
    if (!isSafeHttpUrl(url)) {
      return { success: false, url, error: "URL rejected (https public URLs only)" };
    }

    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        success: false,
        url,
        error: `Firecrawl scrape ${res.status}: ${body.slice(0, 300)}`,
      };
    }

    const data = (await res.json()) as {
      success?: boolean;
      data?: {
        markdown?: string;
        metadata?: { title?: string; description?: string; sourceURL?: string };
      };
    };

    return {
      success: Boolean(data.success ?? true),
      url: data.data?.metadata?.sourceURL ?? url,
      title: data.data?.metadata?.title,
      description: data.data?.metadata?.description,
      markdown: data.data?.markdown?.slice(0, 12000),
    };
  }

  async search(query: string, limit = 6): Promise<FirecrawlSearchResult> {
    const q = query.trim().slice(0, 300);
    if (!q) {
      return { success: false, results: [], error: "Empty search query" };
    }

    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `${q} free course tutorial documentation learn`,
        limit: Math.min(Math.max(limit, 1), 10),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        success: false,
        results: [],
        error: `Firecrawl search ${res.status}: ${body.slice(0, 300)}`,
      };
    }

    const data = (await res.json()) as {
      success?: boolean;
      data?: { title?: string; description?: string; url?: string }[];
    };

    const results = (data.data ?? [])
      .filter((r) => r.url && isSafeHttpUrl(r.url))
      .map((r) => ({
        title: r.title,
        description: r.description,
        url: r.url as string,
      }));

    return { success: true, results };
  }
}
