---
title: Vault SDK (@qnsp/vault-sdk)
version: 0.1.1
last_updated: 2026-02-16
copyright: © 2025 CUI Labs. All rights reserved.
license: Apache-2.0
source_files:
  - /packages/vault-sdk/src/index.ts
---

# Vault SDK (`@qnsp/vault-sdk`)

TypeScript client for `vault-service`. All secrets are encrypted with tenant-specific PQC algorithms based on crypto policy.

**Tier Requirement**: dev-pro or higher. Vault features are not available on free or dev-starter tiers.

## Install

```bash
pnpm install @qnsp/vault-sdk
```

## Create a client

```ts
import { VaultClient } from "@qnsp/vault-sdk";

const vault = new VaultClient({
	baseUrl: "http://localhost:8090",
	apiKey: "<access_token>",
	tier: "dev-pro", // Optional tier check
});
```

## Create a Secret

```ts
const secret = await vault.createSecret({
	tenantId: "<tenant_uuid>",
	name: "database-password",
	payload: Buffer.from("my-secret-value").toString("base64"),
	metadata: { environment: "production" },
	rotationPolicy: {
		intervalSeconds: 86400 * 30, // 30 days
	},
});

// PQC metadata shows encryption algorithm
console.log(secret.pqc);
// {
//   provider: "liboqs",
//   algorithm: "kyber-768",
//   algorithmNist: "ML-KEM-768",
//   keyId: "key-uuid"
// }
```

## Get a Secret

```ts
// Get latest version
const secret = await vault.getSecret("<secret_id>");

// Get with lease token (for access control)
const secret = await vault.getSecret("<secret_id>", {
	leaseToken: "<lease_token>",
});

// Get specific version
const secretV2 = await vault.getSecretVersion("<secret_id>", 2);
```

## Rotate a Secret

```ts
const rotated = await vault.rotateSecret("<secret_id>", {
	tenantId: "<tenant_uuid>",
	newPayload: Buffer.from("new-secret-value").toString("base64"),
	metadata: { rotatedBy: "admin" },
	rotationPolicy: {
		intervalSeconds: 86400 * 15, // 15 days
	},
});

console.log(rotated.version); // Incremented version
```

## Delete a Secret

```ts
await vault.deleteSecret("<secret_id>", "<tenant_uuid>");
```

## PQC Algorithm Information

The Vault SDK exports the full 90-algorithm NIST name mapping covering all PQC families supported by QNSP: ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205), FN-DSA (FIPS 206 draft), HQC, BIKE, Classic McEliece, FrodoKEM, NTRU, NTRU-Prime, MAYO, CROSS, UOV, and SNOVA.

```ts
import { toNistAlgorithmName, ALGORITHM_TO_NIST } from "@qnsp/vault-sdk";

// Convert internal to NIST name
const nistName = toNistAlgorithmName("kyber-768"); // "ML-KEM-768"

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

## Tier Access

The SDK validates tier access when configured:

```ts
import { VaultClient, TierError } from "@qnsp/vault-sdk";

try {
	const vault = new VaultClient({
		baseUrl: "http://localhost:8090",
		tier: "free", // Will throw TierError
	});
} catch (error) {
	if (error instanceof TierError) {
		console.log("Vault requires dev-pro tier or higher");
	}
}
```

## Key APIs

### Secret Management
- `VaultClient.createSecret(request)` - Returns PQC metadata
- `VaultClient.getSecret(id, options?)` - Get latest version
- `VaultClient.getSecretVersion(id, version)` - Get specific version
- `VaultClient.rotateSecret(id, request)` - Create new version
- `VaultClient.deleteSecret(id, tenantId)` - Soft delete

### Utilities
- `toNistAlgorithmName(algorithm)` - Convert internal to NIST name
- `ALGORITHM_TO_NIST` - Algorithm name mapping

### Types
- `Secret` - Secret with envelope and PQC metadata
- `VaultSecretPqcMetadata` - PQC encryption details
- `RotationPolicy` - Rotation configuration
- `TierError` - Tier access error
