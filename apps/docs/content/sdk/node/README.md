---
title: Node.js SDK
version: 0.1.0
last_updated: 2026-05-05
copyright: © 2026 CUI Labs. All rights reserved.
---
# Node.js SDK

The official QNSP TypeScript / Node.js SDK ships as a single package — `@qnsp/qnsp` — covering vault, kms, audit, auth, tenant, access-control, billing, crypto-inventory, storage, search, and ai-orchestrator, plus webhook signature verification. It mirrors the `qnsp` Python / Go / Rust SDKs byte-for-byte over the same wire contracts.

## Installation

```bash
pnpm add @qnsp/qnsp
```

npm and yarn are also supported:

```bash
npm install @qnsp/qnsp
# or
yarn add @qnsp/qnsp
```

## Requirements

- Node.js 22 or later (the workspace is pinned to 24.14.0 via Volta)
- TypeScript 5.0+ (optional but recommended)

## Quick start

```typescript
import { QnspClient } from "@qnsp/qnsp";

const qnsp = new QnspClient({ apiKey: process.env.QNSP_API_KEY! });

// Vault — store a PQC-encrypted secret
const secret = await qnsp.vault.createSecret({
  name: "openai-api-key",
  payloadB64: Buffer.from("sk-...").toString("base64"),
  algorithm: "ml-kem-768",
});

// KMS — generate a signing key and sign
const key = await qnsp.kms.createKey({ algorithm: "ml-dsa-65", purpose: "signing" });
const signature = await qnsp.kms.sign(key.keyId, new TextEncoder().encode("hello"));

// Audit — emit a tamper-evident event
await qnsp.audit.logEvent({
  eventType: "model.inference",
  payload: { modelId: "gpt-4o", latencyMs: 412 },
});
```

Get a free API key at <https://cloud.qnsp.cuilabs.io/auth>.

## TypeScript support

The package ships full TypeScript types; no separate `@types/*` install is needed.

```typescript
import type { QnspClientOptions, CreateSecretRequest } from "@qnsp/qnsp";
```

## ESM and CommonJS

`@qnsp/qnsp` is published as ESM. CommonJS consumers can use a dynamic import:

```javascript
// ESM
import { QnspClient } from "@qnsp/qnsp";

// CommonJS — dynamic import only
const { QnspClient } = await import("@qnsp/qnsp");
```

## Sub-clients

`QnspClient` exposes one sub-client per backend service:

| Sub-client            | Surface                                                |
|-----------------------|--------------------------------------------------------|
| `qnsp.vault`          | Secret storage, versioning, rotation                   |
| `qnsp.kms`            | PQC key generation, sign, verify, wrap, unwrap         |
| `qnsp.audit`          | Append events, query the chain, fetch evidence packs   |
| `qnsp.auth`           | Login, refresh, revoke, WebAuthn, PAT                  |
| `qnsp.tenant`         | Provision tenants, manage crypto policy                |
| `qnsp.access`         | RBAC roles, permissions, assignments                   |
| `qnsp.billing`        | Subscriptions, entitlements, meters                    |
| `qnsp.cryptoInventory`| CBOM / cryptographic asset inventory                   |
| `qnsp.storage`        | PQC-encrypted object storage                           |
| `qnsp.search`         | Vector search with SSE-X                               |
| `qnsp.ai`             | AI orchestration, enclave inference                    |

All sub-clients share the same `apiKey`, telemetry, and retry configuration.

## Webhook signature verification

```typescript
import { verifyWebhookSignature } from "@qnsp/qnsp";

const isValid = verifyWebhookSignature({
  payload: rawBody,
  signature: req.headers["x-qnsp-signature"]!,
  secret: process.env.QNSP_WEBHOOK_SECRET!,
});
```

## Migration from per-service SDKs

Earlier releases shipped per-service packages (`@qnsp/vault-sdk`, `@qnsp/kms-sdk`, etc.). Those are deprecated on npm; `@qnsp/qnsp` is the single canonical entry point. The wire contract is unchanged — only the import surface and field names have been unified across languages (`payloadB64`, `payload_b64`, `PayloadB64`).
