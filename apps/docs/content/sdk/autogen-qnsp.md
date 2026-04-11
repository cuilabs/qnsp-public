---
title: AutoGen Integration (@qnsp/autogen-qnsp)
version: 0.2.0
last_updated: 2026-04-11
copyright: © 2025-2026 CUI Labs. All rights reserved.
license: Apache-2.0
source_files:
  - /packages/autogen-qnsp/package.json
  - /packages/autogen-qnsp/src/index.ts
  - /packages/autogen-qnsp/src/executor.ts
---

# AutoGen Integration (`@qnsp/autogen-qnsp`)

QNSP provides an AutoGen-oriented executor that submits code workloads to QNSP AI orchestration endpoints with tenant-scoped activation.

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

## What it provides

- code execution job submission
- execution status polling
- activation-backed tenant resolution and entitlement checks

## Related docs

- [SDK Overview](./overview)
- [SDK Activation](./sdk-activation)
- [AI SDK](./ai-sdk)
