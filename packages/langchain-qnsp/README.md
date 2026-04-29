# @qnsp/langchain-qnsp

LangChain toolkit for QNSP vault, KMS, and audit services.

> **v0.1.7 — `await toolkit.activate()` is now required** before `getTools()`. See [Migration from v0.1.x](#migration-from-v01x) below. A free QNSP API key takes 60 seconds at <https://cloud.qnsp.cuilabs.io/auth>.

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
await toolkit.activate(); // required since v0.1.7

const tools = toolkit.getTools(); // throws if activate() was not called
```

`activate()` performs a one-shot handshake against the QNSP billing-service to validate your API key, resolve the tenant ID, and capture tier limits. The handshake result is cached in memory; repeated calls are cheap.

## Migration from v0.1.x

```diff
  const toolkit = new QnspToolkit({ apiKey: process.env.QNSP_API_KEY! });
+ await toolkit.activate();
  const tools = toolkit.getTools();
```

Why: in earlier versions the toolkit's KMS and audit tools sent raw bearer-token requests without checking the activation status, bypassing usage telemetry and tier-limit enforcement. v0.1.7 closes that gap. If you do not want activation, use `@noble/post-quantum` and `node:crypto` directly to implement equivalent tools without QNSP.

Docs: https://docs.qnsp.cuilabs.io/sdk/langchain-qnsp
