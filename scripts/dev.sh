#!/usr/bin/env bash
# One command to run the whole SuperlativeBridge stack locally:
# Postgres (pre-seeded) + Go API + Vite frontend.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! docker info >/dev/null 2>&1; then
  echo "Docker does not appear to be running. Start Docker Desktop and retry." >&2
  exit 1
fi

COMPOSE="docker compose"
if ! $COMPOSE version >/dev/null 2>&1; then
  COMPOSE="docker-compose"
fi

echo "Building and starting db + api + web ..."
$COMPOSE up --build "$@"
