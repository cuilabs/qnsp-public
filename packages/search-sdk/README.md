# @qnsp/search-sdk

TypeScript SDK for QNSP search-service (indexing, querying, SSE token helpers).

Part of the [Quantum-Native Security Platform (QNSP)](https://qnsp.cuilabs.io).

## Installation

```bash
pnpm add @qnsp/search-sdk
```

## Quick Start

```typescript
import { SearchClient } from "@qnsp/search-sdk";

const search = new SearchClient({
  baseUrl: "https://api.qnsp.cuilabs.io",
  apiKey: "YOUR_API_KEY",
});

await search.indexDocuments("my-index", [
  { id: "doc-1", content: "quantum-safe storage overview" },
]);

const results = await search.query("my-index", { text: "post-quantum encryption" });
```

## Documentation

- [SDK Reference](https://docs.qnsp.cuilabs.io/sdk/search-sdk)
- [API Documentation](https://docs.qnsp.cuilabs.io/api)
- [Getting Started](https://docs.qnsp.cuilabs.io/quickstart)

## Requirements

- Node.js >= 24.12.0 (`engines` in `package.json`; QNSP monorepo baseline)
- A QNSP account and API key — [sign up free](https://cloud.qnsp.cuilabs.io/auth) with GitHub, Google, or email

## License

[Apache-2.0](./LICENSE)
