# @qnsp/tenant-sdk

TypeScript SDK client for the QNSP tenant-service API. Provides tenant lifecycle and subscription management.

Part of the [Quantum-Native Security Platform (QNSP)](https://qnsp.cuilabs.io).

## Installation

```bash
pnpm add @qnsp/tenant-sdk
```

## Quick Start

```typescript
import { TenantClient } from "@qnsp/tenant-sdk";

const tenants = new TenantClient({
  baseUrl: "https://api.qnsp.cuilabs.io",
  apiKey: "YOUR_API_KEY",
});

const tenant = await tenants.getTenant("your-tenant-id");
const list = await tenants.listTenants({ limit: 20 });
```

## Documentation

- [SDK Reference](https://docs.qnsp.cuilabs.io/sdk/tenant-sdk)
- [API Documentation](https://docs.qnsp.cuilabs.io/api)
- [Getting Started](https://docs.qnsp.cuilabs.io/quickstart)

## Requirements

- Node.js >= 24.12.0 (`engines` in `package.json`; QNSP monorepo baseline)
- A QNSP account and API key — [sign up free](https://cloud.qnsp.cuilabs.io/auth) with GitHub, Google, or email

## License

[Apache-2.0](./LICENSE)
