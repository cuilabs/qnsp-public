# @qnsp/vault-sdk

TypeScript SDK client for the QNSP vault-service API. Provides secret management with envelope encryption, versioning, and rotation.

Part of the [Quantum-Native Security Platform (QNSP)](https://qnsp.cuilabs.io).

## Installation

```bash
pnpm add @qnsp/vault-sdk
```

## Quick Start

```typescript
import { VaultClient } from "@qnsp/vault-sdk";

const vault = new VaultClient({
  baseUrl: "https://api.qnsp.cuilabs.io",
  apiKey: "YOUR_API_KEY",
});

const secret = await vault.createSecret({
  tenantId: "your-tenant-id",
  name: "db/credentials",
  payload: btoa(JSON.stringify({ user: "admin", pass: "s3cret" })),
});

const retrieved = await vault.getSecret(secret.id);
```

## Documentation

- [SDK Reference](https://docs.qnsp.cuilabs.io/sdk/vault-sdk)
- [API Documentation](https://docs.qnsp.cuilabs.io/api)
- [Getting Started](https://docs.qnsp.cuilabs.io/quickstart)

## Requirements

- Node.js >= 24.12.0 (`engines` in `package.json`; QNSP monorepo baseline)
- A QNSP account and API key — [sign up free](https://cloud.qnsp.cuilabs.io/auth) with GitHub, Google, or email

## License

[Apache-2.0](./LICENSE)
