---
title: LlamaIndex Integration (@qnsp/llamaindex-qnsp)
version: 0.2.0
last_updated: 2026-04-11
copyright: © 2025-2026 CUI Labs. All rights reserved.
license: Apache-2.0
source_files:
  - /packages/llamaindex-qnsp/package.json
  - /packages/llamaindex-qnsp/src/index.ts
  - /packages/llamaindex-qnsp/src/vector-store.ts
---

# LlamaIndex Integration (`@qnsp/llamaindex-qnsp`)

QNSP exposes an encrypted vector-store adapter for LlamaIndex backed by QNSP search and storage services.

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

## What it provides

- vector insertion and deletion
- encrypted search queries through QNSP search
- document persistence through QNSP storage

## Authentication

The adapter activates through `@qnsp/sdk-activation`, derives tenant identity from the API key, and uses billing as the source of truth for availability and limits.

## Related docs

- [SDK Overview](./overview)
- [SDK Activation](./sdk-activation)
- [Search SDK](./search-sdk)
- [Storage SDK](./storage-sdk)
