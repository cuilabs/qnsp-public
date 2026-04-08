# @qnsp/auth-sdk

TypeScript SDK client for the QNSP auth-service API. Provides authentication, token management, WebAuthn, MFA, and federation.

Part of the [Quantum-Native Security Platform (QNSP)](https://qnsp.cuilabs.io).

## Installation

```bash
pnpm add @qnsp/auth-sdk
```

## Quick Start

```typescript
import { AuthClient } from "@qnsp/auth-sdk";

const auth = new AuthClient({
  baseUrl: "https://api.qnsp.cuilabs.io",
  apiKey: "YOUR_API_KEY",
});

const tokens = await auth.login({
  email: "user@example.com",
  password: "••••••••",
  tenantId: "your-tenant-id",
});

const refreshed = await auth.refreshToken({ refreshToken: tokens.refreshToken!.token });
```

## OAuth / Social Sign-In

QNSP supports one-click sign-up and sign-in via GitHub and Google. OAuth is handled by the QNSP Cloud Portal BFF — no SDK code required for the OAuth flow itself.

**Sign up or sign in at:** [cloud.qnsp.cuilabs.io/auth](https://cloud.qnsp.cuilabs.io/auth)

Supported providers:
- **GitHub** — authorizes via `github.com/login/oauth/authorize`, scopes: `user:email read:user`
- **Google** — authorizes via `accounts.google.com/o/oauth2/v2/auth`, scopes: `openid email profile`

After OAuth sign-in completes, QNSP issues a PQC-signed JWT (ML-DSA) and a refresh token — identical to password-based sessions. Use the `AuthClient` for all subsequent token operations (refresh, revoke, introspect).

```typescript
const refreshed = await auth.refreshToken({ refreshToken: storedRefreshToken });
```

For WebAuthn passkey authentication:

```typescript
const challenge = await auth.startPasskeyAuthentication({ tenantId: "your-tenant-id" });
const assertion = await navigator.credentials.get({ publicKey: challenge.publicKeyOptions });
const session = await auth.completePasskeyAuthentication({ tenantId: "your-tenant-id", assertion });
```

## Documentation

- [SDK Reference](https://docs.qnsp.cuilabs.io/sdk/auth-sdk)
- [API Documentation](https://docs.qnsp.cuilabs.io/api)
- [Getting Started](https://docs.qnsp.cuilabs.io/quickstart)

## Requirements

- Node.js >= 24.12.0 (`engines` in `package.json`; QNSP monorepo baseline)
- A QNSP account and API key — [sign up free](https://cloud.qnsp.cuilabs.io/auth) with GitHub, Google, or email

## License

[Apache-2.0](./LICENSE)
