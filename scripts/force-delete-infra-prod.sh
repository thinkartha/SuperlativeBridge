#!/usr/bin/env bash
# Force-remove superlativebridge-infra-prod from ROLLBACK_FAILED so a new deploy can run.
# Retains stuck nested resources (ComposeDatabaseUrl / DatabaseStack) so CFN can finish.
set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
ROOT="superlativebridge-infra-prod"

echo "=== 1) Root status ==="
aws cloudformation describe-stacks --stack-name "$ROOT" --region "$AWS_REGION" \
  --query 'Stacks[0].{Status:StackStatus,Reason:StackStatusReason}' --output table || {
  echo "Root stack already gone — you can redeploy."
  exit 0
}

echo
echo "=== 2) Nested DatabaseStack ==="
NESTED=$(aws cloudformation describe-stack-resources --stack-name "$ROOT" --region "$AWS_REGION" \
  --logical-resource-id DatabaseStack \
  --query 'StackResources[0].PhysicalResourceId' --output text 2>/dev/null || true)
echo "NESTED=$NESTED"

if [[ -n "${NESTED:-}" && "$NESTED" != "None" ]]; then
  NSTATUS=$(aws cloudformation describe-stacks --stack-name "$NESTED" --region "$AWS_REGION" \
    --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "NOT_FOUND")
  echo "Nested status: $NSTATUS"

  echo
  echo "=== 3) Resources that failed delete on nested ==="
  aws cloudformation describe-stack-events --stack-name "$NESTED" --region "$AWS_REGION" \
    --query 'StackEvents[?ResourceStatus==`DELETE_FAILED`].LogicalResourceId' \
    --output text 2>/dev/null | tr '\t' '\n' | sort -u || true

  # Collect every DELETE_FAILED logical ID to retain
  RETAIN=$(aws cloudformation describe-stack-events --stack-name "$NESTED" --region "$AWS_REGION" \
    --query 'StackEvents[?ResourceStatus==`DELETE_FAILED`].LogicalResourceId' \
    --output text 2>/dev/null | tr '\t' '\n' | sort -u | tr '\n' ' ')
  # Always include known stuck CR pieces
  RETAIN="$RETAIN ComposeDatabaseUrl ComposeUrlFunction ComposeUrlRole DatabaseUrlSecret DbInstance DbSecret RdsSecurityGroup DbSubnetGroup"

  if [[ "$NSTATUS" != "NOT_FOUND" && "$NSTATUS" != "DELETE_COMPLETE" ]]; then
    echo
    echo "=== 4) Delete nested (retain stuck resources) ==="
    echo "retain: $RETAIN"
    # shellcheck disable=SC2086
    aws cloudformation delete-stack --stack-name "$NESTED" --region "$AWS_REGION" \
      --retain-resources $RETAIN || true
    echo "Waiting for nested delete…"
    aws cloudformation wait stack-delete-complete --stack-name "$NESTED" --region "$AWS_REGION" || {
      echo "Nested still not deleted. Status:"
      aws cloudformation describe-stacks --stack-name "$NESTED" --region "$AWS_REGION" \
        --query 'Stacks[0].StackStatus' --output text || true
      echo "Re-run this script, or delete nested from Console with Retain all failed resources."
    }
  fi
fi

echo
echo "=== 5) Delete root (retain DatabaseStack) ==="
ROOT_RETAIN=$(aws cloudformation describe-stack-events --stack-name "$ROOT" --region "$AWS_REGION" \
  --query 'StackEvents[?ResourceStatus==`DELETE_FAILED`].LogicalResourceId' \
  --output text 2>/dev/null | tr '\t' '\n' | sort -u | tr '\n' ' ')
ROOT_RETAIN="$ROOT_RETAIN DatabaseStack"
echo "retain: $ROOT_RETAIN"
# shellcheck disable=SC2086
aws cloudformation delete-stack --stack-name "$ROOT" --region "$AWS_REGION" \
  --retain-resources $ROOT_RETAIN

echo "Waiting for root delete (may take a few minutes)…"
aws cloudformation wait stack-delete-complete --stack-name "$ROOT" --region "$AWS_REGION"

echo
echo "=== 6) Verify gone ==="
if aws cloudformation describe-stacks --stack-name "$ROOT" --region "$AWS_REGION" &>/dev/null; then
  aws cloudformation describe-stacks --stack-name "$ROOT" --region "$AWS_REGION" \
    --query 'Stacks[0].StackStatus' --output text
  echo "FAILED: root still exists — open CloudFormation console → stack → Delete → retain failed resources."
  exit 1
fi

echo "Root stack deleted. Redeploy infra (GitHub Actions or ./scripts/deploy-infra.sh)."
echo "Note: retained RDS/secrets may still exist in the account; new deploy uses new resource names or may conflict."
echo "If deploy fails on name conflicts, delete leftover secrets named:"
echo "  superlativebridge/prod/rds"
echo "  superlativebridge/prod/database-url"
echo "and RDS instance sb-prod-postgres (or restore from snapshot intentionally)."
