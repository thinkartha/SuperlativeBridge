# SuperlativeBridge Backend

Go-based AWS Lambda API backed by **Postgres**, deployed via AWS SAM/CloudFormation.

## Architecture
```
CloudFront → S3 (React frontend)
CloudFront → API Gateway → Lambda (Go handlers) → Postgres (RDS/Aurora/Supabase/etc.)
```

Each `cmd/<resource>/` directory builds a single Lambda binary that handles all
routes for that resource (routing is done internally by `HTTPMethod` +
`Resource`/path parameters). Shared code lives under `internal/`:
- `internal/db` — pgx connection pool, reads `DATABASE_URL`.
- `internal/auth` — password hashing (bcrypt) and JWT issue/verify, reads `JWT_SECRET`.
- `internal/models` — request/response DTOs.
- `internal/response` — JSON response helpers.

## Schema overview

Defined in `migrations/001_init.sql` (Postgres, UUID primary keys via
`pgcrypto`/`gen_random_uuid()`):

| Table | Notes |
|---|---|
| `categories` | course categories/verticals |
| `users` | `role` in (`admin`,`worker`,`employer`,`mentor`); `password_hash` is bcrypt |
| `skills` | FK → `users` |
| `courses` | vertical/status/level indexed |
| `modules` | FK → `courses` |
| `quizzes` | FK → `modules`; `questions` stored as JSONB |
| `mentors` | mentor directory |
| `enrollments` | FK → `users`, `courses` |
| `certifications` | FK → `users` |
| `notifications` | FK → `users` |
| `programs` | government/agency programs |
| `visa_programs` | visa program directory |
| `marketplace_entries` | GPM marketplace listings |
| `community_posts` / `community_events` / `community_groups` | community hub |
| `entrepreneurship_tracks` / `entrepreneurship_resources` | entrepreneurship hub |
| `candidates` | employer candidate search |

## Applying migrations

Run against your Postgres instance (RDS, Aurora Serverless, Supabase, Neon, etc.):

```bash
psql "$DATABASE_URL" -f migrations/001_init.sql
psql "$DATABASE_URL" -f migrations/002_seed.sql
```

`002_seed.sql` is optional demo data; all seeded users share the password
**`password123`** (bcrypt-hashed in the SQL).

## API endpoints

Base URL is the SAM `ApiUrl` output (`https://<api-id>.execute-api.<region>.amazonaws.com/prod`).
Full contract lives in `../docs/api-contract.md`; summary:

| Method | Path | Lambda |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/courses[/{id}]` | CoursesFunction |
| GET/POST/PUT/DELETE | `/api/categories[/{id}]` | CategoriesFunction |
| GET/POST/PUT/DELETE | `/api/mentors[/{id}]` | MentorsFunction |
| GET/POST/PUT/DELETE | `/api/users[/{id}]` | UsersFunction |
| GET | `/api/users/{id}/enrollments` | UsersFunction |
| GET | `/api/users/{id}/certifications` | UsersFunction |
| GET | `/api/users/{id}/notifications` | UsersFunction |
| GET | `/api/users/{id}/dashboard` | UsersFunction |
| POST | `/api/auth/signin` | AuthFunction |
| POST | `/api/auth/signup` | AuthFunction |
| GET | `/api/programs[/{id}]` | ProgramsFunction |
| GET | `/api/visa-programs` | VisaFunction |
| GET | `/api/marketplace` | MarketplaceFunction |
| GET | `/api/community` | CommunityFunction |
| GET | `/api/entrepreneurship` | EntrepreneurshipFunction |
| GET | `/api/candidates[/{id}]` | CandidatesFunction |
| GET | `/api/admin/stats` | AdminFunction |

## Deploy

### Required SAM parameters

| Parameter | Description |
|---|---|
| `DatabaseUrl` | Postgres DSN, e.g. `postgres://user:pass@host:5432/dbname?sslmode=require` (NoEcho) |
| `JwtSecret` | Secret used to sign/verify JWTs (NoEcho) |

```bash
cd backend
sam build
sam deploy \
  --stack-name superlativebridge-api \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --parameter-overrides DatabaseUrl="$DATABASE_URL" JwtSecret="$JWT_SECRET"
```

The stack outputs `ApiUrl` — set the frontend's `VITE_API_BASE_URL` to that value.

## Local Development
```bash
cd backend
go mod tidy
export DATABASE_URL=postgres://...
export JWT_SECRET=...
sam local start-api
```
