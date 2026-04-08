---
title: SDK Overview
version: 0.3.0
last_updated: 2026-03-20
copyright: © 2025-2026 CUI Labs. All rights reserved.
license: Apache-2.0
source_files:
  - /packages/auth-sdk/package.json
  - /packages/vault-sdk/package.json
  - /packages/kms-client/package.json
  - /packages/storage-sdk/package.json
  - /packages/crypto-inventory-sdk/package.json
  - /packages/observability-sdk/package.json
  - /packages/security-monitoring-sdk/package.json
---

# SDK Overview

QNSP provides official TypeScript/Node.js SDKs for platform services. All SDKs include tenant crypto policy integration, NIST algorithm name utilities, and support for the latest platform capabilities including risk-based authentication, JIT access, AI orchestration, and real-time streaming.

## Available SDKs

From `packages/*/package.json`:

| Package | Version | Description |
|---------|---------|-------------|
| `@qnsp/auth-sdk` | 0.3.0 | Authentication, risk-based auth, federated audit, WebAuthn, MFA, PQC signatures |
| `@qnsp/vault-sdk` | 0.3.0 | Secret management, dynamic secrets, leakage detection, versioned secrets, PQC metadata |
| `@qnsp/kms-client` | 0.2.0 | KMS key operations, BYOHSM, key escrow, usage analytics, crypto agility |
| `@qnsp/storage-sdk` | 0.3.0 | Storage client with data classification, retention policies, cross-region replication |
| `@qnsp/audit-sdk` | 0.3.0 | Audit client with real-time streaming, retention automation, conformance results |
| `@qnsp/access-control-sdk` | 0.3.0 | Policy simulation, JIT access management, cross-tenant analysis |
| `@qnsp/billing-sdk` | 0.2.0 | Billing client with revenue analytics, usage forecasting, dunning, credit system |
| `@qnsp/search-sdk` | 0.2.0 | Search client with query analytics, synonym management, multi-tenant isolation |
| `@qnsp/tenant-sdk` | 0.3.0 | Tenant client with health dashboard, quota forecasting, onboarding automation |
| `@qnsp/ai-sdk` | 0.2.0 | AI SDK with model registry, cost optimization, bias monitoring, prompt injection detection |
| `@qnsp/crypto-inventory-sdk` | 0.3.0 | Certificate lifecycle, algorithm deprecation, hardware inventory, PQC readiness |
| `@qnsp/observability-sdk` | 0.1.0 | Cost attribution, anomaly detection, custom dashboards, SLO tracking |
| `@qnsp/security-monitoring-sdk` | 0.1.0 | Threat intelligence, automated response, attack paths, compliance mapping |
| `@qnsp/browser-sdk` | 0.2.0 | Browser-side PQC encryption, signing, and key management (ML-KEM, ML-DSA, SLH-DSA) |

## Individual SDK docs

- [`@qnsp/auth-sdk`](./auth-sdk) — Risk-based auth, federated audit, WebAuthn
- [`@qnsp/vault-sdk`](./vault-sdk) — Dynamic secrets, leakage detection, versioned secrets
- [`@qnsp/storage-sdk`](./storage-sdk) — Data classification, retention, cross-region replication
- [`@qnsp/kms-client`](./kms-client) — BYOHSM, key escrow, usage analytics
- [`@qnsp/search-sdk`](./search-sdk) — Query analytics, synonym management, isolation
- [`@qnsp/audit-sdk`](./audit-sdk) — Real-time streaming, retention automation
- [`@qnsp/access-control-sdk`](./access-control-sdk) — Policy simulation, JIT access
- [`@qnsp/billing-sdk`](./billing-sdk) — Revenue analytics, dunning, credits
- [`@qnsp/tenant-sdk`](./tenant-sdk) — Health dashboard, quota forecasting
- [`@qnsp/ai-sdk`](./ai-sdk) — Model registry, bias monitoring, prompt injection
- [`@qnsp/crypto-inventory-sdk`](./crypto-inventory-sdk) — Certificate lifecycle, PQC readiness
- [`@qnsp/observability-sdk`](./observability-sdk) — Cost attribution, anomaly detection, dashboards
- [`@qnsp/security-monitoring-sdk`](./security-monitoring-sdk) — Threat intelligence, automated response
- [`@qnsp/browser-sdk`](./browser-sdk) — Browser-side PQC operations

## Requirements

- **Node.js**: 24.12.0
- **License**: Apache-2.0

## Features

SDKs provide type-safe interfaces and consistent error handling. All SDKs include:

- **Retry/backoff** for rate limiting and transient failures
- **Tenant crypto policy** integration for algorithm selection
- **Real-time streaming** support via WebSocket/SSE where applicable
- **Comprehensive TypeScript types** for all API responses
- **PQC algorithm support** with NIST standardized names

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

## New Capabilities (March 2026)

### Authentication & Access

- **Risk-Based Auth** (`@qnsp/auth-sdk`): Adaptive MFA based on behavioral analytics, device fingerprinting, and geolocation
- **Federated Audit** (`@qnsp/auth-sdk`): Cross-IdP session correlation and unified audit trails
- **JIT Access** (`@qnsp/access-control-sdk`): Time-bound privilege elevation with automatic revocation
- **Policy Simulation** (`@qnsp/access-control-sdk`): Test policy changes against historical patterns

### Key & Secret Management

- **BYOHSM** (`@qnsp/kms-client`): Connect external HSMs via PKCS#11
- **Key Escrow** (`@qnsp/kms-client`): M-of-N threshold recovery schemes
- **Dynamic Secrets** (`@qnsp/vault-sdk`): On-demand credential generation
- **Leakage Detection** (`@qnsp/vault-sdk`): Real-time scanning for exposed secrets

### AI & ML Operations

- **Model Registry** (`@qnsp/ai-sdk`): Versioned model catalog with deployment tracking
- **Bias Monitoring** (`@qnsp/ai-sdk`): Fairness metrics and incident reporting
- **Cost Optimization** (`@qnsp/ai-sdk`): Token usage analytics and budget alerts
- **Prompt Injection** (`@qnsp/ai-sdk`): Real-time attack detection and blocking

### Observability & Security

- **Cost Attribution** (`@qnsp/observability-sdk`): Granular cost allocation
- **Anomaly Detection** (`@qnsp/observability-sdk`): ML-driven baseline deviation alerts
- **Threat Intelligence** (`@qnsp/security-monitoring-sdk`): External threat feed integration
- **Automated Response** (`@qnsp/security-monitoring-sdk`): SOAR-style playbooks

### Billing & Tenant Management

- **Revenue Analytics** (`@qnsp/billing-sdk`): Real-time dashboards by tenant/product
- **Usage Forecasting** (`@qnsp/billing-sdk`): ML-powered consumption predictions
- **Health Dashboard** (`@qnsp/tenant-sdk`): Consolidated tenant health metrics
- **Isolation Audit** (`@qnsp/tenant-sdk`): Continuous verification of data isolation
