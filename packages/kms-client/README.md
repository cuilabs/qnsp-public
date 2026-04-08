# @qnsp/kms-client

KMS client for QNSP key management service. Post-quantum key generation, rotation, and cryptographic operations.

Part of the [Quantum-Native Security Platform (QNSP)](https://qnsp.cuilabs.io).

## Installation

```bash
pnpm add @qnsp/kms-client
```

## Quick Start

```typescript
import { HttpKmsServiceClient } from "@qnsp/kms-client";

const kms = new HttpKmsServiceClient(
  "https://api.qnsp.cuilabs.io",
  "YOUR_API_KEY",
);

const wrapped = await kms.wrapKey({
  tenantId: "your-tenant-id",
  dataKey: btoa("my-data-encryption-key"),
  keyId: "your-kms-key-id",
});

const unwrapped = await kms.unwrapKey({
  tenantId: "your-tenant-id",
  wrappedKey: wrapped.wrappedKey,
  keyId: wrapped.keyId,
});
```

## Documentation

- [SDK Reference](https://docs.qnsp.cuilabs.io/sdk/kms-client)
- [API Documentation](https://docs.qnsp.cuilabs.io/api)
- [Getting Started](https://docs.qnsp.cuilabs.io/quickstart)

## Requirements

- Node.js >= 24.12.0 (`engines` in `package.json`; QNSP monorepo baseline)
- A QNSP account and API key — [sign up free](https://cloud.qnsp.cuilabs.io/auth) with GitHub, Google, or email

## License

[Apache-2.0](./LICENSE)
