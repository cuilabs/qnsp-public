# @qnsp/storage-sdk

TypeScript SDK for the QNSP storage service. Supports multipart uploads, downloads, lifecycle
policies, legal holds, compliance metadata, and event subscriptions.

## Installation

```bash
pnpm add @qnsp/storage-sdk
```

## Authentication

Authenticate with a **service token** (issued by `auth-service` or the cloud portal API key UI) and
pass it to `apiKey`. Set `tenantId` to scope quotas and telemetry labels.

```ts
import { StorageClient, createStorageClientTelemetry } from "@qnsp/storage-sdk";

const storage = new StorageClient({
  baseUrl: "https://api.qnsp.cuilabs.io/proxy/storage",
  apiKey: process.env.QNSP_SERVICE_TOKEN,
  tenantId: "tenant_123",
  telemetry: createStorageClientTelemetry({
    serviceName: "storage-uploader",
    serviceVersion: "1.0.0",
    otlpEndpoint: process.env.OTLP_ENDPOINT!,
  }),
});
```

## Tier requirements

| Capability | Minimum tier | Notes |
|------------|--------------|-------|
| Upload/download, lifecycle, compliance | `free` | Included in Always Free tier (5GB, 2,000 API calls) |
| Extended storage quotas | Based on paid tier | Limits enforced by backend using `@qnsp/shared-kernel` |

All tenants can instantiate the SDK, but exceeding tier quotas triggers backend `TierError`
responses. Upgrade at <https://cloud.qnsp.cuilabs.io/billing>.

## Usage example

```ts
import {
  StorageClient,
  StorageEventsClient,
  createStorageClientTelemetry,
} from "@qnsp/storage-sdk";

const client = new StorageClient({
  baseUrl: "https://storage.example.com",
  apiKey: process.env.QNSP_SERVICE_TOKEN!,
  tenantId: "tenant_123",
});

const upload = await client.initiateUpload({
  name: "document.pdf",
  mimeType: "application/pdf",
  sizeBytes: 1024 * 1024,
  classification: "confidential",
});

await client.uploadPart(upload.uploadId, 1, part1Data);
await client.uploadPart(upload.uploadId, 2, part2Data);

const result = await client.completeUpload(upload.uploadId);
const stream = await client.downloadStream(result.documentId, result.version);

const events = new StorageEventsClient({ baseUrl: "https://storage.example.com" });
const replicationEvents = await events.fetchEvents("storage.document.replicated");
```

## Telemetry

Pass the optional `telemetry` property (either an instance or `createStorageClientTelemetry`
configuration) to emit OpenTelemetry metrics via OTLP HTTP exporter. Metrics include:

- `storage_sdk_requests_total`
- `storage_sdk_request_failures_total`
- `storage_sdk_request_duration_ms`
- `storage_sdk_bytes_total`

See `docs/observability/portal-dashboards.md` for dashboards powered by these metrics.

## Related documentation

- [Developer onboarding guide](../../docs/guides/developer-onboarding.md#sdk-quick-links)
- [Storage service plan](../../docs/service-plans/storage-service-plan.md)
- [Tier limits](../shared-kernel/src/tier-limits.ts)

## License

Licensed under the Apache License, Version 2.0. See [`LICENSE`](./LICENSE).

© 2025 QNSP - CUI LABS, Singapore

