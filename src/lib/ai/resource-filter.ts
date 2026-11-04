import { isSafeHttpUrl } from "./firecrawl";

export type SearchHit = {
  title?: string;
  description?: string;
  url: string;
};

const ERROR_FRAGMENT =
  /\b401\b|unauthorized|access denied|sign in to continue|captcha|error code|page not found|404 not found/i;

const LOW_VALUE_HOST =
  /^(www\.)?(pinterest\.|tiktok\.|instagram\.|facebook\.|twitter\.|x\.com|reddit\.com)/i;

/** Prefer docs and reputable learning hosts when ranking. */
const AUTHORITY_BONUS: { re: RegExp; score: number }[] = [
  { re: /\.(gov|edu)(\/|$)/i, score: 30 },
  { re: /(docs\.|developer\.|learn\.)/i, score: 25 },
  { re: /(freecodecamp|khanacademy|mdn|w3schools|coursera|edx|mit\.edu|ocw\.|github\.com|youtube\.com\/(@|c\/|channel))/i, score: 20 },
  { re: /(python\.org|react\.dev|nodejs\.org|typescriptlang|mozilla\.org)/i, score: 22 },
];

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function scoreHit(h: SearchHit, goal: string): number {
  let score = 0;
  const host = hostOf(h.url);
  const blob = `${h.title ?? ""} ${h.description ?? ""}`.toLowerCase();
  const g = goal.toLowerCase();

  if (!isSafeHttpUrl(h.url)) return -1000;
  if (ERROR_FRAGMENT.test(blob)) return -500;
  if (LOW_VALUE_HOST.test(host)) score -= 15;

  for (const { re, score: s } of AUTHORITY_BONUS) {
    if (re.test(h.url) || re.test(blob)) score += s;
  }

  // Token overlap with goal
  const tokens = g.split(/\W+/).filter((t) => t.length > 2);
  for (const t of tokens) {
    if (blob.includes(t)) score += 3;
  }

  if (/\bfree\b|\btutorial\b|\bdocumentation\b|\blearn\b/i.test(blob)) score += 5;
  if (/\b(buy|pricing|subscribe now|premium only)\b/i.test(blob)) score -= 2;

  return score;
}

/** Dedupe by hostname+path, drop unsafe/error hits, rank by relevance. */
export function filterAndRankSearchResults(
  results: SearchHit[],
  goal: string,
  limit = 8
): SearchHit[] {
  const seen = new Set<string>();
  const cleaned: { hit: SearchHit; score: number }[] = [];

  for (const r of results) {
    if (!r?.url || !isSafeHttpUrl(r.url)) continue;
    const desc = r.description ?? "";
    const title = r.title ?? "";
    if (ERROR_FRAGMENT.test(title) || ERROR_FRAGMENT.test(desc)) continue;

    let key = r.url;
    try {
      const u = new URL(r.url);
      key = `${u.hostname}${u.pathname}`.replace(/\/$/, "");
    } catch {
      /* keep raw */
    }
    if (seen.has(key)) continue;
    seen.add(key);

    const score = scoreHit(r, goal);
    if (score < -50) continue;
    cleaned.push({ hit: r, score });
  }

  cleaned.sort((a, b) => b.score - a.score);
  return cleaned.slice(0, limit).map((c) => c.hit);
}

export function titleFromMessage(content: string): string {
  const t = content.replace(/\s+/g, " ").trim();
  if (!t) return "New chat";
  return t.length > 60 ? `${t.slice(0, 57)}…` : t;
}
