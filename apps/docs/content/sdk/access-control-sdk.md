---
title: Access Control SDK (@qnsp/access-control-sdk)
version: 0.1.0
last_updated: 2026-02-16
copyright: © 2025 CUI Labs. All rights reserved.
license: Apache-2.0
source_files:
  - /packages/access-control-sdk/src/index.ts
---

# Access Control SDK (`@qnsp/access-control-sdk`)

TypeScript client for `access-control-service`. All capability tokens are signed with tenant-specific PQC algorithms based on crypto policy.

## Install

```bash
pnpm install @qnsp/access-control-sdk
```

## Create a client

```ts
import { AccessControlClient } from "@qnsp/access-control-sdk";

const accessControl = new AccessControlClient({
	baseUrl: "http://localhost:8102",
	apiKey: "<access_token>",
});
```

## Policy Management

```ts
// Create a policy
const policy = await accessControl.createPolicy({
	tenantId: "<tenant_uuid>",
	name: "storage-read-policy",
	description: "Allow reading storage documents",
	statement: {
		effect: "allow",
		actions: ["storage:read", "storage:list"],
		resources: ["storage:documents/*"],
		conditions: {
			classification: { lte: "confidential" },
		},
	},
});

// Get a policy
const policy = await accessControl.getPolicy("<policy_uuid>");

// List policies for a tenant
const { items, nextCursor } = await accessControl.listPolicies("<tenant_uuid>", {
	limit: 50,
});
```

## Capability Tokens

```ts
// Issue a capability token
const capability = await accessControl.issueCapability({
	tenantId: "<tenant_uuid>",
	policyId: "<policy_uuid>",
	subject: {
		type: "user",
		id: "<user_uuid>",
	},
	issuedBy: "admin@example.com",
	ttlSeconds: 3600, // 1 hour
	security: {
		controlPlaneTokenSha256: "<hash>",
		pqcSignatures: [
			{
				provider: "liboqs",
				algorithm: "dilithium-3",
			},
		],
	},
});

console.log(capability.token); // JWT-like token
console.log(capability.payload.signature.algorithm); // "dilithium-3"

// Introspect a token
const introspection = await accessControl.introspectCapability({
	token: capability.token,
});

if (introspection.active) {
	console.log(introspection.payload?.subject);
	console.log(introspection.payload?.expiresAt);
}

// Revoke a token
await accessControl.revokeCapability({
	tokenId: capability.payload.tokenId,
	revokedBy: "admin@example.com",
	reason: "User access revoked",
});
```

## PQC Algorithm Information

The Access Control SDK exports the full 90-algorithm NIST name mapping covering all PQC families supported by QNSP: ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205), FN-DSA (FIPS 206 draft), HQC, BIKE, Classic McEliece, FrodoKEM, NTRU, NTRU-Prime, MAYO, CROSS, UOV, and SNOVA.

```ts
import { toNistAlgorithmName, ALGORITHM_TO_NIST } from "@qnsp/access-control-sdk";

// Convert internal to NIST name
const nistName = toNistAlgorithmName("dilithium-3"); // "ML-DSA-65"

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
//   "mayo-1": "MAYO-1",               // NIST Additional Signatures
//   "cross-rsdp-128-balanced": "CROSS-RSDP-128-balanced",
//   "ov-Is": "UOV-Is",
//   "snova-24-5-4": "SNOVA-24-5-4",
//   ... // 90 algorithms total
// }
```

## Key APIs

### Policy Management
- `AccessControlClient.createPolicy(request)`
- `AccessControlClient.getPolicy(policyId)`
- `AccessControlClient.listPolicies(tenantId, options?)`

### Capability Tokens
- `AccessControlClient.issueCapability(request)` - Issue PQC-signed token
- `AccessControlClient.introspectCapability(request)` - Validate token
- `AccessControlClient.revokeCapability(request)` - Revoke token

### Utilities
- `toNistAlgorithmName(algorithm)` - Convert internal to NIST name
- `ALGORITHM_TO_NIST` - Algorithm name mapping

### Types
- `AccessPolicy` - Policy with statement and signature
- `PolicyStatement` - Effect, actions, resources, conditions
- `IssueCapabilityResponse` - Token with PQC signature metadata
- `IntrospectCapabilityResponse` - Token validation result
