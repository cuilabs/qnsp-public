# @qnsp/vault-sdk

TypeScript client for the QNSP Vault service. Manages secrets with PQC envelope encryption, version
history, rotation policies, and metadata auditing.

## Installation

```bash
pnpm add @qnsp/vault-sdk
```

## Authentication

Provide a **service token** via `apiKey`. Vault access is scoped per tenant, so ensure the token maps
to the tenant you plan to manage secrets for. Optional `tier` lets the SDK fail fast for insufficient
plans.

```ts
import { VaultClient } from "@qnsp/vault-sdk";

const vault = new VaultClient({
  baseUrl: "https://api.qnsp.cuilabs.io/proxy/vault",
  apiKey: process.env.QNSP_SERVICE_TOKEN!,
  tier: "dev-pro",
});
```

## Tier requirements

| Capability | Minimum tier | Notes |
|------------|--------------|-------|
| Core secret CRUD | `dev-pro` | Enforced via `checkTierAccess("vault", tier)` in constructor |
| Rotation policies, PQC metadata | `dev-pro` | Same requirement |
| Enclave-backed secret provisioning | `enterprise-standard` | Triggered by backend when `enclaves` required |

## Usage example

```ts
import { VaultClient } from "@qnsp/vault-sdk";

const vault = new VaultClient({
  baseUrl: "https://api.qnsp.cuilabs.io/proxy/vault",
  apiKey: process.env.QNSP_SERVICE_TOKEN!,
  tier: "dev-pro",
});

const secret = await vault.createSecret({
  tenantId: "tenant_123",
  name: "db-password",
  payload: Buffer.from("super-secret").toString("base64"),
  metadata: { env: "prod" },
  rotationPolicy: { intervalSeconds: 86_400 },
});

await vault.rotateSecret(secret.id, {
  tenantId: "tenant_123",
  newPayload: Buffer.from("rotated-secret").toString("base64"),
});
```

## Telemetry

Set the `telemetry` option (or pass config to `createVaultClientTelemetry`) to emit OTLP spans for each
request, including retries and HTTP codes. This data feeds the Vault dashboards in
`docs/observability/portal-dashboards.md`.

## Related documentation

- [Developer onboarding guide](../../docs/guides/developer-onboarding.md#sdk-quick-links)
- [SDK inventory](../../docs/technical/SDK-INVENTORY.md)
- [Tier limits](../shared-kernel/src/tier-limits.ts)

## License

Licensed under the Apache License, Version 2.0. See [`LICENSE`](./LICENSE).

© 2025 QNSP - CUI LABS, Singapore
