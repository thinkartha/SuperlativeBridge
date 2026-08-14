# Seed data: generate, reset, reseed

All demo data lives in `backend/migrations`. Postgres runs every file in that folder in
filename order the **first** time the data volume is created, so a fresh stack is always
pre-seeded — there is no separate seeding step.

| File | Contents |
| --- | --- |
| `001_init.sql` | Schema: categories, users, skills, courses, modules, quizzes, mentors, enrollments, certifications, notifications, programs, visa_programs, marketplace_entries, community_posts, community_events, community_groups, entrepreneurship_tracks, entrepreneurship_resources, candidates |
| `002_seed.sql` | Demo dataset: 4 demo accounts, courses + modules, mentors, programs, visa programs, marketplace, community, candidates |
| `003_features.sql` | `saved_courses`, `mentor_bookings` tables + demo rows |

## 1. First run (seed happens automatically)

```bash
docker compose up --build      # or: make dev
```

Watch for `database system is ready to accept connections` in the `db` logs, then confirm:

```bash
make health                                            # Postgres + JWT roundtrip
curl -s http://localhost:8081/api/courses | head -c 400   # seeded courses
```

## 2. Reset and reseed from scratch

This drops the volume, so **all local data is lost** and every migration + seed re-runs:

```bash
make reset          # docker compose down -v && docker compose up --build
```

Equivalent long form:

```bash
docker compose down -v
docker compose up --build
```

## 3. Reseed without dropping the volume

Re-apply the seed files against the running database (the seed statements are idempotent —
they use `ON CONFLICT DO NOTHING` — so re-running is safe):

```bash
docker compose exec -T db psql -U sbuser -d superlativebridge < backend/migrations/002_seed.sql
docker compose exec -T db psql -U sbuser -d superlativebridge < backend/migrations/003_features.sql
```

To wipe just the data but keep the schema, then reseed:

```bash
docker compose exec -T db psql -U sbuser -d superlativebridge -c \
  "TRUNCATE users, courses, modules, quizzes, mentors, enrollments, certifications,
   notifications, categories, skills, programs, visa_programs, marketplace_entries,
   community_posts, community_events, community_groups, entrepreneurship_tracks,
   entrepreneurship_resources, candidates, saved_courses, mentor_bookings RESTART IDENTITY CASCADE;"
docker compose exec -T db psql -U sbuser -d superlativebridge < backend/migrations/002_seed.sql
docker compose exec -T db psql -U sbuser -d superlativebridge < backend/migrations/003_features.sql
```

## 4. Generate / add new seed data

1. Create a new numbered file, e.g. `backend/migrations/004_more_seed.sql`. Never edit an already
   applied migration — Postgres only replays the folder on a fresh volume.
2. Use `INSERT ... ON CONFLICT DO NOTHING` so the file can be applied repeatedly.
3. Any new table in the same file must ship with its `GRANT` statements.
4. Apply it:

```bash
docker compose exec -T db psql -U sbuser -d superlativebridge < backend/migrations/004_more_seed.sql
# or, to replay the whole folder cleanly:
make reset
```

Passwords in seed data are bcrypt hashes of `password123`. To add another demo user, copy the hash
from an existing row in `002_seed.sql`.

## 5. Inspect the seeded database

```bash
docker compose exec db psql -U sbuser -d superlativebridge -c "\dt"
docker compose exec db psql -U sbuser -d superlativebridge -c \
  "SELECT email, role FROM users ORDER BY id;"
docker compose exec db psql -U sbuser -d superlativebridge -c \
  "SELECT count(*) FROM courses;"
```

## 6. Verify the API serves the seed data

Run the EndPlex collection or the curl scripts in `testing/`:

```bash
./testing/curl/login.sh maria         # prints a JWT for the GIG worker demo account
./testing/curl/get-all.sh             # probes every GET endpoint
```

See [`testing/README.md`](../testing/README.md).

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Endpoints return empty arrays | Volume was created before the seed file existed → `make reset` |
| `relation "..." does not exist` | New migration not applied → apply the file or `make reset` |
| `/api/health` reports `database: failing` | `db` container not healthy yet, or wrong `DATABASE_URL` → `docker compose logs db` |
| Demo sign-in fails | Users not seeded → `make reset`, then use password `password123` |
