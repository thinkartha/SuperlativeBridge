#!/usr/bin/env bash
# Sign in as a demo account and print the JWT.
#   ./testing/curl/login.sh            # GIG worker (maria@example.com)
#   ./testing/curl/login.sh admin      # admin | worker | employer | mentor
#   export TOKEN=$(./testing/curl/login.sh employer)
set -euo pipefail
source "$(dirname "$0")/_env.sh"

ROLE="${1:-worker}"
TOKEN="$(signin "$ROLE")"

if [[ -z "$TOKEN" ]]; then
  echo "Sign in failed for '$(demo_email "$ROLE")' at $BASE_URL" >&2
  echo "Is the stack up? Try: make dev   then   make health" >&2
  exit 1
fi

echo "$TOKEN"
