.PHONY: dev up down logs reset health

# One command: Postgres (pre-seeded) + Go API + Vite frontend
dev:
	docker compose up --build

up:
	docker compose up -d --build

down:
	docker compose down

# Wipe the database volume so migrations + seed data re-run from scratch
reset:
	docker compose down -v
	docker compose up --build

logs:
	docker compose logs -f

health:
	curl -s http://localhost:8081/api/health | head -40
