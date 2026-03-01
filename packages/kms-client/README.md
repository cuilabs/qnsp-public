# @qnsp/kms-client

TypeScript client for the QNSP KMS service. Provides a lightweight HTTP client for wrapping and unwrapping data keys using tenant-scoped KMS keys.

## Installation

```bash
pnpm add @qnsp/kms-client
```

## Authentication

You can authenticate either by:

- passing a bearer token string as the second constructor argument, or
- providing a custom `getAuthHeader()` function.

```ts
import { HttpKmsServiceClient } from "@qnsp/kms-client";

const kms = new HttpKmsServiceClient(
  "https://api.qnsp.cuilabs.io/proxy/kms",
  process.env.QNSP_SERVICE_TOKEN,
);
```

## Usage example

```ts
import { HttpKmsServiceClient } from "@qnsp/kms-client";

const kms = new HttpKmsServiceClient(
  "https://api.qnsp.cuilabs.io/proxy/kms",
  process.env.QNSP_SERVICE_TOKEN,
);

const wrapped = await kms.wrapKey({
  tenantId: "tenant_123",
  keyId: "key_abc",
  dataKey: "...base64...",
});

const unwrapped = await kms.unwrapKey({
  tenantId: "tenant_123",
  keyId: "key_abc",
  wrappedKey: wrapped.wrappedKey,
});
```

## License

Licensed under the Apache License, Version 2.0. See [`LICENSE`](./LICENSE).

© 2025 QNSP - CUI LABS, Singapore
