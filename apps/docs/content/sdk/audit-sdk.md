---
title: Audit SDK (@qnsp/audit-sdk)
version: 0.1.0
last_updated: 2026-02-16
copyright: © 2025 CUI Labs. All rights reserved.
license: Apache-2.0
source_files:
  - /packages/audit-sdk/src/index.ts
---

# Audit SDK (`@qnsp/audit-sdk`)

TypeScript client for `audit-service`. All audit events are signed with tenant-specific PQC algorithms based on crypto policy.

## Install

```bash
pnpm install @qnsp/audit-sdk
```

## Create a client

```ts
import { AuditClient } from "@qnsp/audit-sdk";

const audit = new AuditClient({
	baseUrl: "http://localhost:8103",
	apiKey: "<access_token>",
});
```

## Ingest Events

```ts
await audit.ingestEvents({
	events: [
		{
			id: "<event_uuid>",
			tenantId: "<tenant_uuid>",
			sourceService: "storage-service",
			topic: "document.uploaded",
			version: "1.0",
			payload: {
				documentId: "<doc_uuid>",
				sizeBytes: 1024000,
			},
			security: {
				controlPlaneTokenSha256: "<hash>",
				pqcSignatures: [
					{
						provider: "liboqs",
						algorithm: "dilithium-3",
						value: "<signature>",
						publicKey: "<public_key>",
					},
				],
			},
			signature: {
				algorithm: "dilithium-3",
				provider: "liboqs",
				value: "<signature>",
				publicKey: "<public_key>",
			},
			eventHash: "<hash>",
			chainHash: "<hash>",
			commitmentSignature: {
				algorithm: "dilithium-3",
				provider: "liboqs",
				value: "<signature>",
				publicKey: "<public_key>",
			},
			receivedAt: new Date().toISOString(),
		},
	],
});
```

## Query Events

```ts
// List events with filters
const { items, nextCursor } = await audit.listEvents({
	tenantId: "<tenant_uuid>",
	sourceService: "storage-service",
	topic: "document.uploaded",
	since: "2026-01-01T00:00:00Z",
	limit: 100,
});

// Paginate through results
let cursor = nextCursor;
while (cursor) {
	const page = await audit.listEvents({
		tenantId: "<tenant_uuid>",
		cursor,
	});
	// Process page.items
	cursor = page.nextCursor;
}
```

## PQC Algorithm Information

The Audit SDK exports the full 90-algorithm NIST name mapping covering all PQC families supported by QNSP: ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205), FN-DSA (FIPS 206 draft), HQC, BIKE, Classic McEliece, FrodoKEM, NTRU, NTRU-Prime, MAYO, CROSS, UOV, and SNOVA.

```ts
import { toNistAlgorithmName, ALGORITHM_TO_NIST } from "@qnsp/audit-sdk";

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
//   "sntrup761": "sntrup761",          // NTRU-Prime
//   "mayo-1": "MAYO-1",               // NIST Additional Signatures
//   "cross-rsdp-128-balanced": "CROSS-RSDP-128-balanced",
//   "ov-Is": "UOV-Is",
//   "snova-24-5-4": "SNOVA-24-5-4",
//   ... // 90 algorithms total
// }
```

## Key APIs

### Event Management
- `AuditClient.ingestEvents(request)` - Batch ingest (1-100 events)
- `AuditClient.listEvents(request?)` - Query with filters and pagination

### Utilities
- `toNistAlgorithmName(algorithm)` - Convert internal to NIST name
- `ALGORITHM_TO_NIST` - Algorithm name mapping

### Types
- `AuditEvent` - Full event with signatures and chain hashes
- `IngestEventsRequest` - Batch ingest request
- `ListEventsRequest` - Query filters
- `ListEventsResult` - Paginated results
