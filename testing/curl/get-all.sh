#!/usr/bin/env bash
# Probe every GET endpoint with a demo account token and print status + timing.
#   ./testing/curl/get-all.sh            # as GIG worker
#   ./testing/curl/get-all.sh admin      # as admin (unlocks /api/admin/stats, /api/users)
#   BASE_URL=https://... ./testing/curl/get-all.sh employer
set -euo pipefail
source "$(dirname "$0")/_env.sh"

ROLE="${1:-admin}"
TOKEN="$(signin "$ROLE")"
UID_VAL="$(signin_user_id "$ROLE")"
: "${UID_VAL:=1}"

echo "Base URL : $BASE_URL"
echo "Account  : $(demo_email "$ROLE") ($ROLE)"
echo

PATHS=(
  "/api/health"
  "/api/courses?page=1&pageSize=9"
  "/api/courses?search=cloud&level=Beginner&language=English"
  "/api/courses/1"
  "/api/categories"
  "/api/mentors"
  "/api/mentors/1"
  "/api/mentors/1/availability"
  "/api/programs"
  "/api/programs/1"
  "/api/visa-programs"
  "/api/entrepreneurship"
  "/api/marketplace?page=1&pageSize=10"
  "/api/community"
  "/api/candidates?page=1&pageSize=10"
  "/api/candidates/1"
  "/api/users"
  "/api/users/$UID_VAL"
  "/api/users/$UID_VAL/dashboard"
  "/api/users/$UID_VAL/enrollments"
  "/api/users/$UID_VAL/certifications"
  "/api/users/$UID_VAL/notifications"
  "/api/users/$UID_VAL/saved-courses"
  "/api/users/$UID_VAL/mentor-bookings"
  "/api/employer/analytics"
  "/api/employer/analytics/export?format=csv"
  "/api/admin/stats"
)

fail=0
for p in "${PATHS[@]}"; do
  read -r code time_total < <(
    curl -sS -o /dev/null -w '%{http_code} %{time_total}' \
      -H 'Accept: application/json' \
      -H "Authorization: Bearer $TOKEN" \
      "$BASE_URL$p" || echo "000 0"
  )
  if [[ "$code" =~ ^2 ]]; then mark="PASS"; else mark="FAIL"; fail=$((fail + 1)); fi
  printf '%-4s %-3s %6.0fms  GET %s\n' "$mark" "$code" "$(echo "$time_total * 1000" | bc -l)" "$p"
done

echo
echo "$(( ${#PATHS[@]} - fail ))/${#PATHS[@]} passing"
[[ $fail -eq 0 ]] || exit 1
