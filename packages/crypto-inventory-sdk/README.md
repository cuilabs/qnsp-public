# @qnsp/crypto-inventory-sdk

TypeScript SDK client for the QNSP crypto-inventory-service API. Provides cryptographic asset discovery and inventory management.

Part of the [Quantum-Native Security Platform (QNSP)](https://qnsp.cuilabs.io).

## Installation

```bash
pnpm add @qnsp/crypto-inventory-sdk
```

## Quick Start

```typescript
import { CryptoInventoryClient } from "@qnsp/crypto-inventory-sdk";

const inventory = new CryptoInventoryClient({
  baseUrl: "https://api.qnsp.cuilabs.io",
  apiKey: "YOUR_API_KEY",
});

const assets = await inventory.listAssets({ tenantId: "your-tenant-id", limit: 50 });
const stats = await inventory.getAssetStats("your-tenant-id");
const migration = await inventory.getPqcMigrationStatus("your-tenant-id");
```

## Documentation

- [SDK Reference](https://docs.qnsp.cuilabs.io/sdk/crypto-inventory-sdk)
- [API Documentation](https://docs.qnsp.cuilabs.io/api)
- [Getting Started](https://docs.qnsp.cuilabs.io/quickstart)

## Requirements

- Node.js >= 24.12.0 (`engines` in `package.json`; QNSP monorepo baseline)
- A QNSP account and API key — [sign up free](https://cloud.qnsp.cuilabs.io/auth) with GitHub, Google, or email

## License

[Apache-2.0](./LICENSE)
