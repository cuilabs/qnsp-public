# Public SDK Reference

All `@qnsp/*` SDKs below are TypeScript-first, ESM, and published to the public
npm registry under **Apache-2.0**. They install cleanly from a default `.npmrc`
with **no GitHub Packages scope configuration required**.

**Runtime floor:** every manifest declares `engines.node >= 22.0.0`.

**Post-quantum backend:** the PQC primitives in `@qnsp/cryptography` resolve
against the pure-JS [`@noble/post-quantum`](https://github.com/paulmillr/noble-post-quantum)
provider by default. The optional native backend (`@cuilabs/liboqs-native`) is
published to GitHub Packages only and declared as an `optionalDependency` of
`@qnsp/cryptography` — npm will skip it silently on public installs. To opt in,
add a scope mapping and install it explicitly:

```bash
echo '@cuilabs:registry=https://npm.pkg.github.com' >> .npmrc
npm install @cuilabs/liboqs-native
```

For the full SDK and API reference see:
[`docs/technical/QNSP-SDKs-APIs.md`](../technical/QNSP-SDKs-APIs.md)

## SDK Packages (published 2026-04-19)

### Application SDKs

| Package | Version | Install |
|---------|---------|---------|
| `@qnsp/auth-sdk` | 0.3.5 | `pnpm add @qnsp/auth-sdk` |
| `@qnsp/vault-sdk` | 0.3.8 | `pnpm add @qnsp/vault-sdk` |
| `@qnsp/kms-client` | 0.2.5 | `pnpm add @qnsp/kms-client` |
| `@qnsp/storage-sdk` | 0.3.5 | `pnpm add @qnsp/storage-sdk` |
| `@qnsp/search-sdk` | 0.2.9 | `pnpm add @qnsp/search-sdk` |
| `@qnsp/audit-sdk` | 0.3.5 | `pnpm add @qnsp/audit-sdk` |
| `@qnsp/billing-sdk` | 0.2.5 | `pnpm add @qnsp/billing-sdk` |
| `@qnsp/tenant-sdk` | 0.3.5 | `pnpm add @qnsp/tenant-sdk` |
| `@qnsp/access-control-sdk` | 0.3.5 | `pnpm add @qnsp/access-control-sdk` |
| `@qnsp/crypto-inventory-sdk` | 0.3.5 | `pnpm add @qnsp/crypto-inventory-sdk` |
| `@qnsp/ai-sdk` | 0.1.10 | `pnpm add @qnsp/ai-sdk` |
| `@qnsp/browser-sdk` | 0.1.3 | `pnpm add @qnsp/browser-sdk` |
| `@qnsp/sdk-activation` | 0.1.4 | `pnpm add @qnsp/sdk-activation` |

### Framework adapters

| Package | Version | Install |
|---------|---------|---------|
| `@qnsp/langchain-qnsp` | 0.1.5 | `pnpm add @qnsp/langchain-qnsp` |
| `@qnsp/llamaindex-qnsp` | 0.2.4 | `pnpm add @qnsp/llamaindex-qnsp` |
| `@qnsp/autogen-qnsp` | 0.2.4 | `pnpm add @qnsp/autogen-qnsp` |

### Bin-first packages

| Package | Version | Install | Bin |
|---------|---------|---------|-----|
| `@qnsp/cli` | 0.1.11 | `pnpm add -g @qnsp/cli` | `qnsp` |
| `@qnsp/mcp-server` | 0.1.2 | `pnpm add -g @qnsp/mcp-server` | `qnsp-mcp` |

### Core libraries (consumed by the SDKs above)

| Package | Version | Purpose |
|---------|---------|---------|
| `@qnsp/cryptography` | 0.1.1 | PQC primitives (ML-KEM, ML-DSA, SLH-DSA) via noble; optional liboqs native backend |
| `@qnsp/shared-kernel` | 0.1.3 | Domain primitives, JWT helpers, error hierarchy, SDK-facing tier gating |
| `@qnsp/observability` | 0.1.3 | OpenTelemetry helpers, structured logging |
| `@qnsp/events` | 0.1.3 | Event envelope schemas |
| `@qnsp/resilience` | 0.1.1 | Retry / circuit-breaker primitives |

## Tier gating (client-side pre-flight)

`@qnsp/shared-kernel` exports a small, **self-contained** tier catalogue so SDK
consumers can fail fast with a typed error before making a network call:

```ts
import { isFeatureEnabled, TierError } from "@qnsp/shared-kernel";

if (!isFeatureEnabled("enclaves", currentTier)) {
  throw new TierError("enclaves", currentTier, "enterprise-standard");
}
```

The catalogue is **inlined** in `@qnsp/shared-kernel` — no separate pricing
package is required. The internal `@qnsp/pricing` package is private to this
monorepo and deliberately not published; a build-time drift test
(`packages/shared-kernel/src/tier-limits.drift.test.ts`) keeps the inlined
catalogue byte-exact with the internal commercial source of truth.

## API Base URL

```
https://api.qnsp.cuilabs.io
```

All SDK clients accept `baseUrl` as a constructor option. Default is the production URL above.

## Source

SDK source lives in `packages/<sdk-name>/src/`. Each SDK follows the standard package structure:
`src/index.ts` as entry point, co-located `*.test.ts` files, `vitest.config.ts` for tests.
