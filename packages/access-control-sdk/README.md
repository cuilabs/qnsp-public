# @qnsp/access-control-sdk

TypeScript SDK client for the QNSP access-control-service API. Provides policy management and capability token operations.

Part of the [Quantum-Native Security Platform (QNSP)](https://qnsp.cuilabs.io).

## Installation

```bash
pnpm add @qnsp/access-control-sdk
```

## Quick Start

```typescript
import { AccessControlClient } from "@qnsp/access-control-sdk";

const acl = new AccessControlClient({
  baseUrl: "https://api.qnsp.cuilabs.io",
  apiKey: "YOUR_API_KEY",
});

const policy = await acl.createPolicy({
  tenantId: "your-tenant-id",
  name: "vault-read",
  statement: {
    effect: "allow",
    actions: ["vault:read"],
    resources: ["secret:*"],
  },
});

const capability = await acl.issueCapability({
  tenantId: "your-tenant-id",
  policyId: policy.id,
  subject: { type: "user", id: "user-id" },
  issuedBy: "admin",
});
```

## Documentation

- [SDK Reference](https://docs.qnsp.cuilabs.io/sdk/access-control-sdk)
- [API Documentation](https://docs.qnsp.cuilabs.io/api)
- [Getting Started](https://docs.qnsp.cuilabs.io/quickstart)

## Requirements

- Node.js >= 24.12.0 (`engines` in `package.json`; QNSP monorepo baseline)
- A QNSP account and API key — [sign up free](https://cloud.qnsp.cuilabs.io/auth) with GitHub, Google, or email

## License

[Apache-2.0](./LICENSE)
