#!/usr/bin/env bash
# Tear down SuperlativeBridge AWS stacks (API SAM + infra).
# Empties versioned S3 buckets so CloudFormation can delete them.
set -euo pipefail

ENVIRONMENT="${ENVIRONMENT:-prod}"
AWS_REGION="${AWS_REGION:-us-east-1}"
INFRA_STACK_NAME="${INFRA_STACK_NAME:-superlativebridge-infra-${ENVIRONMENT}}"
SAM_STACK_NAME="${SAM_STACK_NAME:-superlativebridge-api-${ENVIRONMENT}}"
CONFIRM="${CONFIRM:-}"

if [[ "$CONFIRM" != "destroy" ]]; then
  echo "Refusing to destroy. Set CONFIRM=destroy to proceed."
  exit 1
fi

echo "WARNING: Destroying ${SAM_STACK_NAME} and ${INFRA_STACK_NAME} in ${AWS_REGION}"

empty_bucket() {
  local bucket="$1"
  if [[ -z "$bucket" || "$bucket" == "None" ]]; then
    return 0
  fi
  if ! aws s3api head-bucket --bucket "$bucket" 2>/dev/null; then
    echo "Bucket ${bucket} not found — skip"
    return 0
  fi
  echo "Emptying s3://${bucket} (including versions)…"
  aws s3 rm "s3://${bucket}" --recursive || true
  # Delete all object versions + delete markers
  aws s3api list-object-versions --bucket "$bucket" --output json \
    | python3 -c "
import sys, json, subprocess
data = json.load(sys.stdin)
objs = []
for v in data.get('Versions') or []:
    objs.append({'Key': v['Key'], 'VersionId': v['VersionId']})
for m in data.get('DeleteMarkers') or []:
    objs.append({'Key': m['Key'], 'VersionId': m['VersionId']})
for i in range(0, len(objs), 1000):
    chunk = objs[i:i+1000]
    if not chunk:
        continue
    payload = json.dumps({'Objects': chunk, 'Quiet': True})
    subprocess.check_call(['aws','s3api','delete-objects','--bucket','${bucket}','--delete',payload])
print(f'deleted {len(objs)} versioned objects from ${bucket}')
" || true
}

# Collect buckets from stacks before deleting
WEB_BUCKET=$(aws cloudformation describe-stacks --stack-name "$INFRA_STACK_NAME" --region "$AWS_REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='WebBucketName'].OutputValue" --output text 2>/dev/null || true)
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
CFN_BUCKET="sb-cfn-artifacts-${ACCOUNT}-${AWS_REGION}"

echo "Deleting API stack ${SAM_STACK_NAME}…"
aws cloudformation delete-stack --stack-name "$SAM_STACK_NAME" --region "$AWS_REGION" || true
aws cloudformation wait stack-delete-complete --stack-name "$SAM_STACK_NAME" --region "$AWS_REGION" || true

empty_bucket "$WEB_BUCKET"
empty_bucket "$CFN_BUCKET"

echo "Deleting infra stack ${INFRA_STACK_NAME}…"
aws cloudformation delete-stack --stack-name "$INFRA_STACK_NAME" --region "$AWS_REGION" || true
aws cloudformation wait stack-delete-complete --stack-name "$INFRA_STACK_NAME" --region "$AWS_REGION" || true

echo "Destroy complete."
