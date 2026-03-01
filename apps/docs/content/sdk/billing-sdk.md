---
title: Billing SDK (@qnsp/billing-sdk)
version: 0.1.0
last_updated: 2026-01-04
copyright: © 2025 CUI Labs. All rights reserved.
license: Apache-2.0
source_files:
  - /packages/billing-sdk/src/index.ts
---

# Billing SDK (`@qnsp/billing-sdk`)

TypeScript client for `billing-service`. Provides usage metering and invoice management.

## Install

```bash
pnpm install @qnsp/billing-sdk
```

## Create a client

```ts
import { BillingClient } from "@qnsp/billing-sdk";

const billing = new BillingClient({
	baseUrl: "https://api.qnsp.cuilabs.io",
	apiKey: "<access_token>",
});
```

## Ingest Usage Meters

```ts
await billing.ingestMeters({
	meters: [
		{
			tenantId: "<tenant_uuid>",
			source: "storage-service",
			meterType: "storage_bytes",
			quantity: 1073741824, // 1 GB
			unit: "bytes",
			recordedAt: new Date().toISOString(),
			metadata: { tier: "hot" },
			security: {
				controlPlaneTokenSha256: "<hash>",
				pqcSignatures: [],
				hardwareProvider: null,
				attestationStatus: null,
				attestationProof: null,
			},
		},
	],
});
```

## Create Invoices

```ts
const invoice = await billing.createInvoice({
	tenantId: "<tenant_uuid>",
	periodStart: "2026-01-01T00:00:00Z",
	periodEnd: "2026-01-31T23:59:59Z",
	lineItems: [
		{
			description: "Storage (Hot Tier)",
			quantity: 100,
			unitPriceCents: 250, // $2.50 per GB
			totalCents: 25000,
			meterType: "storage_bytes",
		},
		{
			description: "AI Inference",
			quantity: 1000,
			unitPriceCents: 10, // $0.10 per request
			totalCents: 10000,
			meterType: "ai_inference",
		},
	],
	currency: "USD",
	taxesCents: 3500,
	security: {
		controlPlaneTokenSha256: "<hash>",
		pqcSignatures: [],
		hardwareProvider: null,
		attestationStatus: null,
		attestationProof: null,
	},
});
```

## List Invoices

```ts
const { items, nextCursor } = await billing.listInvoices("<tenant_uuid>", {
	limit: 20,
});

// Paginate
let cursor = nextCursor;
while (cursor) {
	const page = await billing.listInvoices("<tenant_uuid>", { cursor });
	// Process page.items
	cursor = page.nextCursor;
}
```

## Key APIs

### Usage Metering
- `BillingClient.ingestMeters(request)` - Batch ingest usage meters

### Invoice Management
- `BillingClient.createInvoice(request)` - Create invoice from line items
- `BillingClient.listInvoices(tenantId, options?)` - List tenant invoices

### Types
- `Meter` - Usage meter with security envelope
- `Invoice` - Invoice with line items and totals
- `InvoiceLineItem` - Individual line item
- `BillingSecurityEnvelope` - PQC security metadata
