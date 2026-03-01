---
title: CLI Authentication
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
license: Apache-2.0
source_files:
  - /packages/cli/src/commands/auth.ts
  - /packages/cli/src/utils/auth.ts
  - /packages/cli/src/config.ts
---
# CLI Authentication

Configure authentication for the QNSP CLI.

## Service Token Authentication

From `packages/cli/src/commands/auth.ts`, the CLI uses service account authentication:

```bash
qnsp auth token --service-id <id> --service-secret <secret>
```

**Implementation**: The CLI requests a service token from auth-service via `POST /auth/service-token` (see `packages/cli/src/utils/auth.ts`).

The request uses:
- `Authorization: Bearer <serviceSecret>`
- JSON body with `serviceId`

Tokens are cached per `serviceId` to avoid re-requesting on every command.

## Configuration

From `packages/cli/src/config.ts`, configuration is loaded from environment variables:

If you set `QNSP_EDGE_GATEWAY_URL`, the CLI will default to routing service requests through:
```
${QNSP_EDGE_GATEWAY_URL}/proxy/<service>
```

Examples:
- KMS: `/proxy/kms`
- Vault: `/proxy/vault`
- Audit: `/proxy/audit`

## Environment Variables

From `packages/cli/src/config.ts`:

| Variable | Description | Default |
|----------|-------------|----------|
| `QNSP_EDGE_GATEWAY_URL` | Edge Gateway base URL (preferred) | `null` |
| `QNSP_AUTH_SERVICE_URL` | Auth service URL | `http://localhost:8081` |
| `QNSP_SERVICE_ID` | Service account ID | `null` |
| `QNSP_SERVICE_SECRET` | Service account secret | `null` |
| `QNSP_TENANT_ID` | Tenant identifier | `null` |
| `QNSP_KMS_SERVICE_URL` | KMS service URL | `http://localhost:8095` |
| `QNSP_VAULT_SERVICE_URL` | Vault service URL | `http://localhost:8090` |
| `QNSP_AUDIT_SERVICE_URL` | Audit service URL | `http://localhost:8103` |
| `QNSP_TENANT_SERVICE_URL` | Tenant service URL | `http://localhost:8108` |
| `QNSP_BILLING_SERVICE_URL` | Billing service URL | `http://localhost:8106` |
| `QNSP_ACCESS_CONTROL_SERVICE_URL` | Access control service URL | `http://localhost:8102` |
| `QNSP_SECURITY_MONITORING_SERVICE_URL` | Security monitoring service URL | `http://localhost:8104` |
| `QNSP_STORAGE_SERVICE_URL` | Storage service URL | `http://localhost:8092` |
| `QNSP_SEARCH_SERVICE_URL` | Search service URL | `http://localhost:8101` |
| `QNSP_OBSERVABILITY_SERVICE_URL` | Observability service URL | `http://localhost:8105` |
| `QNSP_OUTPUT_FORMAT` | Output format (json/table/yaml) | `table` |
| `QNSP_VERBOSE` | Enable verbose output | `false` |

## Non-interactive usage

If `QNSP_SERVICE_SECRET` is not set:
- In an interactive shell, the CLI will prompt for it.
- In non-interactive mode, the CLI exits with an auth error.

## Usage Example

```bash
export QNSP_EDGE_GATEWAY_URL="http://localhost:8107"
export QNSP_SERVICE_ID="your-service-id"
export QNSP_SERVICE_SECRET="your-service-secret"
export QNSP_TENANT_ID="your-tenant-uuid"

qnsp kms keys list
```
