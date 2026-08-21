// SuperlativeBridge — Azure (Container Apps + Postgres Flexible Server + static web)
targetScope = 'resourceGroup'

@description('Environment name')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'prod'

@description('Azure region')
param location string = resourceGroup().location

@description('Name prefix (lowercase alphanumeric, max 12)')
@minLength(2)
@maxLength(12)
param namePrefix string = 'sb'

@description('Postgres admin login')
param postgresAdminLogin string = 'sbadmin'

@secure()
@description('Postgres admin password (12+ chars, complexity required)')
param postgresAdminPassword string

@secure()
@description('JWT signing secret')
param jwtSecret string

@secure()
@description('LMS API key')
param lmsApiKey string = 'unset'

@secure()
@description('Integration webhook secret')
param integrationWebhookSecret string = 'unset'

@description('API container image (ACR). Empty = placeholder until workflow pushes.')
param apiImage string = ''

@description('CORS allow origin')
param corsAllowOrigin string = '*'

var unique = uniqueString(resourceGroup().id, environment, namePrefix)
var base = toLower('${namePrefix}${environment}${take(unique, 5)}')
var dbName = 'superlativebridge'
var acrName = take('${replace(base, '-', '')}acr', 50)
var kvName = take('${base}kv', 24)
var pgName = take('${base}pg', 63)
var stgName = take('${replace(base, '-', '')}web', 24)

resource law 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${base}-law'
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: true
    publicNetworkAccess: 'Enabled'
  }
}

resource kv 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: kvName
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: { family: 'A', name: 'standard' }
    enableRbacAuthorization: true
    enabledForTemplateDeployment: true
    publicNetworkAccess: 'Enabled'
  }
}

resource pg 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: pgName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: postgresAdminLogin
    administratorLoginPassword: postgresAdminPassword
    storage: { storageSizeGB: 32 }
    backup: { backupRetentionDays: 7 }
    highAvailability: { mode: 'Disabled' }
    network: { publicNetworkAccess: 'Enabled' }
  }
}

resource pgDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: pg
  name: dbName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

resource pgFwAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-12-01-preview' = {
  parent: pg
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Allows GitHub Actions migrate during demo deploys. Restrict for production.
resource pgFwOpen 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-12-01-preview' = {
  parent: pg
  name: 'AllowAllForCiMigrate'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '255.255.255.255'
  }
}

var databaseUrl = 'postgres://${postgresAdminLogin}:${uriComponent(postgresAdminPassword)}@${pg.properties.fullyQualifiedDomainName}:5432/${dbName}?sslmode=require'

resource secretJwt 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: kv
  name: 'jwt-secret'
  properties: { value: jwtSecret }
}

resource secretDsn 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: kv
  name: 'database-url'
  properties: { value: databaseUrl }
  dependsOn: [pgDb]
}

resource cae 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${base}-cae'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: law.properties.customerId
        sharedKey: law.listKeys().primarySharedKey
      }
    }
  }
}

resource api 'Microsoft.App/containerApps@2024-03-01' = {
  name: '${base}-api'
  location: location
  identity: { type: 'SystemAssigned' }
  properties: {
    managedEnvironmentId: cae.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8081
        transport: 'auto'
        allowInsecure: false
      }
      registries: [
        {
          server: acr.properties.loginServer
          username: acr.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
        }
        { name: 'database-url', value: databaseUrl }
        { name: 'jwt-secret', value: jwtSecret }
        { name: 'lms-api-key', value: lmsApiKey }
        { name: 'webhook-secret', value: integrationWebhookSecret }
      ]
    }
    template: {
      containers: [
        {
          name: 'api'
          image: empty(apiImage) ? 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest' : apiImage
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'PORT', value: '8081' }
            { name: 'ENVIRONMENT', value: environment }
            { name: 'DATABASE_URL', secretRef: 'database-url' }
            { name: 'JWT_SECRET', secretRef: 'jwt-secret' }
            { name: 'LMS_API_KEY', secretRef: 'lms-api-key' }
            { name: 'INTEGRATION_WEBHOOK_SECRET', secretRef: 'webhook-secret' }
            { name: 'CORS_ALLOW_ORIGIN', value: corsAllowOrigin }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 5
      }
    }
  }
  dependsOn: [pgDb]
}

resource web 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: stgName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: true
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

output acrName string = acr.name
output acrLoginServer string = acr.properties.loginServer
output apiName string = api.name
output apiUrl string = 'https://${api.properties.configuration.ingress.fqdn}'
output postgresFqdn string = pg.properties.fullyQualifiedDomainName
output databaseName string = dbName
output postgresAdminLogin string = postgresAdminLogin
output keyVaultName string = kv.name
output webStorageAccountName string = web.name
output resourceGroupName string = resourceGroup().name
