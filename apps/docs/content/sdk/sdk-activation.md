---
title: "SDK Activation"
description: "How QNSP SDKs activate and verify licensing at startup — transparent to end developers, no manual steps required."
version: 0.0.1
last_updated: 2026-04-01
copyright: © 2025 CUI Labs. All rights reserved.
license: BSL-1.1
---
# SDK Activation

All `@qnsp/*` SDKs perform a lightweight activation handshake when first initialised. This ties SDK usage to a registered QNSP account and enforces entitlement checks without requiring any additional code from the developer.

## How it works

When you call `new VaultClient(config)` (or any other SDK constructor), the SDK internally calls `activateSdk()` from `@qnsp/sdk-activation`:

1. Validates the API key format
2. Sends a lightweight activation request to `https://api.qnsp.cuilabs.io`
3. Receives a signed activation receipt valid for the session
4. All subsequent API calls include the activation receipt for entitlement enforcement

This happens **once per SDK instance** and adds less than 50 ms on a cold start.

## Developer experience

No code changes required. The activation is transparent:

```typescript
import { VaultClient } from "@qnsp/vault-sdk";

// Activation happens here automatically
const vault = new VaultClient({
  apiKey: process.env.QNSP_API_KEY!,
  tenantId: process.env.QNSP_TENANT_ID!,
});

// All subsequent calls are already activated
const secret = await vault.createSecret({ name: "db-password", value: "s3cr3t" });
```

## Activation errors

If activation fails, the SDK constructor throws an `ActivationError` with a `code` field:

| Code | Meaning |
|---|---|
| `INVALID_API_KEY` | API key format is invalid or the key does not exist |
| `TENANT_SUSPENDED` | Your QNSP tenant has been suspended — contact support |
| `ENTITLEMENT_MISSING` | Your plan does not include this SDK — upgrade at [cloud.qnsp.cuilabs.io](https://cloud.qnsp.cuilabs.io) |
| `ACTIVATION_TIMEOUT` | Could not reach the QNSP platform within the timeout — check connectivity |
| `ACTIVATION_FAILED` | Unexpected activation failure — retry or contact support |

```typescript
import { ActivationError } from "@qnsp/sdk-activation";

try {
  const vault = new VaultClient({ apiKey, tenantId });
} catch (err) {
  if (err instanceof ActivationError) {
    console.error("Activation failed:", err.code, err.message);
  }
  throw err;
}
```

## Offline / air-gapped environments

For air-gapped deployments where outbound calls to `api.qnsp.cuilabs.io` are not permitted, contact your QNSP account team to obtain a **static activation token**. Pass it via the `activationToken` option:

```typescript
const vault = new VaultClient({
  apiKey: process.env.QNSP_API_KEY!,
  tenantId: process.env.QNSP_TENANT_ID!,
  activationToken: process.env.QNSP_ACTIVATION_TOKEN,
});
```

Static tokens are cryptographically signed and have a fixed expiry date agreed with your account team.

## Related

- [SDK Overview](./overview)
- [Configuration](./configuration)
- [Error Handling](./error-handling)
- [API Authentication](../api/authentication)
