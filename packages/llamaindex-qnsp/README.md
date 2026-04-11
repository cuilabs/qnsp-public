# @qnsp/llamaindex-qnsp

LlamaIndex adapter for QNSP encrypted search and storage.

## Install

```bash
pnpm add @qnsp/llamaindex-qnsp llamaindex
```

## Usage

```ts
import { QnspVectorStore } from "@qnsp/llamaindex-qnsp";

const store = new QnspVectorStore({
	apiKey: process.env.QNSP_API_KEY!,
});
```

The package activates through `@qnsp/sdk-activation`, resolves the tenant from the API key, and uses QNSP billing limits as the source of truth.

Docs: https://docs.qnsp.cuilabs.io/sdk/llamaindex-qnsp
