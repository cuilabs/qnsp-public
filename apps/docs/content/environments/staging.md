---
title: Staging Environment
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# Staging Environment

Pre-production environment for testing.

## Purpose

- Integration testing
- Performance testing
- Pre-release validation
- Training and demos

## Access

```
Base URL: provided per deployment
```

## Configuration

### SDK
```typescript
import { requestServiceToken } from "@qnsp/auth-sdk";
import { VaultClient } from "@qnsp/vault-sdk";

const baseUrl = process.env["QNSP_BASE_URL"] ?? "";
const token = await requestServiceToken({
  authServiceUrl: baseUrl,
  serviceId: process.env["QNSP_SERVICE_ID"] ?? "",
  serviceSecret: process.env["QNSP_SERVICE_SECRET"] ?? "",
  audience: "internal-service",
});
if (!token) {
  throw new Error("Failed to obtain service token");
}

const vault = new VaultClient({ baseUrl, apiKey: token.accessToken });
await vault.createSecret({ tenantId: "<tenant_uuid>", name: "example-secret", payload: "<base64_payload>" });
```

### CLI
```bash
export QNSP_EDGE_GATEWAY_URL=<staging_base_url>
export QNSP_TENANT_ID=<tenant_uuid>
export QNSP_SERVICE_ID=<service_id>
export QNSP_SERVICE_SECRET=<service_secret>
```

## Characteristics

### Similar to production
- Same API versions
- Same authentication
- Same rate limits (reduced)
- Real HSM (shared)

### Differences from production
- Separate data
- Lower SLAs
- More frequent updates
- Test data allowed

## Data management

- Data reset weekly (Sundays)
- No production data allowed
- Test fixtures available

## Rate limits

Staging has reduced limits:
| Endpoint | Production | Staging |
|----------|------------|---------|
| Auth | 100/s | 10/s |
| KMS | 50/s | 5/s |
| Vault | 50/s | 5/s |

## Monitoring

Staging telemetry endpoints are provided separately per deployment.
