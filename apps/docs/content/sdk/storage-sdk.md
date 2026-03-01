---
title: Storage SDK (@qnsp/storage-sdk)
version: 0.1.0
last_updated: 2026-02-16
copyright: © 2025 CUI Labs. All rights reserved.
license: Apache-2.0
source_files:
  - /packages/storage-sdk/src/index.ts
---

# Storage SDK (`@qnsp/storage-sdk`)

TypeScript client for `storage-service`. All files are encrypted with tenant-specific PQC algorithms based on crypto policy.

## Install

```bash
pnpm install @qnsp/storage-sdk
```

## Create a client

```ts
import { StorageClient } from "@qnsp/storage-sdk";

const storage = new StorageClient({
	baseUrl: "http://localhost:8092",
	apiKey: "<access_token>",
	tenantId: "<tenant_uuid>",
});
```

## Upload Flow

```ts
// 1. Initiate upload
const upload = await storage.initiateUpload({
	name: "document.pdf",
	mimeType: "application/pdf",
	sizeBytes: 1024000,
	classification: "confidential",
	metadata: { department: "engineering" },
	tags: ["report", "q4"],
});

// PQC metadata shows which algorithm was used
console.log(upload.pqc);
// {
//   provider: "liboqs",
//   algorithm: "kyber-768",
//   algorithmNist: "ML-KEM-768",  // NIST standardized name
//   keyId: "key-uuid"
// }

// 2. Upload parts
for (let i = 0; i < upload.totalParts; i++) {
	const partData = getPartData(i); // Your data source
	await storage.uploadPart(upload.uploadId, i, partData);
}

// 3. Complete upload
const result = await storage.completeUpload(upload.uploadId);
console.log(result.documentId);
```

## Download Flow

```ts
// Get download descriptor
const descriptor = await storage.getDownloadDescriptor(documentId, version);

// Stream download
const { stream, totalSize, checksumSha3 } = await storage.downloadStream(
	documentId,
	version,
	{ range: "bytes=0-1023" } // Optional range request
);

// Process stream
const reader = stream.getReader();
while (true) {
	const { value, done } = await reader.read();
	if (done) break;
	// Process chunk
}
```

## Document Policies

```ts
// Get document policies
const policies = await storage.getDocumentPolicies(documentId);
console.log(policies.compliance.retentionMode); // "compliance" | "governance"

// Update retention policy
await storage.updateDocumentPolicies(documentId, {
	retentionMode: "compliance",
	retainUntil: "2027-01-01T00:00:00Z",
});

// Apply legal hold
await storage.applyLegalHold(documentId, { holdId: "litigation-2026" });

// Release legal hold
await storage.releaseLegalHold(documentId, "litigation-2026");

// Schedule lifecycle transition
await storage.scheduleLifecycleTransition(documentId, {
	targetTier: "cold",
	transitionAfter: "2026-06-01T00:00:00Z",
});
```

## PQC Algorithm Information

The Storage SDK exports the full 90-algorithm NIST name mapping covering all PQC families supported by QNSP: ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205), FN-DSA (FIPS 206 draft), HQC, BIKE, Classic McEliece, FrodoKEM, NTRU, NTRU-Prime, MAYO, CROSS, UOV, and SNOVA.

```ts
import { toNistAlgorithmName, ALGORITHM_TO_NIST } from "@qnsp/storage-sdk";

// Convert internal to NIST name
const nistName = toNistAlgorithmName("kyber-768"); // "ML-KEM-768"

// All uploads include PQC metadata
const upload = await storage.initiateUpload({ /* ... */ });
console.log(`Encrypted with ${upload.pqc.algorithmNist}`);

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

### Upload Lifecycle
- `StorageClient.initiateUpload(options)` - Returns PQC metadata
- `StorageClient.uploadPart(uploadId, partId, data)`
- `StorageClient.getUploadStatus(uploadId)`
- `StorageClient.completeUpload(uploadId)`

### Download
- `StorageClient.getDownloadDescriptor(documentId, version, options?)`
- `StorageClient.downloadStream(documentId, version, options?)`

### Policies
- `StorageClient.getDocumentPolicies(documentId)`
- `StorageClient.updateDocumentPolicies(documentId, input)`
- `StorageClient.applyLegalHold(documentId, request)`
- `StorageClient.releaseLegalHold(documentId, holdId)`
- `StorageClient.scheduleLifecycleTransition(documentId, request)`

### Utilities
- `toNistAlgorithmName(algorithm)` - Convert internal to NIST name
- `ALGORITHM_TO_NIST` - Algorithm name mapping
