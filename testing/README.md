# API testing

Two ways to hit every SuperlativeBridge endpoint with the seeded demo accounts.

## 1. EndPlex collection (recommended)

[EndPlex](https://endplex.com) is a native, offline-first API workbench — the testing tool this
project standardises on (preferred over Postman).

1. Open EndPlex → **Import collection**.
2. Choose `testing/endplex/superlativebridge.endplex.json`.
3. Pick the environment: **Local (docker compose)** → `http://localhost:8081`
   (or **Local (vite proxy)** → `http://localhost:8080`, or the deployed API Gateway stage).
4. Run **Auth → `POST /api/auth/signin`** once. It captures `{{token}}` and `{{userId}}` into the
   collection variables, so every other request is authorised with one click.
5. Run any folder: Platform, Auth, Catalog, Accounts, Learning, Programs, Community, Employer.

Every request is pre-filled with headers, a sample JSON body, query parameters (filters and
pagination) and a status assertion. Swap `{{demoEmail}}` to switch role:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `password123` |
| GIG worker (student) | `maria@example.com` | `password123` |
| Employer | `aisha@example.com` | `password123` |
| Mentor | `sarah.mentor@example.com` | `password123` |

The collection can be regenerated from the live route table in
`backend/cmd/localserver/main.go`; the OpenAPI spec at `public/openapi.json` can also be imported
directly into EndPlex.

## 2. curl scripts

```bash
./testing/curl/login.sh                 # default demo worker, prints the JWT
./testing/curl/login.sh admin           # admin | worker | employer | mentor
export TOKEN=$(./testing/curl/login.sh employer)

./testing/curl/get-all.sh               # probe every GET endpoint, print status + timing
./testing/curl/write-flows.sh           # enroll, save a course, book a mentor, then clean up
```

Override the target with `BASE_URL`:

```bash
BASE_URL=https://xxxx.execute-api.us-east-1.amazonaws.com/prod ./testing/curl/get-all.sh
```

## Live status page

With the stack running, http://localhost:8080/system/api-docs shows health checks, endpoint
probes with auto-polling, a failure banner with the latest error details, per-endpoint curl copy,
and the full Swagger reference.
