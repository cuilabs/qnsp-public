# @qnsp/search-sdk

TypeScript client for the QNSP Search service. Provides document indexing, vector search, cursor
pagination, and SSE (Searchable Symmetric Encryption) helpers for zero-trust tenants.

## Installation

```bash
pnpm add @qnsp/search-sdk
```

## Authentication & encryption keys

- **API token** – Issue a service token from `auth-service` (or cloud portal API Keys) and pass it via
  the `apiToken` option. The SDK automatically attaches `Authorization: Bearer <token>`.
- **SSE key (optional)** – Provide `sseKey` (Uint8Array or base64 string) to derive encrypted tokens.
  Without this key the SDK can still perform plaintext queries but cannot index/search encrypted data.

```ts
import { SearchClient } from "@qnsp/search-sdk";

const search = new SearchClient({
  baseUrl: "https://api.qnsp.cuilabs.io/proxy/search",
  apiToken: process.env.QNSP_SERVICE_TOKEN,
  sseKey: Buffer.from(process.env.QNSP_SSE_KEY_BASE64!, "base64"),
});
```

## Tier requirements

| Capability | Minimum tier | Notes |
|------------|--------------|-------|
| Plaintext indexing & search | `free` | Available to all tenants |
| SSE-encrypted indexing/search | `dev-pro` | Requires `sseKey` and tier flag in backend |

If you pass `tier` through your own wrapper (recommended), call `isFeatureEnabled("sse", tier)` from
`@qnsp/shared-kernel` before constructing the client with an SSE key.

## Usage example

```ts
import { SearchClient } from "@qnsp/search-sdk";

const client = new SearchClient({
  baseUrl: "https://api.qnsp.cuilabs.io/proxy/search",
  apiToken: process.env.QNSP_SERVICE_TOKEN,
  sseKey: Buffer.from(process.env.QNSP_SSE_KEY!, "base64"),
});

// Index a document with SSE tokens
await client.indexDocumentWithAutoSse({
  tenantId: "tenant_123",
  documentId: "doc_456",
  sourceService: "storage-service",
  tags: ["classified"],
  metadata: { region: "ap-sg" },
  title: "Quantum brief",
  body: "Encrypted content",
});

// Query with automatic SSE derivation
const results = await client.searchWithAutoSse({
  tenantId: "tenant_123",
  query: "confidential incident report",
  limit: 10,
});
```

## Telemetry

Wrap the optional `fetchImpl` with your OpenTelemetry instrumentation or pipe the SDK through an
OTLP-aware proxy. Each request contains sufficient context (route name, target service) for metrics.

## Related documentation

- [Developer onboarding: SDK quick links](../../docs/guides/developer-onboarding.md#sdk-quick-links)
- [Search service plan](../../docs/service-plans/storage-service-plan.md)
- [Pricing & tier limits](../shared-kernel/src/tier-limits.ts)

## License

Licensed under the Apache License, Version 2.0. See [`LICENSE`](./LICENSE).

© 2025 QNSP - CUI LABS, Singapore
