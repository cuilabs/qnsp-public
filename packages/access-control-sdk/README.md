# @qnsp/access-control-sdk

TypeScript client for the QNSP Access Control service. Manages policies, capability tokens, issuance,
introspection, and revocation for zero-trust enforcement.

## Installation

```bash
pnpm add @qnsp/access-control-sdk
```

## Authentication

Provide a **service token** via `apiKey`. Capability operations require privileged platform roles, so
ensure the token belongs to a tenant/automation authorized to issue policies.

```ts
import { AccessControlClient } from "@qnsp/access-control-sdk";

const ac = new AccessControlClient({
  baseUrl: "https://api.qnsp.cuilabs.io/proxy/access",
  apiKey: process.env.QNSP_SERVICE_TOKEN!,
});
```

## Tier requirements

Access-control features are available on paid tiers (`dev-pro` and above). The SDK does not enforce
tiers directly, but backend APIs will reject requests if the tenant lacks capability support.

## Usage example

```ts
import { AccessControlClient } from "@qnsp/access-control-sdk";

const ac = new AccessControlClient({
  baseUrl: "https://api.qnsp.cuilabs.io/proxy/access",
  apiKey: process.env.QNSP_SERVICE_TOKEN!,
});

const policy = await ac.createPolicy({
  tenantId: "tenant_123",
  name: "edge-writer",
  statement: {
    effect: "allow",
    actions: ["edge.routes.write"],
    resources: ["edge-route:*"],
  },
});

const capability = await ac.issueCapability({
  tenantId: "tenant_123",
  policyId: policy.id,
  subject: { type: "service", id: "edge-gateway" },
  issuedBy: "platform-api",
});
```

## Telemetry

Use the optional `telemetry` configuration (or `createAccessControlClientTelemetry`) to emit OTLP
metrics for every request (latency, retries, errors). These metrics power the Access Control dashboards
in `docs/observability/portal-dashboards.md`.

## Related documentation

- [Developer onboarding guide](../../docs/guides/developer-onboarding.md#sdk-quick-links)
- [SDK inventory](../../docs/technical/SDK-INVENTORY.md)
- [Tier limits](../shared-kernel/src/tier-limits.ts)

## License

Licensed under the Apache License, Version 2.0. See [`LICENSE`](./LICENSE).

© 2025 QNSP - CUI LABS, Singapore
