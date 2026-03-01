---
title: SDK Overview
version: 0.2.0
last_updated: 2026-02-16
copyright: © 2025-2026 CUI Labs. All rights reserved.
license: Apache-2.0
source_files:
  - /packages/auth-sdk/package.json
  - /packages/vault-sdk/package.json
  - /packages/kms-client/package.json
  - /packages/storage-sdk/package.json
  - /packages/crypto-inventory-sdk/package.json
---

# SDK Overview

QNSP provides official TypeScript/Node.js SDKs for platform services. All SDKs now include tenant crypto policy integration and NIST algorithm name utilities.

## Available SDKs

From `packages/*/package.json`:

| Package | Version | Description |
|---------|---------|-------------|
| `@qnsp/auth-sdk` | 0.2.0 | Authentication, token management, WebAuthn, MFA, PQC signatures |
| `@qnsp/vault-sdk` | 0.2.0 | Secret management, envelope encryption, rotation, PQC metadata |
| `@qnsp/kms-client` | 0.1.0 | KMS key wrapping/unwrapping with PQC algorithms |
| `@qnsp/storage-sdk` | 0.2.0 | Storage service client with PQC encryption metadata |
| `@qnsp/audit-sdk` | 0.2.0 | Audit service client with algorithm utilities |
| `@qnsp/access-control-sdk` | 0.2.0 | Access control service client with algorithm utilities |
| `@qnsp/billing-sdk` | 0.1.2 | Billing service client |
| `@qnsp/search-sdk` | 0.1.1 | Search service client with SSE |
| `@qnsp/tenant-sdk` | 0.2.0 | Tenant service client with crypto policy management |
| `@qnsp/ai-sdk` | 0.1.1 | AI SDK + CLI (`qnsp-ai`) |
| `@qnsp/crypto-inventory-sdk` | 0.2.0 | Crypto asset inventory and PQC migration tracking |
| `@qnsp/browser-sdk` | 0.1.0 | Browser-side PQC encryption, signing, and key management (ML-KEM, ML-DSA, SLH-DSA) |

## Individual SDK docs

- [`@qnsp/auth-sdk`](./auth-sdk)
- [`@qnsp/vault-sdk`](./vault-sdk)
- [`@qnsp/storage-sdk`](./storage-sdk)
- [`@qnsp/kms-client`](./kms-client)
- [`@qnsp/search-sdk`](./search-sdk)
- [`@qnsp/audit-sdk`](./audit-sdk)
- [`@qnsp/access-control-sdk`](./access-control-sdk)
- [`@qnsp/billing-sdk`](./billing-sdk)
- [`@qnsp/tenant-sdk`](./tenant-sdk)
- [`@qnsp/ai-sdk`](./ai-sdk)
- [`@qnsp/crypto-inventory-sdk`](./crypto-inventory-sdk)
- [`@qnsp/browser-sdk`](./browser-sdk)

## Requirements

- **Node.js**: 24.12.0
- **License**: Apache-2.0

## Features

SDKs provide type-safe interfaces and consistent error handling. Some SDKs include retry/backoff for rate limiting.

## Installation

### Node.js
```bash
pnpm install @qnsp/auth-sdk @qnsp/vault-sdk @qnsp/storage-sdk
```

## Quick start

```javascript
import { AuthClient } from "@qnsp/auth-sdk";
import { VaultClient } from "@qnsp/vault-sdk";

const auth = new AuthClient({
	baseUrl: "https://api.qnsp.cuilabs.io",
	apiKey: process.env.QNSP_API_KEY,
});
const token = await auth.login({
	email: "user@example.com",
	password: "<password>",
	tenantId: "<tenant_uuid>",
});

const vault = new VaultClient({
	baseUrl: "https://api.qnsp.cuilabs.io/proxy/vault",
	apiKey: token.accessToken,
});

await vault.createSecret({
	tenantId: "<tenant_uuid>",
	name: "example-secret",
	payload: "<base64_payload>",
});
```

## Smoke testing SDKs

The monorepo includes an SDK smoke test runner that exercises the public SDK clients against a configured environment.

```bash
pnpm smoke:sdk
```

This runs `scripts/monitoring/sdk-smoke.mjs`.

### Required environment variables

- `QNSP_SMOKE_AUTH_SERVICE_URL`
- `QNSP_SMOKE_SERVICE_ID`
- `QNSP_SMOKE_SERVICE_SECRET`
- `QNSP_SMOKE_TENANT_ID`
- `QNSP_SMOKE_TENANT_BASE_URL`
- `QNSP_SMOKE_AUDIT_BASE_URL`
- `QNSP_SMOKE_BILLING_BASE_URL`
- `QNSP_SMOKE_ACCESS_CONTROL_BASE_URL`
- `QNSP_SMOKE_SEARCH_BASE_URL`
- `QNSP_SMOKE_AI_ORCHESTRATOR_BASE_URL`
- `QNSP_SMOKE_SEARCH_QUERY`

### Optional environment variables

- `QNSP_SMOKE_VAULT_BASE_URL` (requires `QNSP_SMOKE_VAULT_SECRET_ID`)
- `QNSP_SMOKE_VAULT_SECRET_ID`
- `QNSP_SMOKE_STORAGE_BASE_URL` (requires `QNSP_SMOKE_STORAGE_UPLOAD_ID`)
- `QNSP_SMOKE_STORAGE_UPLOAD_ID`

## SDK vs REST API

| Aspect | SDK | REST API |
|--------|-----|----------|
| Auth handling | Provided by caller | Manual |
| Retries | Built-in | Manual |
| Type safety | Yes | No |
| Complexity | Lower | Higher |

## Crypto Policy Integration

All SDKs now support tenant crypto policy integration. This allows services to:

1. Query allowed algorithms based on tenant policy tier
2. Convert internal algorithm names to NIST standardized names
3. Enforce algorithm restrictions at the SDK level

### Algorithm Name Conversion

All SDKs export the full 90-algorithm NIST name mapping covering 14 PQC families: ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205), FN-DSA (FIPS 206 draft), HQC, BIKE, Classic McEliece, FrodoKEM, NTRU, NTRU-Prime, MAYO, CROSS, UOV, and SNOVA.

```typescript
import { toNistAlgorithmName, ALGORITHM_TO_NIST } from "@qnsp/tenant-sdk";

// Convert internal name to NIST name
const nistName = toNistAlgorithmName("kyber-768"); // "ML-KEM-768"
const sigName = toNistAlgorithmName("dilithium-3"); // "ML-DSA-65"

// Full mapping covers all 90 PQC algorithms. Representative entries:
console.log(ALGORITHM_TO_NIST);
// {
//   "kyber-512": "ML-KEM-512",        // FIPS 203
//   "kyber-768": "ML-KEM-768",
//   "kyber-1024": "ML-KEM-1024",
//   "dilithium-2": "ML-DSA-44",       // FIPS 204
//   "dilithium-3": "ML-DSA-65",
//   "dilithium-5": "ML-DSA-87",
//   "sphincs-sha2-128f-simple": "SLH-DSA-SHA2-128f",  // FIPS 205
//   "sphincs-shake-256f-simple": "SLH-DSA-SHAKE-256f",
//   "falcon-512": "FN-DSA-512",       // FIPS 206 (draft)
//   "falcon-1024": "FN-DSA-1024",
//   "hqc-128": "HQC-128",             // NIST selected (March 2025)
//   "bike-l1": "BIKE-L1",             // NIST Round 4
//   "mceliece-348864": "Classic-McEliece-348864",  // ISO standard
//   "frodokem-640-aes": "FrodoKEM-640-AES",        // ISO standard
//   "ntru-hps-2048-509": "NTRU-HPS-2048-509",      // liboqs 0.15
//   "sntrup761": "sntrup761",          // NTRU-Prime
//   "mayo-1": "MAYO-1",               // NIST Additional Signatures
//   "cross-rsdp-128-balanced": "CROSS-RSDP-128-balanced",
//   "ov-Is": "UOV-Is",
//   "snova-24-5-4": "SNOVA-24-5-4",
//   ... // 90 algorithms total
// }
```

### Policy Tiers

| Tier | KEM Algorithms | Signature Algorithms |
|------|----------------|---------------------|
| `default` | kyber-512, kyber-768, kyber-1024 | dilithium-2, dilithium-3, dilithium-5 |
| `strict` | kyber-768, kyber-1024 | dilithium-3, dilithium-5, falcon-1024 |
| `maximum` | kyber-1024 | dilithium-5, falcon-1024, sphincs-shake-256f-simple |
| `government` | kyber-1024 | dilithium-5, sphincs-shake-256f-simple |

See the [Tenant Crypto Policy Guide](/architecture/tenant-crypto-policy) for detailed documentation.
