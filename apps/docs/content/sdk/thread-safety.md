---
title: Thread Safety
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# Thread Safety

SDK thread safety guarantees and best practices.

## Thread safety by language

### Node.js
- Single-threaded event loop
- Safe for concurrent async operations
- One client instance per application

Non-TypeScript SDKs are not provided in this repo.

## Shared client pattern

Recommended: single client instance per application.

```typescript
// Good: shared client
const client = new VaultClient({ baseUrl: "http://localhost:8090", apiKey: "<token>" });

async function handler1() {
	await client.createSecret({
		tenantId: "<tenant_uuid>",
		name: "example-secret",
		payload: "<base64_payload>",
	});
}

async function handler2() {
	await client.createSecret({
		tenantId: "<tenant_uuid>",
		name: "example-secret",
		payload: "<base64_payload>",
	});
}
```

```typescript
// Bad: new client per request
async function handler() {
  const client = new VaultClient({ baseUrl: "http://localhost:8090", apiKey: "<token>" });
	await client.createSecret({
		tenantId: "<tenant_uuid>",
		name: "example-secret",
		payload: "<base64_payload>",
	});
}
```

## Connection pooling

SDKs use `fetch` under the hood. Connection reuse is handled by the runtime.

## Token refresh synchronization

Token acquisition and refresh are handled by the caller. SDK clients accept an `apiKey` (bearer token) and do not perform automatic refresh.

## Cleanup

SDK clients do not require explicit cleanup.
