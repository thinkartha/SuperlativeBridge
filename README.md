# SuperlativeBridge

A workforce-to-income platform: training (LMS), government programs & grants, mentorship,
entrepreneurship/marketplace, community hub, and an employer candidate pipeline.

- **Frontend:** React 18 + Vite + TypeScript + Tailwind
- **Backend:** Go 1.22 handlers (AWS Lambda + API Gateway via SAM; same handlers run locally over HTTP)
- **Database:** Postgres (pgx v5)

The full product specification — roles, architecture, data model, every API endpoint, every screen,
and the UI rules — lives in [`.agents/skills/product-spec/SKILL.md`](.agents/skills/product-spec/SKILL.md).
API details are in [`docs/api-contract.md`](docs/api-contract.md) and `public/openapi.json`.

---

## Run everything locally (one command)

Requires Docker Desktop (or any Docker with Compose v2).

```bash
docker compose up --build      # or: make dev   |   ./scripts/dev.sh
```

That single command starts three containers:

| Service | URL | Notes |
| --- | --- | --- |
| `db` — Postgres 16 | `localhost:5432` | Auto-runs `backend/migrations/001_init.sql`, `002_seed.sql`, `003_features.sql`, so it comes up **pre-filled with seed data** |
| `api` — Go API | `http://localhost:8081` | The exact handlers that deploy to Lambda, served over plain HTTP by `backend/cmd/localserver` |
| `web` — Vite dev server | `http://localhost:8080` | Hot reload; talks to the API via `VITE_API_BASE_URL=http://localhost:8081` |

Open http://localhost:8080.

### Verify it's up

```bash
make health                                  # GET /api/health (Postgres + JWT roundtrip)
curl http://localhost:8081/api/courses       # should return seeded courses
```

Or open **http://localhost:8080/system/api-docs** for live health checks, endpoint probes
(auto-polling every 5/15/30/60s with pause + manual re-run), per-endpoint `curl` copy,
OpenAPI JSON/YAML download, and the full Swagger reference.

### Seed data

Seeding is automatic on the **first** boot of the `db` volume (Postgres runs everything in
`backend/migrations` in filename order). To re-seed from scratch:

```bash
make reset        # docker compose down -v && up --build  → migrations + seed re-run
```

To load seeds into an existing DB manually:

```bash
docker compose exec -T db psql -U sbuser -d superlativebridge < backend/migrations/002_seed.sql
docker compose exec -T db psql -U sbuser -d superlativebridge < backend/migrations/003_features.sql
```

Add new data or tables as a new numbered file (`004_*.sql`) in `backend/migrations`.
Full step-by-step guide (generate, reset, reseed, truncate, inspect, troubleshoot):
**[`docs/seed-data.md`](docs/seed-data.md)**.


### Demo accounts

Password for all: **`password123`**. The sign-in page has a one-click demo switcher, or type them in:

| Role | Email | Lands on |
| --- | --- | --- |
| Admin | `admin@example.com` | `/admin` |
| GIG worker (student) | `maria@example.com` | `/student` |
| Employer | `aisha@example.com` | `/employer/search` |
| Mentor | `sarah.mentor@example.com` | `/student` |

### Useful commands

```bash
make dev     # build + run in the foreground (one command for the whole stack)
make up      # start in the background
make logs    # tail all logs
make down    # stop
make reset   # wipe the DB volume and re-run migrations + seed data
make health  # curl the API health endpoint
```

Local defaults (`docker-compose.yml`): DB `superlativebridge` / user `sbuser` / password `sbpassword`,
`JWT_SECRET=local-dev-jwt-secret-change-me`. Development-only values; production uses the SAM
parameters `DatabaseUrl` and `JwtSecret`.

### Running the frontend without Docker

```bash
npm install
npm run dev        # :8080, proxies /api → http://localhost:8081 (see vite.config.ts)
```

You still need the API + Postgres running (`docker compose up db api`).

## Testing the API (EndPlex + curl)

[EndPlex](https://endplex.com) is the API workbench this project standardises on (preferred over
Postman). Import `testing/endplex/superlativebridge.endplex.json`, pick the **Local (docker
compose)** environment, run `POST /api/auth/signin` once to capture `{{token}}`, then one-click any
of the 47 requests. Shell equivalents:

```bash
export TOKEN=$(./testing/curl/login.sh admin)   # admin | worker | employer | mentor
./testing/curl/get-all.sh admin                 # probe every GET endpoint
./testing/curl/write-flows.sh                   # enroll, save course, book mentor
```

Details: [`testing/README.md`](testing/README.md).

## Environment variables

Copy the template and fill in as needed — every variable is documented inline:

```bash
cp .env.example .env
```

| Variable | Used by | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | web | Base URL of the API. Empty = same-origin `/api/...` via the Vite proxy; `http://localhost:8081` for Docker; API Gateway stage URL in prod |
| `DATABASE_URL` | api | Postgres connection string (pgx) |
| `JWT_SECRET` | api | Signing secret for auth JWTs |
| `PORT` | api | Port for `backend/cmd/localserver` (default `8081`) |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | db | Postgres container credentials |
| `DEMO_PASSWORD` | testing | Password for all seeded demo logins (`password123`) |

`docker compose up` already supplies all of these; `.env` only matters when running pieces outside
Docker.



## How the local API works

Lambda handlers live in `backend/internal/handlers/<service>` and are exported as `Handler`.
Each `backend/cmd/<service>/main.go` is a thin `lambda.Start(...)` wrapper for deployment, while
`backend/cmd/localserver` mounts every route from `template.yaml` on a single HTTP mux (translating
requests into `APIGatewayProxyRequest`, including path parameters and `Resource`).
One code path, two runtimes.

## Deploy (AWS — one GitHub pipeline)

See **[`docs/architecture.md`](docs/architecture.md)** for the full diagram (Cognito, RDS, S3,
CloudFront, ACM, WAF, LMS middleware, every Go package).

Repo: [thinkartha/SuperlativeBridge](https://github.com/thinkartha/SuperlativeBridge).

`.github/workflows/deploy.yml` on `main` (or workflow_dispatch):

1. **validate** — `go build` + `npm run build`
2. **deploy-infra** — `infra/root.yaml` → VPC, RDS, Cognito, S3, CloudFront, ACM (DNS-validated)
3. **deploy-api** — SAM `backend/template.yaml` (Go Lambdas in VPC) + invoke migrate Lambda
4. **deploy-frontend** — Vite build with Cognito env → S3 sync + CloudFront invalidation
5. **smoke** — `/api/health` + `/api/lms/providers`

To tear everything down: run **Destroy SuperlativeBridge (AWS)** (`.github/workflows/destroy.yml`)
and type `destroy` in the confirm field.

### Required GitHub secrets

| Secret | Purpose |
| --- | --- |
| `AWS_ACCESS_KEY_ID` | IAM user access key for deploy |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `JWT_SECRET` | Local JWT fallback / dual-auth signing |
| `LMS_API_KEY` | LMS middleware API key |
| `INTEGRATION_WEBHOOK_SECRET` | Integration webhook HMAC |

### GitHub variables (optional)

| Variable | Default | Purpose |
| --- | --- | --- |
| `AWS_REGION` | `us-east-1` | Must be `us-east-1` for CloudFront ACM |
| `ENVIRONMENT` | `prod` | `dev` / `staging` / `prod` |
| `HOSTED_ZONE_ID` | `Z01669412PYXMU5Y52OPY` | Route53 hosted zone |
| `DOMAIN_NAME` | *(auto from zone)* | Apex domain for ACM + CloudFront aliases |
| `CERTIFICATE_ARN` | *(create new)* | Skip ACM create if you already have a us-east-1 cert |

IAM user needs permissions for CloudFormation, IAM, EC2/VPC, RDS, Cognito, S3, CloudFront,
ACM, Route53, Lambda, API Gateway, Secrets Manager, and SAM deploy.