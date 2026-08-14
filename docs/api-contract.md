# SuperlativeBridge API contract (v1)

Base URL: `VITE_API_BASE_URL` (API Gateway stage URL, e.g. `https://xxx.execute-api.us-east-1.amazonaws.com/prod`).
All responses are JSON. Errors: `{ "error": string }` with proper HTTP status.
All list endpoints return a JSON array (never null — return `[]`).
Field names are camelCase in JSON, snake_case in Postgres.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | /api/courses | query: `vertical`, `status`, `level`, `search` |
| GET | /api/courses/{id} | includes `modules[]` (each with `quiz`) |
| POST/PUT/DELETE | /api/courses[/{id}] | admin CRUD |
| GET | /api/categories | vertical/category list |
| POST/PUT/DELETE | /api/categories[/{id}] | |
| GET | /api/mentors | query: `search`, `status` |
| GET | /api/mentors/{id} | |
| POST/PUT/DELETE | /api/mentors[/{id}] | |
| GET | /api/users | query: `role`, `search` |
| GET | /api/users/{id} | includes `skills[]` |
| POST/PUT/DELETE | /api/users[/{id}] | |
| GET | /api/users/{id}/enrollments | enrollment + embedded `course` |
| GET | /api/users/{id}/certifications | |
| GET | /api/users/{id}/notifications | |
| GET | /api/users/{id}/dashboard | `{ stats, certifications, notifications, skills, enrollments, activity }` |
| POST | /api/auth/signin | `{email,password}` -> `{ user, token }` |
| POST | /api/auth/signup | `{name,email,password,role}` -> `{ user, token }` |
| GET | /api/programs | query: `type` |
| GET | /api/programs/{id} | |
| GET | /api/visa-programs | query: `type` |
| GET | /api/marketplace | query: `vertical`, `search` |
| GET | /api/community | `{ posts, events, groups }` |
| GET | /api/entrepreneurship | `{ tracks, resources, stats, milestones }` |
| GET | /api/candidates | employer search; query: `search`, `skill`, `vertical` |
| GET | /api/candidates/{id} | full candidate profile |
| GET | /api/admin/stats | admin dashboard KPIs (`activeCourses`, `employers`, `completionRate`, `recentUsers`) |
| GET | /api/admin/user-analytics | summary + per-user enrollment/XP/booking metrics |
| GET | /api/admin/mentor-analytics | summary + per-mentor booking metrics |
| GET | /api/admin/notifications | platform notifications (`unread`, `notifications[]`) |
| PATCH | /api/admin/notifications/{id} | `{ "read": true }` |
| GET | /api/users/{id}/analytics | one user's metrics, enrollments, bookings, certs |
| GET | /api/mentors/{id}/analytics | one mentor's metrics and booking calendar |
| GET/PUT | /api/settings | platform settings + notification preferences |
| GET | /api/admin/audit-log | paginated row-change audit (`table`, `action`, `search`, `page`, `pageSize`) |
| POST | /api/quiz-attempts | `{ quizId, answers[] }` → scored attempt; awards XP on first pass |
| GET | /api/integrations | connectors + nested pipelines and recent runs |
| GET | /api/integrations/{id} | one connector (id or slug) |
| POST | /api/integrations/pipelines/{id}/run | manual pipeline run (demo) |
| GET | /api/lms/providers | third-party LMS/CRM connectors |
| POST | /api/lms/courses/import | API-key course upsert from partners |
| POST | /api/lms/webhooks/{provider} | HMAC-signed partner webhooks |
| POST | /api/lms/providers/{provider}/sync | admin-triggered sync job |
| GET | /api/lms/jobs | recent LMS sync/import jobs |
| GET | /api/auth/cognito-config | Cognito pool/client for the UI |

## Core shapes

```ts
Course { id, title, description, overview?, learningObjectives[], audience?,
         category, vertical, language, level, duration,
         students, rating, instructor, image, status, modules?: Module[] }
Module { id, courseId, title, order, videoUrl, duration, content, quiz?: Quiz }
Quiz   { id, moduleId, title, passScore, xpReward, questions: {question, options[], answer}[] }
Enrollment { …, completedModuleIds[], quizAttempts[] }
Category { id, name, slug, icon, color, courseCount, status }
Mentor { id, name, email, expertise[], vertical, bio, rating, students, status, avatar }
User   { id, name, email, role, vertical, location, phone, bio, avatar, skills[], createdAt, status }
Enrollment { id, userId, courseId, progress, xp, grade, enrolledAt, course? }
Certification { id, userId, name, issuer, expiresAt, status, daysLeft }
Notification { id, userId, type, message, read, createdAt }
Program { id, title, agency, description, programType, eligibility[], funding, deadline, verticals[] }
VisaProgram { id, title, visaType, category, description, eligibility[], duration, industryMatch[] }
MarketplaceEntry { id, name, vertical, description, location, founded, employees, tags[] }
```

Roles: `admin | worker | employer | mentor` (worker = GIG worker, dashboard `/student`).

## Health

`GET /api/health` — no auth required.

Returns `200` when healthy, `503` when degraded.

```json
{
  "status": "ok",
  "timestamp": "2026-08-04T20:40:00Z",
  "checks": {
    "postgres": { "status": "ok", "detail": "connected; public tables present", "latencyMs": "12ms" },
    "jwt": { "status": "ok", "detail": "sign/verify roundtrip succeeded" }
  }
}
```

Checks performed:
- **postgres** — `DATABASE_URL` present, `SELECT 1` succeeds, and `public` schema contains tables (migrations applied).
- **jwt** — `JWT_SECRET` present and a token sign → verify → claims roundtrip succeeds.

## Course list filters

`GET /api/courses` accepts `search` (title/description/instructor), `category`, `vertical`, `language`, `level`, `status`. All comparisons are case-insensitive (`ILIKE`).

## v1.1 additions — enrollment, saved courses, mentor bookings, employer analytics

All routes below require `Authorization: Bearer <jwt>`.

### Enrollments
- `POST /api/enrollments` body `{ "courseId": "uuid" }` → `201 Enrollment` (idempotent: existing enrollment returned with `200`)
- `GET /api/users/{uid}/enrollments` → `Enrollment[]` (each item embeds `course`: id, title, instructor, vertical, level, duration, image)
- `PATCH /api/enrollments/{id}` body `{ "progress"?: number, "xp"?: number, "grade"?: string, "lastModuleId"?: "uuid" }` → `Enrollment`
- `DELETE /api/enrollments/{id}` → `204` (opt out of a course)

`Enrollment`: `{ id, userId, courseId, progress, xp, grade, lastModuleId, enrolledAt, updatedAt, course? }`

### Saved courses (bookmarks)
- `GET /api/users/{uid}/saved-courses` → `SavedCourse[]` where `SavedCourse` = `{ id, userId, courseId, savedAt, course }`
- `POST /api/saved-courses` body `{ "courseId": "uuid" }` → `201 SavedCourse` (idempotent)
- `DELETE /api/saved-courses/{courseId}` → `204`

### Mentor bookings
- `GET /api/users/{uid}/mentor-bookings` → `MentorBooking[]` (embeds `mentor`: id, name, title, expertise, image)
- `POST /api/mentor-bookings` body `{ "mentorId": "uuid", "scheduledAt": ISO8601, "durationMinutes": 30|45|60, "topic": string, "notes"?: string }` → `201 MentorBooking`
- `PATCH /api/mentor-bookings/{id}` body `{ "status": "requested"|"confirmed"|"completed"|"cancelled", "scheduledAt"?: ISO8601 }` → `MentorBooking`
- `GET /api/mentors/{id}/availability` → `{ mentorId, slots: [{ start, end, available }] }`

`MentorBooking`: `{ id, userId, mentorId, scheduledAt, durationMinutes, topic, notes, status, createdAt, mentor? }`

### Employer analytics
- `GET /api/employer/analytics?vertical=&level=&from=&to=` (employer or admin role) →
```json
{
  "summary": { "totalCandidates": 0, "availableCandidates": 0, "totalEnrollments": 0, "completedEnrollments": 0, "completionRate": 0, "avgProgress": 0 },
  "candidatesByVertical": [{ "label": "Information Technology", "candidates": 0, "avgMatch": 0 }],
  "candidatesByAvailability": [{ "label": "Available", "count": 0 }],
  "completionByCourse": [{ "label": "Python for Data Science", "enrollments": 0, "completed": 0, "completionRate": 0, "avgProgress": 0 }],
  "enrollmentTrend": [{ "period": "2026-05", "enrollments": 0, "completions": 0 }],
  "topSkills": [{ "label": "Python", "count": 0 }]
}
```
- `GET /api/employer/analytics/export?vertical=&level=&from=&to=&dataset=candidates|completions` → `text/csv` download.
