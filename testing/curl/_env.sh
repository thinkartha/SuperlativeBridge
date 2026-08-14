#!/usr/bin/env bash
# Shared config for the SuperlativeBridge curl scripts.
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8081}"
DEMO_PASSWORD="${DEMO_PASSWORD:-password123}"

demo_email() {
  case "${1:-worker}" in
    admin)            echo "admin@example.com" ;;
    worker|student)   echo "maria@example.com" ;;
    employer)         echo "aisha@example.com" ;;
    mentor)           echo "sarah.mentor@example.com" ;;
    *)                echo "$1" ;;  # allow passing a raw email
  esac
}

# signin <role> -> prints the JWT
signin() {
  local email
  email="$(demo_email "${1:-worker}")"
  curl -sS -X POST "$BASE_URL/api/auth/signin" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"$DEMO_PASSWORD\"}" |
    sed -n 's/.*"token"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p'
}

# signin_user_id <role> -> prints the user id
signin_user_id() {
  local email
  email="$(demo_email "${1:-worker}")"
  curl -sS -X POST "$BASE_URL/api/auth/signin" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"$DEMO_PASSWORD\"}" |
    sed -n 's/.*"user"[[:space:]]*:[[:space:]]*{[^}]*"id"[[:space:]]*:[[:space:]]*"\{0,1\}\([^,"}]*\).*/\1/p'
}
