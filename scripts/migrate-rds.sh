#!/usr/bin/env bash
# Apply SQL migrations to RDS via a one-shot ECS/Fargate task or local psql tunnel.
# In CI we use a Lambda-less approach: run from a GitHub runner with SSM port-forward
# OR use the migrate Lambda when VPC access is available.
set -euo pipefail

ENVIRONMENT="${ENVIRONMENT:-prod}"
AWS_REGION="${AWS_REGION:-us-east-1}"
INFRA_STACK="${INFRA_STACK_NAME:-superlativebridge-infra-${ENVIRONMENT}}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

SECRET_ARN=$(aws cloudformation describe-stacks --stack-name "$INFRA_STACK" --region "$AWS_REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='DatabaseUrlSecretArn'].OutputValue" --output text)

if [[ -z "$SECRET_ARN" || "$SECRET_ARN" == "None" ]]; then
  echo "DatabaseUrlSecretArn not found on $INFRA_STACK" >&2
  exit 1
fi

DSN=$(aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --region "$AWS_REGION" \
  --query SecretString --output text | python3 -c 'import sys,json; print(json.load(sys.stdin)["dsn"])')

export DATABASE_URL="$DSN"

echo "Applying migrations from backend/migrations ..."
for f in "$ROOT"/backend/migrations/*.sql; do
  echo "→ $(basename "$f")"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done
echo "Migrations complete."
