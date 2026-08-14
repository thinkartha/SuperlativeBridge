#!/usr/bin/env bash
# Exercise the write endpoints as the demo GIG worker:
# enroll in a course, update progress, save/unsave a course, book a mentor.
#   ./testing/curl/write-flows.sh
set -euo pipefail
source "$(dirname "$0")/_env.sh"

ROLE="${1:-worker}"
TOKEN="$(signin "$ROLE")"
UID_VAL="$(signin_user_id "$ROLE")"
: "${UID_VAL:=1}"
COURSE_ID="${COURSE_ID:-1}"
MENTOR_ID="${MENTOR_ID:-1}"

req() { # req <method> <path> [json]
  local method="$1" path="$2" body="${3:-}"
  echo "--- $method $path"
  if [[ -n "$body" ]]; then
    curl -sS -X "$method" "$BASE_URL$path" \
      -H 'Content-Type: application/json' -H 'Accept: application/json' \
      -H "Authorization: Bearer $TOKEN" -d "$body" -w '\n[%{http_code}]\n'
  else
    curl -sS -X "$method" "$BASE_URL$path" \
      -H 'Accept: application/json' -H "Authorization: Bearer $TOKEN" -w '\n[%{http_code}]\n'
  fi
  echo
}

echo "Account: $(demo_email "$ROLE")  user=$UID_VAL  base=$BASE_URL"
echo

req POST  "/api/enrollments"                 "{\"userId\":\"$UID_VAL\",\"courseId\":\"$COURSE_ID\"}"
req GET   "/api/users/$UID_VAL/enrollments"
req POST  "/api/saved-courses"               "{\"userId\":\"$UID_VAL\",\"courseId\":\"$COURSE_ID\"}"
req GET   "/api/users/$UID_VAL/saved-courses"
req POST  "/api/mentor-bookings"             "{\"userId\":\"$UID_VAL\",\"mentorId\":\"$MENTOR_ID\",\"scheduledAt\":\"2026-09-01T15:00:00Z\",\"topic\":\"Resume review\",\"notes\":\"Created by write-flows.sh\"}"
req GET   "/api/users/$UID_VAL/mentor-bookings"
req DELETE "/api/saved-courses/$COURSE_ID"

echo "Done. Re-run 'make reset' to return the database to pristine seed data."
