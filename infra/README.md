# Infrastructure (AWS)

Root CloudFormation stack: [`root.yaml`](./root.yaml). Nested stacks live in [`nested/`](./nested/).

| Template | Provisions |
| --- | --- |
| `nested/network.yaml` | VPC, public/private subnets, NAT, Lambda SG |
| `nested/database.yaml` | RDS Postgres 16 (encrypted, private), Secrets Manager, DSN composer Lambda |
| `nested/cognito.yaml` | User pool, app client, hosted UI domain, role groups |
| `nested/frontend.yaml` | S3 (private), CloudFront OAC, ACM (optional), Route53 alias |
| `nested/security.yaml` | WAFv2 for CloudFront |

Deploy via GitHub Actions (`.github/workflows/deploy.yml`) or:

```bash
export AWS_REGION=us-east-1 ENVIRONMENT=prod
./scripts/deploy-infra.sh
```

API Lambdas are **not** in this stack — they deploy next via SAM (`backend/template.yaml`) using outputs from this stack (VPC subnets, Cognito ARNs, DSN secret).

See [`docs/architecture.md`](../docs/architecture.md) for the full diagram.
