---
title: Development Environment
version: 0.0.1
last_updated: 2026-04-23
copyright: © 2025 CUI Labs. All rights reserved.
---

> **Note** — As of 2026-04-30, the per-service `@cuilabs/qnsp-auth-sdk` package is consolidated into the unified `@cuilabs/qnsp` SDK (one package per language). New integrations should use:
>
> ```typescript
> import { QnspClient } from "@cuilabs/qnsp";
> const qnsp = new QnspClient({ apiKey: process.env.QNSP_API_KEY! });
> await qnsp.auth./* method */(...);
> ```
>
> See [SDK overview](../sdk/) for the consolidated package. The per-service shapes documented below remain accurate at the wire level (REST/gRPC) and are kept for reference.

# Development Environment

Configure QNSP for local development.

## Local setup

### Containers (OrbStack)

Local development expects Docker-compatible containers (OrbStack on macOS).

Required containers:
```
qnsp-postgres
qnsp-redis
qnsp-clamav
```

Network:
```
qnsp-net
```

### Start backend services
From the repo root:
```bash
node scripts/dev/start-backend-cluster.mjs
```

### Environment variables
```bash
export QNSP_EDGE_GATEWAY_URL=http://localhost:8107
export QNSP_TENANT_ID=<tenant_uuid>
export QNSP_SERVICE_ID=<service_id>
export QNSP_SERVICE_SECRET=<service_secret>
export QNSP_VERBOSE=true
```

## Development features

### Relaxed validation
- Longer token TTLs
- Relaxed rate limits
- Verbose error messages

### Test data
Pre-seeded test data:
- Create a test tenant via `node scripts/dev/create-dev-tenant.mjs` and export the returned tenant UUID.

### Mock HSM
Development uses software HSM:
```yaml
hsm:
  provider: softhsm
  slot: 0
```

## SDK configuration

```typescript
import { AuthClient } from "@cuilabs/qnsp-auth-sdk";
import { VaultClient } from "@cuilabs/qnsp-vault-sdk";

const auth = new AuthClient({
	baseUrl: process.env["QNSP_EDGE_GATEWAY_URL"] ?? "http://localhost:8107",
});

const token = await auth.login({
	email: "user@example.com",
	password: "<password>",
	tenantId: "<tenant_uuid>",
});

const vault = new VaultClient({
	baseUrl: process.env["QNSP_EDGE_GATEWAY_URL"] ?? "http://localhost:8107",
	apiKey: token.accessToken,
});

await vault.createSecret({
	tenantId: "<tenant_uuid>",
	name: "example-secret",
	payload: "<base64_payload>",
});
```

## Debugging

Enable verbose CLI logging:
```bash
export QNSP_VERBOSE=true
```

If you see HTTPS validation errors in development, set:
```bash
export NODE_ENV=development
```

## Limitations

Development environment:
- Not for production data
- Single-node deployment
- No HSM security
- Limited persistence
