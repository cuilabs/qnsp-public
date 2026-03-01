# @qnsp/auth-sdk

TypeScript client for the QNSP Auth service. Provides login flows, refresh tokens, FIDO2/WebAuthn
passkeys, MFA, SAML/OIDC federation, and service-to-service token issuance.

## Installation

```bash
pnpm add @qnsp/auth-sdk
```

## Authentication

Most methods require an **API key / service token** generated from the Auth service (or issued via the
cloud portal). Provide it through the `apiKey` option when instantiating `AuthClient`. Service clients
can also call `ServiceTokenClient` with their service ID/secret to mint PQC-signed access tokens.

```ts
import { AuthClient } from "@qnsp/auth-sdk";

const auth = new AuthClient({
  baseUrl: "https://auth.qnsp.cuilabs.io",
  apiKey: process.env.QNSP_SERVICE_TOKEN!,
  timeoutMs: 15_000,
});
```

## Tier requirements

Authentication is available on **all tiers**. Higher tiers unlock more tenants and advanced federation
options, but the SDK does not enforce tier checks. Backend services evaluate quotas via shared kernel
limits.

## Usage example

```ts
import { AuthClient } from "@qnsp/auth-sdk";

const auth = new AuthClient({
  baseUrl: "https://api.qnsp.cuilabs.io",
  apiKey: process.env.QNSP_SERVICE_TOKEN,
});

// Email/password login with optional TOTP
const { accessToken, refreshToken } = await auth.login({
  email: "dev@example.com",
  password: "P@ssw0rd!",
  tenantId: "tenant_123",
});

// Start WebAuthn passkey registration
const registration = await auth.startWebAuthnRegistration({
  userId: "user_456",
  tenantId: "tenant_123",
});
```

## Telemetry

Pass `telemetry` (either an instance or `createAuthClientTelemetry` config) to emit OpenTelemetry
metrics such as request durations, failures, and retry counts. This data feeds the Auth dashboards in
`docs/observability/portal-dashboards.md`.

## Related documentation

- [Developer onboarding guide](../../docs/guides/developer-onboarding.md#sdk-quick-links)
- [SDK inventory](../../docs/technical/SDK-INVENTORY.md)
- [Tier limits](../shared-kernel/src/tier-limits.ts)

## License

Licensed under the Apache License, Version 2.0. See [`LICENSE`](./LICENSE).

© 2025 QNSP - CUI LABS, Singapore
