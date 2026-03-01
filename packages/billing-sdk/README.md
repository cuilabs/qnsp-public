# @qnsp/billing-sdk

TypeScript client for the QNSP Billing service. Handles meter ingestion, invoice creation, invoice
listing, and PQC signature envelopes for financial records.

## Installation

```bash
pnpm add @qnsp/billing-sdk
```

## Authentication

Provide a **service token** via `apiKey`. Billing operations must be performed by privileged tenants or
platform automations; the SDK forwards the signed security envelope you attach to each request.

```ts
import { BillingClient } from "@qnsp/billing-sdk";

const billing = new BillingClient({
  baseUrl: "https://api.qnsp.cuilabs.io",
  apiKey: process.env.QNSP_SERVICE_TOKEN!,
});
```

## Tier requirements

Billing APIs are available on all tiers for viewing invoices. Meter ingestion and invoice creation are
restricted to platform/partner roles that typically operate on paid tiers, but there are no SDK-side
checks.

## Usage example

```ts
import { BillingClient } from "@qnsp/billing-sdk";

const billing = new BillingClient({
  baseUrl: "https://api.qnsp.cuilabs.io",
  apiKey: process.env.QNSP_SERVICE_TOKEN!,
});

await billing.ingestMeters({
  meters: [
    {
      tenantId: "tenant_123",
      source: "storage-service",
      meterType: "storage_gb_hours",
      quantity: 120,
      unit: "GB-hour",
      recordedAt: new Date().toISOString(),
      security: {
        controlPlaneTokenSha256: "...",
        pqcSignatures: [],
        hardwareProvider: null,
        attestationStatus: null,
        attestationProof: null,
      },
    },
  ],
});

const invoices = await billing.listInvoices({ tenantId: "tenant_123" });
```

## Telemetry

Set the optional `telemetry` option (or pass config to `createBillingClientTelemetry`) to emit
OpenTelemetry events for every request, including retries and latency percentiles. Dashboards live in
`docs/observability/portal-dashboards.md`.

## Related documentation

- [Developer onboarding guide](../../docs/guides/developer-onboarding.md#sdk-quick-links)
- [SDK inventory](../../docs/technical/SDK-INVENTORY.md)
- [Tier limits](../shared-kernel/src/tier-limits.ts)

## License

Licensed under the Apache License, Version 2.0. See [`LICENSE`](./LICENSE).

© 2025 QNSP - CUI LABS, Singapore
