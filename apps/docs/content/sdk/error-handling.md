---
title: SDK Error Handling
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
license: Apache-2.0
source_files:
  - /packages/auth-sdk/src/errors.ts
  - /packages/vault-sdk/src/errors.ts
---

# SDK Error Handling

How SDKs handle and expose errors.

## Error Types

SDKs throw standard `Error` instances.

```typescript
import { AuthClient } from "@qnsp/auth-sdk";

const auth = new AuthClient({
	baseUrl: "https://api.qnsp.cuilabs.io",
	apiKey: process.env.QNSP_API_KEY,
});

try {
	await auth.login({ email: "invalid", password: "x", tenantId: "not-a-uuid" });
} catch (error) {
	if (error instanceof Error) {
		console.log(error.message);
	}
}
```

Non-TypeScript SDKs are not available in this repo.
