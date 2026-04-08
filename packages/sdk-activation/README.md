# @qnsp/sdk-activation

SDK activation and usage metering for QNSP platform SDKs. Ensures all SDK usage is tied to a registered QNSP account.

Part of the [Quantum-Native Security Platform (QNSP)](https://qnsp.cuilabs.io).

> **Note:** This is an internal package used by other `@qnsp/*` SDKs. You typically do not need to install or use it directly.

## Installation

```bash
pnpm add @qnsp/sdk-activation
```

## Quick Start

```typescript
import { activateSdk } from "@qnsp/sdk-activation";

// Called internally by QNSP SDKs during initialization
await activateSdk({
  apiKey: "YOUR_API_KEY",
  sdkId: "vault-sdk",
  sdkVersion: "0.3.0",
  platformUrl: "https://api.qnsp.cuilabs.io",
});
```

## Documentation

- [SDK Reference](https://docs.qnsp.cuilabs.io/sdk/sdk-activation)
- [API Documentation](https://docs.qnsp.cuilabs.io/api)
- [Getting Started](https://docs.qnsp.cuilabs.io/quickstart)

## Requirements

- Node.js >= 24.12.0 (`engines` in `package.json`; QNSP monorepo baseline)
- A QNSP account and API key — [sign up free](https://cloud.qnsp.cuilabs.io/auth) with GitHub, Google, or email

## License

[Apache-2.0](./LICENSE)
