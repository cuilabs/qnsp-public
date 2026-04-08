# @qnsp/ai-sdk

TypeScript SDK client for the QNSP AI orchestration service. Provides secure AI workload management, enclave inference, and encrypted training.

Part of the [Quantum-Native Security Platform (QNSP)](https://qnsp.cuilabs.io).

## Installation

```bash
pnpm add @qnsp/ai-sdk
```

## Quick Start

```typescript
import { AiOrchestratorClient } from "@qnsp/ai-sdk";

const ai = new AiOrchestratorClient({
  baseUrl: "https://api.qnsp.cuilabs.io",
  apiKey: "YOUR_API_KEY",
});

const result = await ai.runInference({
  model: "my-model",
  input: { prompt: "Summarize the quarterly report" },
});
```

## Documentation

- [SDK Reference](https://docs.qnsp.cuilabs.io/sdk/ai-sdk)
- [API Documentation](https://docs.qnsp.cuilabs.io/api)
- [Getting Started](https://docs.qnsp.cuilabs.io/quickstart)

## Requirements

- Node.js >= 24.12.0 (`engines` in `package.json`; QNSP monorepo baseline)
- A QNSP account and API key — [sign up free](https://cloud.qnsp.cuilabs.io/auth) with GitHub, Google, or email

## License

[Apache-2.0](./LICENSE)
