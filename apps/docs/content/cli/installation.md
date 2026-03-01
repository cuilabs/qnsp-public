---
title: CLI Installation
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
license: Apache-2.0
source_files:
  - /packages/cli/package.json
  - /packages/cli/README.md
---

# CLI Installation

Install the QNSP command-line interface.

## Package Information

From `packages/cli/package.json`:

```json
{
  "name": "@qnsp/cli",
  "version": "0.1.0",
  "license": "Apache-2.0",
  "bin": {
    "qnsp": "./dist/index.js"
  }
}
```

## Installation Methods

### pnpm (recommended)
```bash
pnpm add -g @qnsp/cli
```

### Verify installation
```bash
qnsp --version
# Output: 0.1.0

qnsp --help
```

## Upgrade

```bash
pnpm update -g @qnsp/cli
# or
brew upgrade qnsp
```

## Uninstall

```bash
pnpm remove -g @qnsp/cli
# or
brew uninstall qnsp
```
