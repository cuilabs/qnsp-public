---
title: KMS Client (@qnsp/kms-client)
version: 0.1.0
last_updated: 2026-02-16
copyright: © 2025 CUI Labs. All rights reserved.
license: Apache-2.0
source_files:
  - /packages/kms-client/src/index.ts
---

# KMS Client (`@qnsp/kms-client`)

TypeScript client for `kms-service`. Provides key wrapping and unwrapping operations with tenant-specific PQC algorithms based on crypto policy.

## Install

```bash
pnpm install @qnsp/kms-client
```

## Create a client

```ts
import { HttpKmsServiceClient } from "@qnsp/kms-client";

// With static API token
const kms = new HttpKmsServiceClient("http://localhost:8095", "<access_token>");

// With dynamic auth header (service token flow)
const kms = new HttpKmsServiceClient("http://localhost:8095", {
	getAuthHeader: async () => {
		const token = await getServiceToken();
		return `Bearer ${token}`;
	},
});
```

## Wrap Key

Encrypt a data encryption key (DEK) with a key encryption key (KEK):

```ts
const result = await kms.wrapKey({
	tenantId: "<tenant_uuid>",
	dataKey: Buffer.from(dataKey).toString("base64"),
	keyId: "<kek_uuid>",
	associatedData: Buffer.from("context").toString("base64"), // Optional
});

console.log(result);
// {
//   keyId: "<kek_uuid>",
//   wrappedKey: "<base64_wrapped_key>",
//   algorithm: "kyber-768",
//   algorithmNist: "ML-KEM-768",  // NIST standardized name
//   provider: "liboqs"
// }
```

## Unwrap Key

Decrypt a wrapped data encryption key:

```ts
const result = await kms.unwrapKey({
	tenantId: "<tenant_uuid>",
	wrappedKey: "<base64_wrapped_key>",
	keyId: "<kek_uuid>",
	associatedData: Buffer.from("context").toString("base64"), // Optional
});

const dataKey = Buffer.from(result.dataKey, "base64");
```

## PQC Algorithm Information

The KMS Client exports the full 90-algorithm NIST name mapping covering all PQC families supported by QNSP: ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205), FN-DSA (FIPS 206 draft), HQC, BIKE, Classic McEliece, FrodoKEM, NTRU, NTRU-Prime, MAYO, CROSS, UOV, and SNOVA.

```ts
import { toNistAlgorithmName, ALGORITHM_TO_NIST } from "@qnsp/kms-client";

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
//   "falcon-512": "FN-DSA-512",       // FIPS 206 (draft)
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

### Key Operations
- `HttpKmsServiceClient.wrapKey(input)` - Wrap DEK with KEK, returns PQC metadata
- `HttpKmsServiceClient.unwrapKey(input)` - Unwrap DEK

### Utilities
- `toNistAlgorithmName(algorithm)` - Convert internal to NIST name
- `ALGORITHM_TO_NIST` - Algorithm name mapping

### Types
- `KmsServiceClient` - Client interface
- `KmsPqcMetadata` - PQC operation metadata
- `HttpKmsServiceClientAuthConfig` - Dynamic auth configuration
