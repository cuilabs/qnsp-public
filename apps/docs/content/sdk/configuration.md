---
title: SDK Configuration
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# SDK Configuration

Configure QNSP SDKs for your environment.

## Configuration options

SDK configuration is per-service. QNSP publishes separate SDK packages (for example `@qnsp/auth-sdk`, `@qnsp/vault-sdk`, `@qnsp/storage-sdk`).

Most SDKs share these common options:

| Option | Required | Description |
|--------|----------|-------------|
| `baseUrl` | Yes | Service base URL (for example `https://api.qnsp.cuilabs.io`) |
| `apiKey` | No | Bearer token used for `Authorization: Bearer <token>` |
| `timeoutMs` | No | Request timeout in ms |

Some SDKs also require tenant context (for example `@qnsp/storage-sdk` sends `x-tenant-id` based on the configured `tenantId`).

## Node.js configuration

```typescript
import { AuthClient } from "@qnsp/auth-sdk";
import { VaultClient } from "@qnsp/vault-sdk";
import { StorageClient } from "@qnsp/storage-sdk";

const authClient = new AuthClient({
  baseUrl: "https://api.qnsp.cuilabs.io",
  apiKey: process.env.QNSP_API_KEY,
});

const vaultClient = new VaultClient({
  baseUrl: "https://api.qnsp.cuilabs.io/proxy/vault",
  apiKey: process.env.QNSP_API_KEY,
});

const storageClient = new StorageClient({
  baseUrl: "https://api.qnsp.cuilabs.io/proxy/storage",
  apiKey: process.env.QNSP_API_KEY,
  tenantId: process.env.QNSP_TENANT_ID,
});
```
