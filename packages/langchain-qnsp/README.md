# @qnsp/langchain-qnsp

LangChain toolkit for QNSP vault, KMS, and audit services.

## Install

```bash
pnpm add @qnsp/langchain-qnsp @langchain/core
```

## Usage

```ts
import { QnspToolkit } from "@qnsp/langchain-qnsp";

const toolkit = new QnspToolkit({
	apiKey: process.env.QNSP_API_KEY!,
});
```

The toolkit uses QNSP SDK activation and billing-backed entitlements before exposing tenant-scoped tools.

Docs: https://docs.qnsp.cuilabs.io/sdk/langchain-qnsp
