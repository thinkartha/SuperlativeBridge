#!/usr/bin/env bash
# Package nested CloudFormation templates to S3 and deploy infra/root.yaml
# Provisions VPC, RDS, Cognito, S3, CloudFront, ACM (DNS-validated), Route53.
set -euo pipefail

ENVIRONMENT="${ENVIRONMENT:-prod}"
AWS_REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="${INFRA_STACK_NAME:-superlativebridge-infra-${ENVIRONMENT}}"
BUCKET="${CFN_ARTIFACT_BUCKET:-}"
DOMAIN_NAME="${DOMAIN_NAME:-}"
HOSTED_ZONE_ID="${HOSTED_ZONE_ID:-Z01669412PYXMU5Y52OPY}"
CERTIFICATE_ARN="${CERTIFICATE_ARN:-}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INFRA="$ROOT/infra"

if [[ -z "$BUCKET" ]]; then
  ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
  BUCKET="sb-cfn-artifacts-${ACCOUNT}-${AWS_REGION}"
  aws s3 mb "s3://${BUCKET}" --region "$AWS_REGION" 2>/dev/null || true
fi

# Resolve apex domain from Route53 when HostedZoneId is set but DomainName is empty.
if [[ -z "$DOMAIN_NAME" && -n "$HOSTED_ZONE_ID" ]]; then
  ZONE_NAME=$(aws route53 get-hosted-zone --id "$HOSTED_ZONE_ID" \
    --query 'HostedZone.Name' --output text 2>/dev/null || true)
  ZONE_NAME="${ZONE_NAME%.}"
  if [[ -n "$ZONE_NAME" && "$ZONE_NAME" != "None" ]]; then
    DOMAIN_NAME="$ZONE_NAME"
    echo "Resolved DOMAIN_NAME=${DOMAIN_NAME} from hosted zone ${HOSTED_ZONE_ID}"
  fi
fi

CALLBACK_URLS="http://localhost:8080/signin,http://localhost:8080/"
LOGOUT_URLS="http://localhost:8080/signin,http://localhost:8080/"
if [[ -n "$DOMAIN_NAME" ]]; then
  CALLBACK_URLS="${CALLBACK_URLS},https://${DOMAIN_NAME}/signin,https://${DOMAIN_NAME}/,https://www.${DOMAIN_NAME}/signin,https://www.${DOMAIN_NAME}/"
  LOGOUT_URLS="${LOGOUT_URLS},https://${DOMAIN_NAME}/signin,https://${DOMAIN_NAME}/,https://www.${DOMAIN_NAME}/signin,https://www.${DOMAIN_NAME}/"
fi

echo "Packaging nested templates into s3://${BUCKET}/infra ..."
aws s3 sync "$INFRA/nested" "s3://${BUCKET}/infra/nested" --delete

# Rewrite TemplateURL to S3 for nested stacks
TMP=$(mktemp)
sed "s|TemplateURL: nested/|TemplateURL: https://${BUCKET}.s3.${AWS_REGION}.amazonaws.com/infra/nested/|g" \
  "$INFRA/root.yaml" > "$TMP"

PARAMS=(
  "Environment=${ENVIRONMENT}"
  "DomainName=${DOMAIN_NAME}"
  "HostedZoneId=${HOSTED_ZONE_ID}"
  "CertificateArn=${CERTIFICATE_ARN}"
  "CognitoCallbackURLs=${CALLBACK_URLS}"
  "CognitoLogoutURLs=${LOGOUT_URLS}"
)

echo "Deploying ${STACK_NAME} (domain=${DOMAIN_NAME:-none} zone=${HOSTED_ZONE_ID} region=${AWS_REGION})"
aws cloudformation deploy \
  --region "$AWS_REGION" \
  --stack-name "$STACK_NAME" \
  --template-file "$TMP" \
  --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --parameter-overrides "${PARAMS[@]}" \
  --no-fail-on-empty-changeset

rm -f "$TMP"

echo "Infra stack outputs:"
aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" \
  --query 'Stacks[0].Outputs' --output table
