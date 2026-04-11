# @qnsp/autogen-qnsp

AutoGen executor for QNSP AI orchestration.

## Install

```bash
pnpm add @qnsp/autogen-qnsp autogen
```

## Usage

```ts
import { QnspExecutor } from "@qnsp/autogen-qnsp";

const executor = new QnspExecutor({
	apiKey: process.env.QNSP_API_KEY!,
});
```

The executor activates through `@qnsp/sdk-activation`, resolves tenant context from the API key, and submits workloads to QNSP AI orchestration endpoints.

Docs: https://docs.qnsp.cuilabs.io/sdk/autogen-qnsp
