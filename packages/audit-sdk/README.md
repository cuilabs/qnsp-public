# @qnsp/audit-sdk

TypeScript SDK client for the QNSP audit-service API. Provides audit log querying and compliance reporting.

Part of the [Quantum-Native Security Platform (QNSP)](https://qnsp.cuilabs.io).

## Installation

```bash
pnpm add @qnsp/audit-sdk
```

## Quick Start

```typescript
import { AuditClient } from "@qnsp/audit-sdk";

const audit = new AuditClient({
  baseUrl: "https://api.qnsp.cuilabs.io",
  apiKey: "YOUR_API_KEY",
});

const logs = await audit.listEvents({
  tenantId: "your-tenant-id",
  topic: "secret.read",
  since: "2025-01-01T00:00:00Z",
  limit: 50,
});
```

## Documentation

- [SDK Reference](https://docs.qnsp.cuilabs.io/sdk/audit-sdk)
- [API Documentation](https://docs.qnsp.cuilabs.io/api)
- [Getting Started](https://docs.qnsp.cuilabs.io/quickstart)

## Requirements

- Node.js >= 24.12.0 (`engines` in `package.json`; QNSP monorepo baseline)
- A QNSP account and API key — [sign up free](https://cloud.qnsp.cuilabs.io/auth) with GitHub, Google, or email

## License

[Apache-2.0](./LICENSE)
