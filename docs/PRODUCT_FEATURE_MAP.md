# Skilldrem product feature map

This document maps the full product requirements to **current implementation status** on the codebase. It does not invent live analytics or claim unfinished features are done.

## Roles

| Role | Status | Notes |
|------|--------|--------|
| Learner | Partial | Auth, onboarding, discover, sprint, workspace, georny, assistant exist |
| Administrator | Partial | `/admin` shell + profile `is_admin`; full CMS CRUD incomplete |
| Content contributor | Not built | Optional later |

## Public pages

| Page | Status | Route |
|------|--------|-------|
| Home | Present | `/` |
| About | Present (this branch) | `/about` |
| Explore | Present (this branch) | `/explore` |
| Courses / Books / Mentors | Present | `/courses`, `/books`, `/mentors` |
| Resource detail | Partial | Linked out to external URLs; dedicated detail page TBD |
| Learning path (Georny) | Partial | `/georny`, `/georny/[id]` |
| Pricing | Not required yet | No paid Skilldrem product |
| Login / signup | Present | `/auth/*` |
| Privacy / Terms | Baseline stubs (this branch) | `/privacy`, `/terms` |

## Authenticated app

| Area | Status |
|------|--------|
| Dashboard | Present (`/dashboard`) — deepen goal/sprint widgets |
| Goal setup / onboarding | Present (`/onboarding`) |
| Georny roadmap | Present (React Flow) |
| Learning Sprint | Present (`/sprint`) — session-local check-ins |
| Mission detail | Partial inside sprint/workspace |
| Resource library | Partial via courses/books/discover |
| AI Mentor | Present (`/assistant`) — expand modes |

## AI

| Capability | Status |
|------------|--------|
| Roadmap generation | Present (`/api/ai/roadmap`) |
| Discovery / free-first plan | Present (`/api/ai/discover`) |
| Chat mentor | Present (`/api/ai/chat`) |
| Rate limits / report AI | Not fully built |

## Content model

Resources, journeys, milestones exist in Supabase types. Full tag/category/contributor workflow is incomplete. Verified static catalogue used when DB is empty (feature branches).

## MVP focus (do next)

1. Stable auth (Authgear PR or current auth) + account deletion path  
2. Non-empty resource library in production  
3. Sprint + progress persistence  
4. One polished Georny experience  
5. Admin content publish path  
6. Privacy/terms legal review  

## Explicitly later

Adaptive roadmaps, certificates, community, mobile apps, paid subscriptions, push campaigns — after MVP is reliable.
