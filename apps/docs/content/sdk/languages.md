---
title: Supported Languages
version: 0.3.0
last_updated: 2026-04-30
copyright: © 2025-2026 CUI Labs. All rights reserved.
---

> **Note** — As of 2026-04-30, the per-service `@cuilabs/qnsp-auth-sdk` package is consolidated into the unified `@cuilabs/qnsp` SDK (one package per language). New integrations should use:
>
> ```typescript
> import { QnspClient } from "@cuilabs/qnsp";
> const qnsp = new QnspClient({ apiKey: process.env.QNSP_API_KEY! });
> await qnsp.auth./* method */(...);
> ```
>
> See [SDK overview](../sdk/) for the consolidated package. The per-service shapes documented below remain accurate at the wire level (REST/gRPC) and are kept for reference.

# Supported Languages

QNSP ships first-party SDKs for **TypeScript / Node.js**, **Python**, **Go**, **Rust**, and **JVM / Android** (Kotlin + Java). All five share the same wire contracts, the same algorithm names, and the same FIPS 203 / 204 / 205 posture — pick whichever fits your stack and the byte-for-byte outputs round-trip.

| Language | Package | Where it lives | Activation SDK ID |
|---|---|---|---|
| TypeScript / Node.js | `@cuilabs/qnsp` (single package) | [`packages/qnsp/`](https://github.com/cuilabs/qnsp-public/tree/main/packages/qnsp) | `qnsp` |
| Python | `qnsp` (single package) | [`sdks/python/qnsp/`](https://github.com/cuilabs/qnsp-public/tree/main/sdks/python/qnsp) | `qnsp-python` |
| Go | `github.com/cuilabs/qnsp-public/sdks/go/qnsp` | [`sdks/go/qnsp/`](https://github.com/cuilabs/qnsp-public/tree/main/sdks/go/qnsp) | `qnsp-go` |
| Rust | `qnsp` on crates.io | [`sdks/rust/qnsp/`](https://github.com/cuilabs/qnsp-public/tree/main/sdks/rust/qnsp) | `qnsp-rust` |
| JVM / Android (Kotlin + Java) | `io.cuilabs:qnsp` on Maven Central | [`sdks/jvm/`](https://github.com/cuilabs/qnsp-public/tree/main/sdks/jvm) | `qnsp-jvm` |

> **TypeScript SDK consolidated 2026-04-30.** The previous 11 per-service `@cuilabs/qnsp-*-sdk` packages on npm are deprecated in favour of `@cuilabs/qnsp`. They continue to install and work, but new code should use the unified package. See [migration guide](https://github.com/cuilabs/qnsp-public/blob/main/packages/qnsp/README.md#migration-from-per-service-sdks).

## Node.js / TypeScript

Single `@cuilabs/qnsp` package on npm:

```bash
pnpm add @cuilabs/qnsp
```

```typescript
import { QnspClient } from "@cuilabs/qnsp";

const qnsp = new QnspClient({ apiKey: process.env.QNSP_API_KEY! });
await qnsp.vault.createSecret({ name: "openai-key", payloadB64: "..." });
const key = await qnsp.kms.createKey({ algorithm: "ml-dsa-65", purpose: "signing" });
await qnsp.audit.logEvent({ eventType: "model.inference", payload: { modelId: "gpt-4o" } });
```

- TypeScript native, strict mode
- ESM (CommonJS consumers can `await import("@cuilabs/qnsp")`)
- Node.js ≥ 22.0.0
- One activation handshake on first call, shared across all 11 sub-clients
- One `npm install` line, one version, one CHANGELOG, one telemetry surface

For browser apps, `@cuilabs/qnsp-browser` is still the right choice (it bundles the noble PQC primitives for client-side use). The per-service `@cuilabs/qnsp-*-sdk` packages on npm are deprecated as of 2026-04-30 — they continue to install but are no longer the recommended entry point. See the [Node.js page](./node/README.md) for full quick-start and migration details.

## Python

Single `qnsp` package on PyPI ([changelog](https://github.com/cuilabs/qnsp-public/blob/main/sdks/python/qnsp/CHANGELOG.md)):

```bash
pip install qnsp
# with local PQC primitives:
pip install 'qnsp[crypto]'
```

```python
from qnsp import QnspClient
with QnspClient(api_key=os.environ["QNSP_API_KEY"]) as q:
    secret = q.vault.create_secret(name="my-secret", payload_b64=...)
    key    = q.kms.create_key(algorithm="ml-dsa-65", purpose="signing")
    q.audit.log_event(event_type="model.inference", payload={...})
```

The `qnsp[crypto]` extra wraps `liboqs-python` 0.12.0 — same algorithm-name surface as the rest of the QNSP ecosystem.

See the [Python page](./python/README.md) for full quick-start.

## Go

Module path is `github.com/cuilabs/qnsp-public/sdks/go/qnsp`:

```bash
go get github.com/cuilabs/qnsp-public/sdks/go/qnsp@latest
```

```go
import "github.com/cuilabs/qnsp-public/sdks/go/qnsp"

c, _ := qnsp.NewClient(qnsp.ClientOptions{APIKey: os.Getenv("QNSP_API_KEY")})
defer c.Close()
secret, _ := c.Vault().CreateSecret(ctx, vault.CreateSecretRequest{...}, "")
```

The `qnsp/crypto` subpackage wraps `liboqs-go` 0.12.0 — pure-Go base, native crypto requires liboqs at link time.

See the [Go page](./go/README.md) for full quick-start.

## Rust

`qnsp` on crates.io:

```bash
cargo add qnsp
# with local PQC primitives:
cargo add qnsp --features crypto
```

```rust
use qnsp::{Client, ClientOptions};
use qnsp::vault::CreateSecretRequest;

let c = Client::new(ClientOptions::with_api_key(env::var("QNSP_API_KEY")?))?;
let secret = c.vault().create_secret(CreateSecretRequest { ... }, None).await?;
```

`tokio`-based async; the `crypto` feature delegates to the [`oqs`](https://crates.io/crates/oqs) 0.11 crate.

See the [Rust page](./rust/README.md) for full quick-start.

## JVM / Android

`io.cuilabs:qnsp` on Maven Central — one artifact for server-side JVM (Spring / Java / Kotlin) and native Android (API 21+):

```kotlin
// Gradle (Kotlin DSL)
dependencies {
    implementation("io.cuilabs:qnsp:0.1.0")
}
```

```kotlin
val qnsp = QnspClient(System.getenv("QNSP_API_KEY"))
val secret = qnsp.vault.createSecret(
    CreateSecretRequest(name = "db-password", payloadB64 = payloadB64),
)
```

Built on OkHttp; Java-interop-clean API (from Java: `qnsp.getVault()...`). On-device PQC via Bouncy Castle or OS-native (Android Keystore PQC). See the [JVM / Android page](./java/README.md) for the full quick-start.

## Feature matrix

All SDKs cover the same set of customer-facing services. Module names differ slightly per language (snake_case vs camelCase vs PascalCase) but the wire contract is identical.

| Service | TypeScript | Python | Go | Rust | JVM / Android |
|---|---|---|---|---|---|
| Vault (`/vault/v1`) | `@cuilabs/qnsp-vault-sdk` | `qnsp.vault` | `qnsp/vault` | `qnsp::vault` | `qnsp.vault` |
| KMS (`/kms/v1`) | `@cuilabs/qnsp-kms-client` | `qnsp.kms` | `qnsp/kms` | `qnsp::kms` | `qnsp.kms` |
| Audit (`/audit/v1`) | `@cuilabs/qnsp-audit-sdk` | `qnsp.audit` | `qnsp/audit` | `qnsp::audit` | `qnsp.audit` |
| Auth (`/auth/v1`) | `@cuilabs/qnsp-auth-sdk` | `qnsp.auth` | `qnsp/auth` | `qnsp::auth` | `qnsp.auth` |
| Tenant (`/tenant/v1`) | `@cuilabs/qnsp-tenant-sdk` | `qnsp.tenant` | `qnsp/tenant` | `qnsp::tenant` | `qnsp.tenant` |
| Access (`/access/v1`) | `@cuilabs/qnsp-access-control-sdk` | `qnsp.access` | `qnsp/access` | `qnsp::access` | `qnsp.access` |
| Billing (`/billing/v1`) | `@cuilabs/qnsp-billing-sdk` | `qnsp.billing` | `qnsp/billing` | `qnsp::billing` | `qnsp.billing` |
| Crypto Inventory (`/crypto/v1`) | `@cuilabs/qnsp-crypto-inventory-sdk` | `qnsp.crypto_inventory` | `qnsp/cryptoinventory` | `qnsp::crypto_inventory` | `qnsp.cryptoInventory` |
| Storage (`/storage/storage/v1`) | `@cuilabs/qnsp-storage-sdk` | `qnsp.storage` | `qnsp/storage` | `qnsp::storage` | `qnsp.storage` |
| Search (`/search/v1`) | `@cuilabs/qnsp-search-sdk` | `qnsp.search` | `qnsp/search` | `qnsp::search` | `qnsp.search` |
| AI Orchestrator (`/ai/v1`) | `@cuilabs/qnsp-ai-sdk` | `qnsp.ai` | `qnsp/ai` | `qnsp::ai` | `qnsp.ai` |
| Local PQC primitives | `@cuilabs/qnsp-cryptography` (via `@cuilabs/liboqs-native`) | `qnsp.crypto` (via `liboqs-python`) | `qnsp/crypto` (via `liboqs-go`) | `qnsp::crypto` (via `oqs` 0.11) | Bouncy Castle / OS-native |
| Webhook signature verify + parse | per-service | `qnsp.parse_qnsp_webhook` | `qnsp.ParseWebhook` | `qnsp::parse_webhook` | `QnspWebhooks` |

All SDKs ship the same **11 customer-facing service modules** plus local PQC primitives and webhook verification. The Python SDK at v0.3.0 (2026-04-30) reached parity with the Go and Rust v0.2.0 surface; all four single-package families now match the TypeScript per-service split byte-for-byte on the wire.

## Activation

Every customer-facing SDK calls `/billing/v1/sdk/activate` on first use to validate the API key, resolve the tenant + tier, and cache the result. The SDK identifier reported in the handshake matches the third column of the table at the top of this page; see [SDK Activation](./sdk-activation.md) for protocol details.

## Community SDKs

QNSP does not currently host community-maintained SDKs. If you build one, open a PR against [`docs/sdks/community.md`](https://github.com/cuilabs/qnsp-public/tree/main/docs/sdks) on the public mirror to add it to this list.
