# Public SDK Reference

All `@qnsp/*` SDKs are TypeScript-first, ESM, published to npm under the Apache-2.0 license.

**Runtime:** published packages declare Node.js **`>= 24.12.0`** in `package.json` `engines` (monorepo baseline). `@cuilabs/liboqs-native` uses a separate license/registry — see that package’s `package.json`.

For the full SDK and API reference see: [`docs/technical/QNSP-SDKs-APIs.md`](../technical/QNSP-SDKs-APIs.md)

## SDK Packages

| Package | Version | npm |
|---------|---------|-----|
| `@qnsp/auth-sdk` | 0.3.1 | `pnpm add @qnsp/auth-sdk` |
| `@qnsp/vault-sdk` | 0.3.1 | `pnpm add @qnsp/vault-sdk` |
| `@qnsp/kms-client` | 0.2.1 | `pnpm add @qnsp/kms-client` |
| `@qnsp/storage-sdk` | 0.3.1 | `pnpm add @qnsp/storage-sdk` |
| `@qnsp/search-sdk` | 0.2.1 | `pnpm add @qnsp/search-sdk` |
| `@qnsp/audit-sdk` | 0.3.1 | `pnpm add @qnsp/audit-sdk` |
| `@qnsp/billing-sdk` | 0.2.1 | `pnpm add @qnsp/billing-sdk` |
| `@qnsp/tenant-sdk` | 0.3.1 | `pnpm add @qnsp/tenant-sdk` |
| `@qnsp/access-control-sdk` | 0.3.1 | `pnpm add @qnsp/access-control-sdk` |
| `@qnsp/crypto-inventory-sdk` | 0.3.1 | `pnpm add @qnsp/crypto-inventory-sdk` |
| `@qnsp/ai-sdk` | 0.1.3 | `pnpm add @qnsp/ai-sdk` |
| `@qnsp/browser-sdk` | 0.1.0 | `pnpm add @qnsp/browser-sdk` |
| `@qnsp/cli` | 0.1.4 | `pnpm add -g @qnsp/cli` |

## API Base URL

```
https://api.qnsp.cuilabs.io
```

All SDK clients accept `baseUrl` as a constructor option. Default is the production URL above.

## Source

SDK source lives in `packages/<sdk-name>/src/`. Each SDK follows the standard package structure:
`src/index.ts` as entry point, co-located `*.test.ts` files, `vitest.config.ts` for tests.
