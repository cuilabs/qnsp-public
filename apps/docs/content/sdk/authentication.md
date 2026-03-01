---
title: SDK Authentication
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# SDK Authentication

SDKs authenticate by sending `Authorization: Bearer <token>`.

## Credential types

### User login (auth-service)
Use `@qnsp/auth-sdk` to obtain an access token.

```typescript
import { AuthClient } from "@qnsp/auth-sdk";

const auth = new AuthClient({
	baseUrl: "http://localhost:8081",
	apiKey: process.env.QNSP_API_KEY,
});

const token = await auth.login({
	email: "user@example.com",
	password: "<password>",
	tenantId: "<tenant_uuid>",
});
```

### Service token (service accounts)
For server-to-server integrations, request a service token and use it as a Bearer token.

```typescript
import { requestServiceToken } from "@qnsp/auth-sdk";

const token = await requestServiceToken({
	authServiceUrl: "http://localhost:8081",
	serviceId: "<service_id>",
	serviceSecret: "<service_secret>",
	audience: "internal-service",
});
```

### Using a token with other SDKs

```typescript
import { VaultClient } from "@qnsp/vault-sdk";

const vault = new VaultClient({
	baseUrl: "http://localhost:8090",
	apiKey: token.accessToken,
});
```

## Refresh tokens

If you use refresh tokens, call `auth.refreshToken(...)` and update the `apiKey` you pass to other clients.
