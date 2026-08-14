---
name: product-spec
description: Complete product, architecture, data-model, API and UX specification for the SuperlativeBridge workforce-to-income platform. Consult before adding features, tables, endpoints or pages.
---

# SuperlativeBridge — Product Spec

## 1. Product

SuperlativeBridge is a workforce-to-income platform (successor to mesirat.org) that moves people
from **skills → certification → income**: training (LMS), government programs & grants, mentorship,
an entrepreneurship/marketplace track, a community hub, and an employer-facing candidate pipeline.

### Roles
| Role | Home | Can do |
| --- | --- | --- |
| `admin` | `/admin` | Manage courses, categories, mentors, users, settings; view platform stats |
| `student` / GIG worker | `/student` | Browse & enroll in courses, track progress/XP, save courses, book mentors, programs, community |
| `employer` | `/employer/search` | Search candidates, view candidate profiles, analytics + CSV exports |
| `mentor` | `/student` (+ mentor tools) | Offer sessions, manage bookings/availability |

Roles are stored server-side on the user record and enforced in handlers (403 on mismatch);
the frontend mirrors them with `ProtectedRoute`, which redirects a signed-in user with the wrong
role to their own dashboard (never to home) and anonymous users to `/signin`.

## 2. Architecture

```text
React (S3 + CloudFront + ACM)     Go Lambdas (API Gateway + Cognito)      RDS Postgres
  src/lib/api.ts ── Bearer JWT ──► handlers + middleware ── pgx ────────► migrations 001–007
  Cognito Hosted UI / local JWT     VPC private ENIs                      Secrets Manager DSN
```

- Local: Docker Compose (`cmd/localserver` + Postgres). Prod: GitHub Actions → `infra/` + SAM.
- Auth: Amazon Cognito User Pool in AWS; local `JWT_SECRET` HS256 for Docker; dual verify in `internal/auth`.
- IaC: `infra/root.yaml` (VPC/RDS/Cognito/S3/CloudFront/ACM/WAF) + `backend/template.yaml` (Lambdas).
- LMS middleware: `POST /api/lms/courses/import`, webhooks, sync jobs (`internal/handlers/lms` + `internal/middleware`).
- Diagram: [`docs/architecture.md`](../../../docs/architecture.md).
- Pipeline: [`.github/workflows/deploy.yml`](../../../.github/workflows/deploy.yml).

Full details in the architecture doc.

## 3. Data model (`backend/migrations`)

`001_init.sql` — categories, users, skills, courses, modules, quizzes, mentors, enrollments,
certifications, notifications, programs, visa_programs, marketplace_entries, community_posts,
community_events, community_groups, entrepreneurship_tracks, entrepreneurship_resources, candidates.
`002_seed.sql` — full demo dataset (users, courses, mentors, programs, candidates…).
`003_features.sql` — `saved_courses`, `mentor_bookings` (+ seed rows).
`004_enrichment.sql` — `platform_settings`, course photos, extra GIG workers/employers,
staggered registrations, enrollments, bookings, admin notifications.
`005_audit_and_indexes.sql` — audit columns (`created_at`, `updated_at`, `created_by`,
`updated_by`, `deleted_at`) on every table, `audit_log` + triggers, scalability indexes.
`006_course_content_and_integrations.sql` — sample Healthcare + Python courses; integrations pipelines.
`007_lms_integration.sql` — LMS providers (Salesforce, Moodle, Canvas, Workday Learning),
`lms_external_courses`, `lms_sync_jobs` for third-party course import and webhooks.

Rules: every new public table ships with GRANTs in the same migration; migrations are additive and
numbered; seed data lives in the migration folder so Docker auto-loads it on first boot.

## 4. API (v1.1) — `docs/api-contract.md`, spec at `public/openapi.json`

- `GET /api/health` — Postgres connectivity + JWT sign/verify roundtrip
- Courses: `GET/POST /api/courses`, `GET/PUT/DELETE /api/courses/{id}` (filters: `search`, `category`, `language`, `level`, `vertical`, `page`, `pageSize`)
- Categories, Mentors, Users: full CRUD (`/api/categories`, `/api/mentors`, `/api/users`)
- User sub-resources: `/api/users/{id}/{enrollments|certifications|notifications|dashboard|saved-courses|mentor-bookings}`
- Enrollments: `POST /api/enrollments`, `PATCH|DELETE /api/enrollments/{id}` (progress + XP)
- Saved courses: `POST /api/saved-courses`, `DELETE /api/saved-courses/{courseId}`
- Mentor bookings: `POST /api/mentor-bookings`, `PATCH /api/mentor-bookings/{id}`, `GET /api/mentors/{id}/availability`
- Employer: `GET /api/employer/analytics`, `GET /api/employer/analytics/export` (CSV)
- Auth: `POST /api/auth/signin`, `POST /api/auth/signup`
- Content: `/api/programs`, `/api/programs/{id}`, `/api/visa-programs`, `/api/marketplace`, `/api/community`, `/api/entrepreneurship`
- Candidates: `/api/candidates`, `/api/candidates/{id}`; Admin: `/api/admin/stats`,
  `/api/admin/user-analytics`, `/api/admin/mentor-analytics`, `/api/admin/notifications`
- Settings: `GET/PUT /api/settings`; user/mentor detail analytics under `/api/users/{id}/analytics`
  and `/api/mentors/{id}/analytics`
- Learning: `POST /api/quiz-attempts`; enrollments include `completedModuleIds` and `quizAttempts`
- Integrations: `GET /api/integrations`, `GET /api/integrations/{id}`,
  `POST /api/integrations/pipelines/{id}/run`
- LMS middleware: `GET /api/lms/providers`, `POST /api/lms/courses/import` (API key),
  `POST /api/lms/webhooks/{provider}` (HMAC), `POST /api/lms/providers/{provider}/sync`,
  `GET /api/lms/jobs`; auth config `GET /api/auth/cognito-config`

No hardcoded data in the frontend — every screen reads from these endpoints via React Query hooks.

## 5. Screens (`src/App.tsx`)

Public: `/` (hero + landing), `/signin`, `/signup`, `/courses`, `/courses/:id`, `/programs`,
`/visa-programs`, `/entrepreneurship`, `/community`, `/marketplace`, `/system/api-docs`.
Learner: `/student`, `/courses/my`, `/mentors/book`, `/profile`.
Employer: `/employer/search`, `/employer/candidate/:id`, `/employer/analytics`.
Admin: `/admin` plus users (and `/admin/users/:id` analytics), courses (new/edit),
categories, mentors (and `/admin/mentors/:id` analytics), integrations (`/admin/integrations`),
audit (`/admin/audit`), settings. Course detail (`/courses/:id`) has Overview / Modules (video +
text) / Quizzes / Progress for sample courses.

`/system/api-docs` shows live health, endpoint probes, auto-polling (5/15/30/60s) with pause and
manual re-run, per-endpoint curl copy, and OpenAPI JSON/YAML download.

## 6. UX rules (non-negotiable)

- No modals or popups — wizard-style multi-step forms and paginated tables instead.
- IBM-inspired sharp design: 0 border radius, purple primary + teal accent, no standard blue.
- Sticky horizontal top nav in authenticated portals (no left sidebar); content 90–95% width.
- One header system: `AppLayout` picks the role header when signed in, public navbar when not;
  home is full-bleed (no layout padding).
- Text-only "SuperlativeBridge" wordmark with underline; no generic AI-style iconography.
- Hero: "From Skills to Income." is static on one line; taglines below use a typewriter effect over
  always-moving background orbs, which pause under `prefers-reduced-motion`.
- Colors, gradients and shadows come from semantic tokens in `src/index.css`; never hardcode
  `text-white`, `bg-black` or hex utilities in components.
- Long lists (courses, modules, candidates, marketplace) are paginated; course filters and page
  state persist in the URL and survive refresh/back-forward.

## 7. Local development

`docker compose up --build` (or `make dev`) starts Postgres (auto-seeded), the Go API on `:8081`,
and Vite on `:8080`. `make reset` wipes the volume and re-seeds. Demo accounts use `password123`
and are one-click on the sign-in page. See README for details.
