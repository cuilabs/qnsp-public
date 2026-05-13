---
title: SDK Overview
version: 0.3.6
last_updated: 2026-04-30
copyright: © 2025-2026 CUI Labs. All rights reserved.
license: Apache-2.0
source_files:
  - /packages/auth-sdk/package.json
  - /packages/vault-sdk/package.json
  - /packages/kms-client/package.json
  - /packages/storage-sdk/package.json
  - /packages/crypto-inventory-sdk/package.json
  - /packages/browser-sdk/package.json
  - /packages/mcp-server/package.json
  - /sdks/python/qnsp/pyproject.toml
  - /sdks/go/qnsp/go.mod
  - /sdks/rust/qnsp/Cargo.toml
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


# SDK Overview

QNSP provides official SDKs in **four languages** — TypeScript/Node.js, Python, Go, and Rust — all built on the same wire contracts, the same algorithm names, and the same FIPS 203 / 204 / 205 posture. Pick whichever fits your stack and the byte-for-byte outputs round-trip across languages.

As of **2026-04-30**, all four language families ship as a **single package per language** with the same 11-service surface. The 11 per-service `@qnsp/*-sdk` packages on npm are deprecated in favour of `@cuilabs/qnsp` (they continue to install but are no longer the recommended entry point). See [Supported Languages](./languages) for the full feature matrix and [the @cuilabs/qnsp README](https://github.com/cuilabs/qnsp-public/blob/main/packages/qnsp/README.md#migration-from-per-service-sdks) for the import-by-import migration guide.

The SDKs include tenant crypto policy integration, NIST algorithm name utilities, and support for the latest platform capabilities including risk-based authentication, JIT access, AI orchestration, and real-time streaming.

For migration work, the SDKs are the application cutover surface. Discovery typically starts with cloud/API connectors or QNSP agents, but migration is only complete when production trust calls move onto QNSP SDKs, APIs, or governed platform services.

## Single-package SDKs (recommended for all four languages)

| Language | Package | Version | Source | Activation `sdkId` |
|---|---|---|---|---|
| TypeScript / Node.js | [`@cuilabs/qnsp`](https://www.npmjs.com/package/@cuilabs/qnsp) | 0.1.0 | [`packages/qnsp/`](https://github.com/cuilabs/qnsp-public/tree/main/packages/qnsp) | `qnsp` |
| Python | [`qnsp`](https://pypi.org/project/qnsp/) | 0.3.0 | [`sdks/python/qnsp/`](https://github.com/cuilabs/qnsp-public/tree/main/sdks/python/qnsp) | `qnsp-python` |
| Go | `github.com/cuilabs/qnsp-public/sdks/go/qnsp` | 0.2.0 | [`sdks/go/qnsp/`](https://github.com/cuilabs/qnsp-public/tree/main/sdks/go/qnsp) | `qnsp-go` |
| Rust | [`qnsp`](https://crates.io/crates/qnsp) | 0.2.0 | [`sdks/rust/qnsp/`](https://github.com/cuilabs/qnsp-public/tree/main/sdks/rust/qnsp) | `qnsp-rust` |

Each package exposes the same 11 service modules — vault, kms, audit, auth, tenant, access, billing, crypto-inventory, storage, search, ai — plus webhook signature verification and (where the language supports it) local PQC primitives via the language's liboqs binding.

## Deprecated TypeScript per-service packages

These were the original split before consolidation. They remain installable for transitional purposes; new code should use `@cuilabs/qnsp` directly.

| Package | Last version | Status |
|---------|---|---|
| `@qnsp/auth-sdk` | 0.3.6 | Deprecated → `@cuilabs/qnsp.auth` |
| `@qnsp/vault-sdk` | 0.3.9 | Deprecated → `@cuilabs/qnsp.vault` |
| `@qnsp/kms-client` | 0.2.6 | Deprecated → `@cuilabs/qnsp.kms` |
| `@qnsp/storage-sdk` | 0.3.6 | Deprecated → `@cuilabs/qnsp.storage` |
| `@qnsp/audit-sdk` | 0.3.6 | Deprecated → `@cuilabs/qnsp.audit` |
| `@qnsp/access-control-sdk` | 0.3.6 | Deprecated → `@cuilabs/qnsp.access` |
| `@qnsp/billing-sdk` | 0.2.6 | Deprecated → `@cuilabs/qnsp.billing` |
| `@qnsp/search-sdk` | 0.2.10 | Deprecated → `@cuilabs/qnsp.search` |
| `@qnsp/tenant-sdk` | 0.3.6 | Deprecated → `@cuilabs/qnsp.tenant` |
| `@qnsp/ai-sdk` | 0.1.11 | Deprecated → `@cuilabs/qnsp.ai` |
| `@qnsp/crypto-inventory-sdk` | 0.3.6 | Deprecated → `@cuilabs/qnsp.cryptoInventory` |
| `@qnsp/browser-sdk` | 0.1.4 | **Not deprecated** — browser-side PQC primitives, distinct purpose from `@cuilabs/qnsp` (which is Node.js-only) |

## Developer tooling

These packages are part of the public integration surface, but they are not the per-service SDK clients listed above:

| Package | Version | Description |
|---------|---------|-------------|
| `@qnsp/cli` | 0.1.12 | Command-line automation and CI/CD workflows |
| `@qnsp/mcp-server` | 0.1.3 | Official MCP server for AI assistants using QNSP tools |
| `@qnsp/sdk-activation` | 0.1.5 | Shared activation and entitlement bootstrap used by SDK packages |
| `@qnsp/langchain-qnsp` | 0.1.7 | LangChain integration package |
| `@qnsp/llamaindex-qnsp` | 0.2.5 | LlamaIndex integration package |
| `@qnsp/autogen-qnsp` | 0.2.5 | AutoGen integration package |

## How SDKs fit into the migration journey

The platform journey is:

**Connect → Discover → Analyze → Govern → Migrate → Validate → Operate**

SDKs matter in the **Migrate** stage. They are how application traffic actually switches from legacy trust systems to QNSP.

- **Connect / Discover**: use source connectors and QNSP agents to identify what exists today
- **Analyze / Govern**: use crypto posture, policy, and readiness workflows to define the target state
- **Migrate**: update workloads, services, CI jobs, and internal tools to call QNSP SDKs, REST APIs, or the MCP server
- **Validate / Operate**: prove cutover with readiness evidence, CBOM, QBOM, SBOM, and continuous monitoring

If workloads are still calling the old KMS, old secret store, or old certificate path, the migration is not complete even if the inventory is visible in QNSP.

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
- [`@qnsp/browser-sdk`](./browser-sdk) — Browser-side PQC operations
- [`@qnsp/mcp-server`](./mcp-server) — MCP integration for AI assistants
- [`@qnsp/langchain-qnsp`](./langchain-qnsp) — LangChain toolkit for vault, KMS, and audit
- [`@qnsp/llamaindex-qnsp`](./llamaindex-qnsp) — LlamaIndex vector-store adapter for encrypted search
- [`@qnsp/autogen-qnsp`](./autogen-qnsp) — AutoGen executor for QNSP AI orchestration
- [`@qnsp/resilience`](./resilience) — Shared resilience primitives used by QNSP clients

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
pnpm add @cuilabs/qnsp
```

### Python
```bash
pip install qnsp                # base
pip install 'qnsp[crypto]'      # with local PQC primitives via liboqs-python
```

### Go
```bash
go get github.com/cuilabs/qnsp-public/sdks/go/qnsp@latest
```

### Rust
```bash
cargo add qnsp                  # base
cargo add qnsp --features crypto   # with local PQC primitives via oqs 0.11
```

## Quick start

```typescript
import { QnspClient } from "@cuilabs/qnsp";

const qnsp = new QnspClient({ apiKey: process.env.QNSP_API_KEY! });

// One activation handshake on first call, shared across all 11 sub-clients

await qnsp.auth.login({
	email: "user@example.com",
	password: "<password>",
	tenantId: "<tenant_uuid>",
});

await qnsp.vault.createSecret({
	name: "example-secret",
	payloadB64: Buffer.from("<plaintext>").toString("base64"),
});

await qnsp.kms.createKey({ algorithm: "ml-dsa-65", purpose: "signing" });
await qnsp.audit.logEvent({ eventType: "model.inference", payload: { modelId: "gpt-4o" } });
```

Same shape in Python, Go, and Rust:

```python
# Python
from qnsp import QnspClient
with QnspClient(api_key=os.environ["QNSP_API_KEY"]) as q:
    q.vault.create_secret(name="example-secret", payload_b64="...")
```

```go
// Go
c, _ := qnsp.NewClient(qnsp.ClientOptions{APIKey: os.Getenv("QNSP_API_KEY")})
c.Vault().CreateSecret(ctx, vault.CreateSecretRequest{Name: "example-secret", PayloadB64: "..."}, "")
```

```rust
// Rust
let c = qnsp::Client::new(qnsp::ClientOptions::with_api_key(std::env::var("QNSP_API_KEY")?))?;
c.vault().create_secret(qnsp::vault::CreateSecretRequest { name: "example-secret".into(), payload_b64: "...".into(), algorithm: None, metadata: None }, None).await?;
```

## Authentication model for SDK consumers

Use the credential type that matches the caller:

- **Tenant API keys** for workload and service data-plane access
- **User PATs** for human CLI and local scripting
- **Service accounts / machine identities** for durable enterprise automation

Tenant API keys are the normal choice for SDK integrations. PATs are useful for local development and operator workflows, but they should not be the long-lived shared credential for production automation.

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

All SDKs export the full 93-algorithm NIST name mapping covering 14 PQC families: ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205), FN-DSA (FIPS 206 draft), HQC, BIKE, Classic McEliece, FrodoKEM, NTRU, NTRU-Prime, MAYO, CROSS, UOV, and SNOVA.

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
//   ... // 93 algorithms total
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

### AI Tooling & Automation

- **MCP Server** (`@qnsp/mcp-server`): Expose tenant-scoped QNSP tools to AI assistants
- **CLI Automation** (`@qnsp/cli`): Script CI/CD workflows and operational tasks
- **Framework Integrations** (`@qnsp/langchain-qnsp`, `@qnsp/llamaindex-qnsp`, `@qnsp/autogen-qnsp`): Connect QNSP services into agent frameworks

### Billing & Tenant Management

- **Revenue Analytics** (`@qnsp/billing-sdk`): Real-time dashboards by tenant/product
- **Usage Forecasting** (`@qnsp/billing-sdk`): ML-powered consumption predictions
- **Health Dashboard** (`@qnsp/tenant-sdk`): Consolidated tenant health metrics
- **Isolation Audit** (`@qnsp/tenant-sdk`): Continuous verification of data isolation
