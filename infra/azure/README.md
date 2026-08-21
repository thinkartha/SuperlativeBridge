# Azure infrastructure (Bicep)

Provisions:

| Resource | Purpose |
| --- | --- |
| PostgreSQL Flexible Server 16 | App database |
| Azure Container Registry | API images |
| Container Apps | Go API (`backend/cmd/localserver`) |
| Key Vault | JWT + DSN secrets |
| Storage Account | Static website for React SPA |

## GitHub Actions

Workflow: [`.github/workflows/deploy-azure.yml`](../../.github/workflows/deploy-azure.yml) (manual `workflow_dispatch`).

### Required secrets

| Secret | Description |
| --- | --- |
| `AZURE_CREDENTIALS` | JSON from `az ad sp create-for-rbac --sdk-auth` |
| `AZURE_PG_PASSWORD` | Strong Postgres admin password |
| `JWT_SECRET` | API JWT signing key |
| `LMS_API_KEY` | Optional (use `unset` if unused) |
| `INTEGRATION_WEBHOOK_SECRET` | Optional |

### Optional variables

| Variable | Default |
| --- | --- |
| `AZURE_LOCATION` | `eastus` |
| `AZURE_RESOURCE_GROUP` | `superlativebridge-<env>` |

### Create the service principal (one-time)

```bash
SUB=$(az account show --query id -o tsv)
az ad sp create-for-rbac \
  --name "gh-superlativebridge-azure" \
  --role Contributor \
  --scopes "/subscriptions/${SUB}" \
  --sdk-auth
# Store the JSON output as GitHub secret AZURE_CREDENTIALS
```

Then run **Actions → Deploy SuperlativeBridge (Azure) → Run workflow**.

## Manual deploy

```bash
az group create -n superlativebridge-prod -l eastus
az deployment group create \
  -g superlativebridge-prod \
  -f infra/azure/main.bicep \
  -p infra/azure/main.parameters.json \
  -p postgresAdminPassword='***' jwtSecret='***' \
     apiImage='myacr.azurecr.io/superlativebridge-api:latest'
```
