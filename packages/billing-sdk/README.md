# @qnsp/billing-sdk

TypeScript SDK client for the QNSP billing-service API. Provides usage meter ingestion and invoice management.

Part of the [Quantum-Native Security Platform (QNSP)](https://qnsp.cuilabs.io).

## Installation

```bash
pnpm add @qnsp/billing-sdk
```

## Quick Start

```typescript
import { BillingClient } from "@qnsp/billing-sdk";

const billing = new BillingClient({
  baseUrl: "https://api.qnsp.cuilabs.io",
  apiKey: "YOUR_API_KEY",
});

await billing.ingestMeters({
  meters: [{ tenantId: "your-tenant-id", source: "api", meterType: "api-calls", quantity: 150, unit: "count", recordedAt: new Date().toISOString(), security: { controlPlaneTokenSha256: null, pqcSignatures: [], hardwareProvider: null, attestationStatus: null, attestationProof: null } }],
});

const invoices = await billing.listInvoices("your-tenant-id");
```

## Documentation

- [SDK Reference](https://docs.qnsp.cuilabs.io/sdk/billing-sdk)
- [API Documentation](https://docs.qnsp.cuilabs.io/api)
- [Getting Started](https://docs.qnsp.cuilabs.io/quickstart)

## Requirements

- Node.js >= 24.12.0 (`engines` in `package.json`; QNSP monorepo baseline)
- A QNSP account and API key — [sign up free](https://cloud.qnsp.cuilabs.io/auth) with GitHub, Google, or email

## License

[Apache-2.0](./LICENSE)
