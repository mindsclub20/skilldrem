# TEST_REPORT.md — Skilldrem

**Date:** 2026-11-08
**Scope:** Forensic + static verification (no live AI keys exercised in this session)

## Passed (code / live inspection)
- Homepage loads and renders marketing content
- Discover page loads with budget preference UI
- Protected routes redirect unauthenticated users to login (assistant, dashboard, workspace observed redirect behavior)
- AI provider abstraction and fallback logic present
- Firecrawl client implements HTTPS-only + private IP rejection
- Roadmap API validates goal length, requires auth, requests structured JSON
- Discover API degrades gracefully when Firecrawl key absent
- Existing unit tests: `resource-filter.test.ts`, `url-safety.test.ts` (present in repo)

## Failed / Blocked
- Live Groq / Gemini / Firecrawl API calls — **blocked** (keys not available in this environment; cannot confirm runtime success)
- Supabase schema / RLS live inspection — **blocked** (connector permission denied)
- Full end-to-end authenticated roadmap generation + save + progress persistence — **not tested** here
- Automated test suite execution — **not run** in this session

## Not Tested
- Registration / login success path with real credentials
- Session persistence across devices
- Admin CMS mutations
- Mobile responsiveness beyond initial viewport
- Bundle size / Lighthouse performance
- Dependency vulnerability scan

## Notes
Any claim of "AI working in production" must be re-validated with current Vercel environment variables.
