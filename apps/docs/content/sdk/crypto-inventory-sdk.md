---
title: Crypto Inventory SDK (@qnsp/crypto-inventory-sdk)
version: 0.1.0
last_updated: 2026-02-16
copyright: © 2025 CUI Labs. All rights reserved.
license: Apache-2.0
source_files:
  - /packages/crypto-inventory-sdk/src/index.ts
---

# Crypto Inventory SDK (`@qnsp/crypto-inventory-sdk`)

TypeScript client for `crypto-inventory-service`. Provides cryptographic asset discovery and inventory management across the QNSP platform.

## Install

```bash
pnpm install @qnsp/crypto-inventory-sdk
```

## Create a client

```ts
import { CryptoInventoryClient } from "@qnsp/crypto-inventory-sdk";

const inventory = new CryptoInventoryClient({
	baseUrl: "http://localhost:8115",
	apiKey: "<access_token>",
});
```

## List Assets

```ts
// List all assets for a tenant
const { assets, count } = await inventory.listAssets({
	tenantId: "<tenant_uuid>",
});

// Filter by type and PQC status
const pqcKeys = await inventory.listAssets({
	tenantId: "<tenant_uuid>",
	assetType: "key",
	isPqc: true,
	limit: 100,
});

// Filter by source
const kmsAssets = await inventory.listAssets({
	tenantId: "<tenant_uuid>",
	source: "kms",
});

// Filter by algorithm
const kyberAssets = await inventory.listAssets({
	tenantId: "<tenant_uuid>",
	algorithm: "kyber-768",
});

// Assets include NIST algorithm names
console.log(assets[0]);
// {
//   id: "<asset_uuid>",
//   tenantId: "<tenant_uuid>",
//   assetType: "key",
//   source: "kms",
//   algorithm: "kyber-768",
//   algorithmNist: "ML-KEM-768",  // NIST standardized name
//   isPqc: true,
//   ...
// }
```

## Get Asset Details

```ts
const asset = await inventory.getAsset("<asset_uuid>");
console.log(asset.algorithm, asset.algorithmNist);
```

## Asset Statistics

```ts
const stats = await inventory.getAssetStats("<tenant_uuid>");
console.log(stats);
// {
//   totalAssets: 150,
//   pqcAssets: 120,
//   classicalAssets: 30,
//   byType: { certificate: 50, key: 80, secret: 20 },
//   bySource: { kms: 80, vault: 50, "edge-gateway": 20 },
//   byAlgorithm: { "kyber-768": 60, "dilithium-3": 40, "rsa-2048": 30, ... },
//   expiringWithin30Days: 5,
//   rotationOverdue: 2,
// }
```

## PQC Migration Status

```ts
const status = await inventory.getPqcMigrationStatus("<tenant_uuid>");
console.log(status);
// {
//   totalAssets: 150,
//   pqcAssets: 120,
//   classicalAssets: 30,
//   pqcPercentage: 80,
//   migrationComplete: false,
// }
```

## Asset Discovery

Trigger discovery to scan services for cryptographic assets:

```ts
// Discover all assets
const runs = await inventory.discoverAssets();

// Discover for specific tenant
const runs = await inventory.discoverAssets({
	tenantId: "<tenant_uuid>",
});

// Discover from specific source
const runs = await inventory.discoverAssets({
	source: "kms",
});

// Get discovery run history
const history = await inventory.getDiscoveryRuns("<tenant_uuid>", 10);
console.log(history[0]);
// {
//   id: "<run_uuid>",
//   tenantId: "<tenant_uuid>",
//   source: "kms",
//   status: "completed",
//   assetsDiscovered: 25,
//   startedAt: "2026-01-04T10:00:00Z",
//   completedAt: "2026-01-04T10:00:05Z",
// }
```

## Delete Asset

```ts
await inventory.deleteAsset("<asset_uuid>");
```

## PQC Algorithm Information

The Crypto Inventory SDK exports the full 90-algorithm NIST name mapping covering all PQC families supported by QNSP: ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205), FN-DSA (FIPS 206 draft), HQC, BIKE, Classic McEliece, FrodoKEM, NTRU, NTRU-Prime, MAYO, CROSS, UOV, and SNOVA.

```ts
import { toNistAlgorithmName, ALGORITHM_TO_NIST } from "@qnsp/crypto-inventory-sdk";

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
//   "sntrup761": "sntrup761",          // NTRU-Prime
//   "mayo-1": "MAYO-1",               // NIST Additional Signatures
//   "cross-rsdp-128-balanced": "CROSS-RSDP-128-balanced",
//   "ov-Is": "UOV-Is",
//   "snova-24-5-4": "SNOVA-24-5-4",
//   ... // 90 algorithms total
// }
```

## Key APIs

### Asset Management
- `CryptoInventoryClient.listAssets(request)` - List assets with filters
- `CryptoInventoryClient.getAsset(assetId)` - Get asset details
- `CryptoInventoryClient.deleteAsset(assetId)` - Delete asset

### Statistics
- `CryptoInventoryClient.getAssetStats(tenantId)` - Get asset statistics
- `CryptoInventoryClient.getPqcMigrationStatus(tenantId)` - Get PQC migration progress

### Discovery
- `CryptoInventoryClient.discoverAssets(request?)` - Trigger asset discovery
- `CryptoInventoryClient.getDiscoveryRuns(tenantId?, limit?)` - Get discovery history

### Utilities
- `toNistAlgorithmName(algorithm)` - Convert internal to NIST name
- `ALGORITHM_TO_NIST` - Algorithm name mapping

### Types
- `CryptoAsset` - Asset with algorithm and metadata
- `AssetStats` - Aggregated statistics
- `DiscoveryRun` - Discovery run status
- `AssetType` - "certificate" | "key" | "secret"
- `AssetSource` - "kms" | "vault" | "edge-gateway" | "external"
