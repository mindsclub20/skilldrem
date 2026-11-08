# CHANGELOG.md — Skilldrem

## 2026-11-08 — Forensic audit & documentation recovery (Grok)
- Inspected live production site and full repository tree.
- Recovered architecture, routes, AI provider design, Firecrawl integration, and data model from source.
- Created PROJECT_MEMORY.md, PROJECT_STATUS.md, ARCHITECTURE.md, INTEGRATION_REGISTRY.md, TEST_REPORT.md, and this CHANGELOG.
- Identified middleware protection gap for `/workspace` and client-only progress state.
- No production deployment performed; no secrets modified.

## Prior (from README / commits)
- Initial foundation: Next.js 15 + Supabase + Groq/Gemini + Firecrawl.
- Auth, onboarding, dashboard, discover, assistant, workspace, Georny, content pages, admin CMS.
- Structured roadmap generation + save to journeys/milestones.
- RLS on ai_sessions.
