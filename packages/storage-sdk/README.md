# @qnsp/storage-sdk

TypeScript SDK client for the QNSP storage-service API.

Part of the [Quantum-Native Security Platform (QNSP)](https://qnsp.cuilabs.io).

## Installation

```bash
pnpm add @qnsp/storage-sdk
```

## Quick Start

```typescript
import { StorageClient } from "@qnsp/storage-sdk";

const storage = new StorageClient({
  baseUrl: "https://api.qnsp.cuilabs.io",
  apiKey: "YOUR_API_KEY",
  tenantId: "your-tenant-id",
});

const upload = await storage.initiateUpload({
  name: "report.pdf",
  mimeType: "application/pdf",
  sizeBytes: data.byteLength,
});

await storage.uploadPart(upload.uploadId, 1, data);
await storage.completeUpload(upload.uploadId);
```

## Documentation

- [SDK Reference](https://docs.qnsp.cuilabs.io/sdk/storage-sdk)
- [API Documentation](https://docs.qnsp.cuilabs.io/api)
- [Getting Started](https://docs.qnsp.cuilabs.io/quickstart)

## Requirements

- Node.js >= 24.12.0 (`engines` in `package.json`; QNSP monorepo baseline)
- A QNSP account and API key — [sign up free](https://cloud.qnsp.cuilabs.io/auth) with GitHub, Google, or email

## License

[Apache-2.0](./LICENSE)
