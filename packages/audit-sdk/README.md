# @qnsp/audit-sdk

TypeScript client for the QNSP Audit service. Retrieves PQC-signed audit logs, compliance events, and
supports ingestion for internal services.

## Installation

```bash
pnpm add @qnsp/audit-sdk
```

## Authentication

Provide a **service token** via `apiKey`. Tenants typically receive read-only access, while platform
services can ingest events.

```ts
import { AuditClient } from "@qnsp/audit-sdk";

const audit = new AuditClient({
  baseUrl: "https://api.qnsp.cuilabs.io/proxy/audit",
  apiKey: process.env.QNSP_SERVICE_TOKEN!,
});
```

## Tier requirements

Audit read APIs are available on all paid tiers (dev-starter and above). Write/ingest APIs are limited
to platform automations. The SDK does not perform tier checks; backend services enforce limits.

## Usage example

```ts
import { AuditClient } from "@qnsp/audit-sdk";

const audit = new AuditClient({
  baseUrl: "https://api.qnsp.cuilabs.io/proxy/audit",
  apiKey: process.env.QNSP_SERVICE_TOKEN!,
});

const events = await audit.listEvents({
  tenantId: "tenant_123",
  topic: "storage.document.uploaded",
  limit: 50,
});

await audit.ingestEvents({
  events: events.items.slice(0, 1),
});
```

## Telemetry

Configure `telemetry` (or pass config to `createAuditClientTelemetry`) to emit OpenTelemetry metrics for
each API request. These metrics feed the Audit dashboards referenced in
`docs/observability/portal-dashboards.md`.

## Related documentation

- [Developer onboarding guide](../../docs/guides/developer-onboarding.md#sdk-quick-links)
- [SDK inventory](../../docs/technical/SDK-INVENTORY.md)
- [Tier limits](../shared-kernel/src/tier-limits.ts)

## License

Licensed under the Apache License, Version 2.0. See [`LICENSE`](./LICENSE).

© 2025 QNSP - CUI LABS, Singapore
