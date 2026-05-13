---
title: SDK Configuration
version: 0.0.1
last_updated: 2026-04-23
copyright: © 2025 CUI Labs. All rights reserved.
---

> **Note** — As of 2026-04-30, the per-service `@qnsp/auth-sdk` package is consolidated into the unified `@cuilabs/qnsp` SDK (one package per language). New integrations should use:
>
> ```typescript
> import { QnspClient } from "@cuilabs/qnsp";
> const qnsp = new QnspClient({ apiKey: process.env.QNSP_API_KEY! });
> await qnsp.auth./* method */(...);
> ```
>
> See [SDK overview](../sdk/) for the consolidated package. The per-service shapes documented below remain accurate at the wire level (REST/gRPC) and are kept for reference.

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
