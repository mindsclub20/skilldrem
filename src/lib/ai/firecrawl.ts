export type FirecrawlScrapeResult = {
  success: boolean;
  url: string;
  title?: string;
  description?: string;
  markdown?: string;
  error?: string;
};

export class FirecrawlClient {
  constructor(private apiKey: string) {}

  async scrape(url: string): Promise<FirecrawlScrapeResult> {
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
        error: `Firecrawl ${res.status}: ${body.slice(0, 300)}`,
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
}
