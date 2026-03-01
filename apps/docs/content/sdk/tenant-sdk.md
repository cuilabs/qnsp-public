---
title: Tenant SDK (@qnsp/tenant-sdk)
version: 0.2.0
last_updated: 2026-02-16
copyright: © 2025 CUI Labs. All rights reserved.
license: Apache-2.0
source_files:
  - /packages/tenant-sdk/src/index.ts
---

# Tenant SDK (`@qnsp/tenant-sdk`)

TypeScript client for `tenant-service`. Provides tenant lifecycle management and crypto policy configuration.

## Install

```bash
pnpm install @qnsp/tenant-sdk
```

## Create a client

```ts
import { TenantClient } from "@qnsp/tenant-sdk";

const tenants = new TenantClient({
	baseUrl: "http://localhost:8108",
	apiKey: "<access_token>",
});
```

## Tenant Management

```ts
// Create a tenant
const tenant = await tenants.createTenant({
	name: "Acme Corp",
	slug: "acme-corp",
	plan: "enterprise",
	security: {
		controlPlaneTokenSha256: null,
		pqcSignatures: [],
		hardwareProvider: null,
		attestationStatus: null,
		attestationProof: null,
	},
});

// Get a tenant
const tenant = await tenants.getTenant("<tenant_uuid>");

// Update a tenant
const updated = await tenants.updateTenant("<tenant_uuid>", {
	plan: "enterprise-pro",
	security: { /* ... */ },
});

// List tenants
const { items, nextCursor } = await tenants.listTenants({ limit: 50 });
```

## Crypto Policy Management (v0)

Manage tenant-specific PQC algorithm policies:

```ts
// Get tenant crypto policy
const policy = await tenants.getTenantCryptoPolicy("<tenant_uuid>");
console.log(policy.policyTier); // "default" | "strict" | "maximum" | "government"

// Update crypto policy
const updated = await tenants.upsertTenantCryptoPolicy("<tenant_uuid>", {
	policyTier: "strict",
	customAllowedSignatureAlgorithms: ["dilithium-5", "falcon-1024"],
	requireHsmForRootKeys: true,
	maxKeyAgeDays: 180,
});

// Get allowed algorithms for a tenant
const kemAlgorithms = await tenants.getAllowedKemAlgorithms("<tenant_uuid>");
const sigAlgorithms = await tenants.getAllowedSignatureAlgorithms("<tenant_uuid>");

// Get default algorithms for new operations
const defaultKem = await tenants.getDefaultKemAlgorithm("<tenant_uuid>");
const defaultSig = await tenants.getDefaultSignatureAlgorithm("<tenant_uuid>");
```

## Legacy Crypto Policy Tiers (v0)

| Tier | KEM Default | Signature Default | Use Case |
|------|-------------|-------------------|----------|
| `default` | kyber-768 | dilithium-3 | Standard business |
| `strict` | kyber-768 | dilithium-3 | Security-conscious |
| `maximum` | kyber-1024 | dilithium-5 | High-security |
| `government` | kyber-1024 | dilithium-5 | Government compliance |

## Crypto Policy V1 (Profiles + Tiers)

V1 policies use profiles + evidence-first tiers. These policies are the default returned by `/platform/v1/crypto/policy` when a tenant context is provided.

```ts
// Get tenant crypto policy v1
const policyV1 = await tenants.getTenantCryptoPolicyV1("<tenant_uuid>");
console.log(policyV1.policy.profile, policyV1.policy.enabledTiers);

// List policy history
const history = await tenants.listTenantCryptoPolicyV1History("<tenant_uuid>", { limit: 50 });

// Update policy (requires If-Match with current ETag)
const updated = await tenants.updateTenantCryptoPolicyV1(
	"<tenant_uuid>",
	{ ...policyV1.policy, overrides: { allowFalcon: true } },
	policyV1.etag,
);

// Enable Tier0 legacy (time-bounded)
await tenants.enableTier0Legacy(
	"<tenant_uuid>",
	{ expiry: "2026-12-31T00:00:00Z" },
	policyV1.etag,
);

// Enable Tier4 experimental (requires acknowledgement)
await tenants.enableTier4Experimental(
	"<tenant_uuid>",
	{ approvedBy: "security@qnsp" },
	policyV1.etag,
);

// Roll back to a previous policy history entry
await tenants.rollbackTenantCryptoPolicyV1(
	"<tenant_uuid>",
	{ historyId: history.items[0]?.id },
	policyV1.etag,
);
```

### V1 Profiles

- `gov-high-assurance` (default baseline)
- `defense-long-life-data` (high assurance, stateful options)
- `financial-hybrid-pqc` (migration/hybrid posture)
- `research-eval` (gated non-compliant research)

### V1 Tiers

- `TIER1_APPROVED` (default approved baseline)
- `TIER2_HIGH_ASSURANCE` (stateful + high assurance)
- `TIER3_DIVERSITY` (hybrid/alternate risk models)
- `TIER4_EXPERIMENTAL` (research-only, non-compliant)
- `TIER0_LEGACY` (time-bounded legacy transition)

## Algorithm Name Conversion

Convert between internal and NIST standardized names. The Tenant SDK exports the full 90-algorithm NIST name mapping covering all PQC families supported by QNSP: ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205), FN-DSA (FIPS 206 draft), HQC, BIKE, Classic McEliece, FrodoKEM, NTRU, NTRU-Prime, MAYO, CROSS, UOV, and SNOVA.

```ts
import { toNistAlgorithmName, ALGORITHM_TO_NIST } from "@qnsp/tenant-sdk";

// Convert internal to NIST name
const nistName = toNistAlgorithmName("kyber-768"); // "ML-KEM-768"
const nistSig = toNistAlgorithmName("dilithium-3"); // "ML-DSA-65"

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

## Key APIs

### Tenant Lifecycle
- `TenantClient.createTenant(request)`
- `TenantClient.updateTenant(id, request)`
- `TenantClient.getTenant(id)`
- `TenantClient.listTenants(options?)`

### Crypto Policy (v0)
- `TenantClient.getTenantCryptoPolicy(tenantId)`
- `TenantClient.upsertTenantCryptoPolicy(tenantId, policy)`
- `TenantClient.getAllowedKemAlgorithms(tenantId)`
- `TenantClient.getAllowedSignatureAlgorithms(tenantId)`
- `TenantClient.getDefaultKemAlgorithm(tenantId)`
- `TenantClient.getDefaultSignatureAlgorithm(tenantId)`

### Crypto Policy (v1)
- `TenantClient.getTenantCryptoPolicyV1(tenantId)`
- `TenantClient.listTenantCryptoPolicyV1History(tenantId, { limit? })`
- `TenantClient.updateTenantCryptoPolicyV1(tenantId, policy, etag)`
- `TenantClient.enableTier0Legacy(tenantId, { expiry }, etag)`
- `TenantClient.disableTier0Legacy(tenantId, etag)`
- `TenantClient.enableTier4Experimental(tenantId, { approvedBy }, etag)`
- `TenantClient.rollbackTenantCryptoPolicyV1(tenantId, { historyId | policyHash }, etag)`

### Utilities
- `toNistAlgorithmName(algorithm)` - Convert internal to NIST name
- `getAlgorithmConfigForTier(tier)` - Get algorithm config for a tier
- `CRYPTO_POLICY_ALGORITHMS` - Full tier algorithm configurations
- `ALGORITHM_TO_NIST` - Algorithm name mapping
