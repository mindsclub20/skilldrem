# TEST_REPORT.md — Skilldrem

**Date:** 2026-11-08 (Master Execution 2)

| Test | Expected | Actual | Status | Evidence |
|------|----------|--------|--------|----------|
| Homepage load | Marketing content | Renders | Verified | Browser |
| Discover load | Budget UI | Renders | Verified | Browser |
| /workspace unauthenticated | Redirect login | Redirect | Verified | Browser |
| Middleware source includes workspace/georny | Protected | Present | Verified | middleware.ts |
| Progress API route exists | On main | Committed | Verified | GitHub |
| List journeys API exists | On main | Committed | Verified | GitHub |
| Migration SQL present | In repo | Committed | Verified | GitHub |
| Migration applied on prod | Table exists | Not applied | Blocked | Needs authorization |
| Live Groq call | Success | Not run | Blocked | No key |
| Live Gemini call | Success | Not run | Blocked | No key |
| Live Firecrawl | Success or degrade | Not run | Blocked | No key |
| Auth signup/login E2E | Session | Not run | Not tested | No test credentials |
| Progress restore after login | State restored | Not run | Blocked | Migration + auth |
| Unit tests resource-filter/url-safety | Pass | Present in repo | Not re-run | — |
