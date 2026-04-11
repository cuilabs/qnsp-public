---
title: LangChain Integration (@qnsp/langchain-qnsp)
version: 0.1.1
last_updated: 2026-04-11
copyright: © 2025-2026 CUI Labs. All rights reserved.
license: Apache-2.0
source_files:
  - /packages/langchain-qnsp/package.json
  - /packages/langchain-qnsp/src/index.ts
  - /packages/langchain-qnsp/src/toolkit.ts
---

# LangChain Integration (`@qnsp/langchain-qnsp`)

QNSP provides a LangChain toolkit that wraps tenant-scoped vault, KMS, and audit operations behind billing-backed SDK activation.

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

const tools = toolkit.getTools();
```

## What it exposes

- vault read/write/rotate tools
- KMS sign and verify tools
- audit logging helpers for agent actions

## Authentication

The toolkit activates with `@qnsp/sdk-activation`, resolves tenant context from the API key, and respects billing entitlements before tools are used.

## Related docs

- [SDK Overview](./overview)
- [SDK Activation](./sdk-activation)
- [Vault SDK](./vault-sdk)
- [KMS Client](./kms-client)
- [Audit SDK](./audit-sdk)
