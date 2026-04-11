---
title: Resilience Utilities (@qnsp/resilience)
version: 0.1.1
last_updated: 2026-04-11
copyright: © 2025-2026 CUI Labs. All rights reserved.
license: Apache-2.0
source_files:
  - /packages/resilience/package.json
  - /packages/resilience/src/index.ts
  - /packages/resilience/src/circuit-breaker.ts
---

# Resilience Utilities (`@qnsp/resilience`)

`@qnsp/resilience` is the small shared utility package used by QNSP service clients and SDK-adjacent runtime code for fault handling.

## Install

```bash
pnpm add @qnsp/resilience
```

## Features

- circuit breakers
- timeout controls
- retry orchestration
- fault-isolation helpers used by shared client layers

## Usage

```ts
import { CircuitBreaker } from "@qnsp/resilience";
```

## Related docs

- [SDK Overview](./overview)
