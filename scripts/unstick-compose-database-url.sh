#!/usr/bin/env bash
# Unstick superlativebridge-infra-* when ComposeDatabaseUrl (Custom Resource) is DELETE_FAILED.
# Prints status and applies the correct recovery for that status.
set -euo pipefail

ENVIRONMENT="${ENVIRONMENT:-prod}"
AWS_REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="${INFRA_STACK_NAME:-superlativebridge-infra-${ENVIRONMENT}}"

echo "Region=${AWS_REGION} Stack=${STACK_NAME}"
echo

STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" \
  --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "NOT_FOUND")
REASON=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" \
  --query 'Stacks[0].StackStatusReason' --output text 2>/dev/null || echo "")
echo "Root status:  ${STATUS}"
[[ -n "$REASON" && "$REASON" != "None" ]] && echo "Root reason:  ${REASON}"

NESTED=$(aws cloudformation describe-stack-resources --stack-name "$STACK_NAME" --region "$AWS_REGION" \
  --logical-resource-id DatabaseStack \
  --query 'StackResources[0].PhysicalResourceId' --output text 2>/dev/null || true)
echo "Nested ARN:   ${NESTED:-none}"

NSTATUS="NOT_FOUND"
if [[ -n "${NESTED:-}" && "$NESTED" != "None" ]]; then
  NSTATUS=$(aws cloudformation describe-stacks --stack-name "$NESTED" --region "$AWS_REGION" \
    --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "NOT_FOUND")
  echo "Nested status:${NSTATUS}"
fi

echo
echo "--- Failed / interesting events (root) ---"
aws cloudformation describe-stack-events --stack-name "$STACK_NAME" --region "$AWS_REGION" \
  --query 'StackEvents[?contains(ResourceStatus, `FAILED`)].[Timestamp,LogicalResourceId,ResourceStatus,ResourceStatusReason]' \
  --output table 2>/dev/null | head -40 || true

if [[ -n "${NESTED:-}" && "$NESTED" != "None" && "$NSTATUS" != "NOT_FOUND" ]]; then
  echo
  echo "--- Failed events (nested DatabaseStack) ---"
  aws cloudformation describe-stack-events --stack-name "$NESTED" --region "$AWS_REGION" \
    --query 'StackEvents[?contains(ResourceStatus, `FAILED`)].[Timestamp,LogicalResourceId,ResourceStatus,ResourceStatusReason]' \
    --output table 2>/dev/null | head -40 || true
fi

echo
echo "=== Applying recovery for status=${STATUS} / nested=${NSTATUS} ==="

case "$STATUS" in
  UPDATE_ROLLBACK_FAILED|UPDATE_FAILED)
    echo "continue-update-rollback (skip DatabaseStack)…"
    aws cloudformation continue-update-rollback \
      --stack-name "$STACK_NAME" --region "$AWS_REGION" \
      --resources-to-skip DatabaseStack
    aws cloudformation wait stack-rollback-complete --stack-name "$STACK_NAME" --region "$AWS_REGION"
    ;;
  DELETE_FAILED)
    echo "delete-stack root (retain DatabaseStack)…"
    aws cloudformation delete-stack \
      --stack-name "$STACK_NAME" --region "$AWS_REGION" \
      --retain-resources DatabaseStack
    aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" --region "$AWS_REGION" || true
    ;;
  UPDATE_ROLLBACK_COMPLETE|ROLLBACK_COMPLETE|CREATE_FAILED)
    echo "Stack already rolled back / failed create — safe to redeploy after nested is healthy."
    ;;
  CREATE_COMPLETE|UPDATE_COMPLETE)
    echo "Root is healthy. If nested still has ComposeDatabaseUrl DELETE_FAILED, fix nested only."
    ;;
  *_IN_PROGRESS)
    echo "Stack operation still in progress. Wait, then re-run this script."
    aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" \
      --query 'Stacks[0].StackStatus' --output text
    exit 0
    ;;
  NOT_FOUND)
    echo "Root stack gone — you can deploy fresh."
    ;;
  *)
    echo "Unhandled root status: $STATUS — see events above."
    ;;
esac

# Nested-specific recovery
if [[ -n "${NESTED:-}" && "$NESTED" != "None" ]]; then
  NSTATUS=$(aws cloudformation describe-stacks --stack-name "$NESTED" --region "$AWS_REGION" \
    --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "NOT_FOUND")
  echo "Nested status after root action: ${NSTATUS}"

  case "$NSTATUS" in
    UPDATE_ROLLBACK_FAILED|UPDATE_FAILED)
      echo "Nested continue-update-rollback (skip ComposeDatabaseUrl)…"
      aws cloudformation continue-update-rollback \
        --stack-name "$NESTED" --region "$AWS_REGION" \
        --resources-to-skip ComposeDatabaseUrl
      aws cloudformation wait stack-rollback-complete --stack-name "$NESTED" --region "$AWS_REGION" || true
      ;;
    DELETE_FAILED)
      echo "Nested delete-stack (retain ComposeDatabaseUrl)…"
      aws cloudformation delete-stack \
        --stack-name "$NESTED" --region "$AWS_REGION" \
        --retain-resources ComposeDatabaseUrl
      aws cloudformation wait stack-delete-complete --stack-name "$NESTED" --region "$AWS_REGION" || true
      ;;
    NOT_FOUND)
      echo "Nested stack already deleted."
      ;;
  esac
fi

echo
STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" \
  --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "NOT_FOUND")
echo "Final root status: ${STATUS}"
echo
echo "Next: commit/push the database.yaml fix (no ComposeDatabaseUrl), then redeploy infra."
