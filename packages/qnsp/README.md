# @cuilabs/qnsp — Node.js / TypeScript SDK for the Quantum-Native Security Platform

[![npm version](https://img.shields.io/npm/v/@cuilabs/qnsp.svg)](https://www.npmjs.com/package/@cuilabs/qnsp)
[![License](https://img.shields.io/npm/l/@cuilabs/qnsp.svg)](./LICENSE)

The official **single-package** Node.js / TypeScript SDK for QNSP. Covers the full customer-facing platform — vault, KMS, audit, auth, tenant, access-control, billing, crypto-inventory, storage, search, and AI orchestrator — plus webhook signature verification. Mirrors the shape of the `qnsp` Python / Go / Rust SDKs byte-for-byte: same wire contracts, same algorithm names, same FIPS 203 / 204 / 205 posture.

> **Free tier available.** Free-forever account at <https://cloud.qnsp.cuilabs.io/auth> — 60-second signup, no credit card. Includes 10 GB PQC storage, 50 000 API calls/month, 20 KMS keys, 25 vault secrets.

## Why one package?

Previous TypeScript consumers had to install up to 11 separate `@qnsp/*-sdk` packages and keep their versions in sync. `@cuilabs/qnsp` collapses that into a single dependency with sub-namespaces:

```ts
import { QnspClient } from "@cuilabs/qnsp";

const qnsp = new QnspClient({ apiKey: process.env.QNSP_API_KEY! });

await qnsp.vault.createSecret({ ... });   // was @qnsp/vault-sdk
await qnsp.kms.sign(keyId, data);          // was @qnsp/kms-client
await qnsp.audit.logEvent({ ... });        // was @qnsp/audit-sdk
await qnsp.tenant.getTenant(tenantId);     // was @qnsp/tenant-sdk
// ...
```

One activation handshake on first use, shared across all 11 sub-clients. One version bump per QNSP release. One CHANGELOG. One source of truth.

## Install

```bash
pnpm add @cuilabs/qnsp
# or
npm install @cuilabs/qnsp
# or
yarn add @cuilabs/qnsp
```

Requires Node.js ≥ 22.0.0. ESM-first; CommonJS consumers can `await import("@cuilabs/qnsp")`.

## Quick start

```ts
import { QnspClient } from "@cuilabs/qnsp";

const qnsp = new QnspClient({ apiKey: process.env.QNSP_API_KEY! });

// Vault — PQC-encrypted secret storage
const secret = await qnsp.vault.createSecret({
  name: "openai-api-key",
  payloadB64: Buffer.from("sk-...").toString("base64"),
  algorithm: "ml-kem-768",
});

// KMS — server-side PQC keys
const key = await qnsp.kms.createKey({ algorithm: "ml-dsa-65", purpose: "signing" });
const sig = await qnsp.kms.sign(key.keyId as string, new TextEncoder().encode("hello"));
const ok  = await qnsp.kms.verify(key.keyId as string, new TextEncoder().encode("hello"), sig);

// Audit — immutable, hash-chained event log
await qnsp.audit.logEvent({
  eventType: "model.inference",
  payload: { modelId: "gpt-4o", latencyMs: 412 },
});

// Tenant, access, billing, crypto-inventory, storage, search, ai, auth — all on one client
await qnsp.tenant.getTenant(await qnsp.tenantId());
await qnsp.access.checkPermission({ subjectId: "user-1", permission: "vault.read" });
await qnsp.billing.getEntitlements();
```

## Modules

Each sub-namespace wraps one QNSP backend service:

| Sub-client | Wraps | Key methods |
|---|---|---|
| `qnsp.vault` | `apps/vault-service` (`/vault/v1`) | `createSecret`, `getSecret`, `getSecretVersion`, `rotateSecret`, `deleteSecret`, `listSecretVersions` |
| `qnsp.kms` | `apps/kms-service` (`/kms/v1`) | `createKey`, `listKeys`, `getKey`, `rotateKey`, `deleteKey`, `sign`, `verify`, `wrap`, `unwrap` |
| `qnsp.audit` | `apps/audit-service` (`/audit/v1`) | `logEvent`, `ingestEvents`, `listEvents` |
| `qnsp.auth` | `apps/auth-service` (`/auth/v1`) | `login`, `refreshToken`, `revoke`, WebAuthn passkey lifecycle, `mfaChallenge` / `mfaVerify`, `federateSAML` / `federateOIDC`, `evaluateRisk` |
| `qnsp.tenant` | `apps/tenant-service` (`/tenant/v1`) | `createTenant`, `getTenant`, `updateTenant`, `listTenants`, `getCryptoPolicy`, `upsertCryptoPolicy`, `getCurrentHealth`, `getCurrentQuotas` |
| `qnsp.access` | `apps/access-control-service` (`/access/v1`) | `createRole`, `getRole`, `listRoles`, `deleteRole`, `assignRole`, `revokeRoleAssignment`, `checkPermission` |
| `qnsp.billing` | `apps/billing-service` (`/billing/v1`) | `getEntitlements`, `ingestMeter`, `ingestMeters`, `listInvoices`, `getInvoice`, `getCreditBalance` |
| `qnsp.cryptoInventory` | `apps/crypto-inventory-service` (`/crypto/v1`) | `listAssets`, `getAsset`, `getAssetStats`, `discoverAssets`, `getReadinessScore` |
| `qnsp.storage` | `apps/storage-service` (`/storage/storage/v1`) | `putObject`, `getObject` (returns `[bytes, descriptor]`), `deleteObject`, `listObjects`, `listBuckets` |
| `qnsp.search` | `apps/search-service` (`/search/v1`) | `createIndex`, `listIndexes`, `deleteIndex`, `upsertVectors`, `query` |
| `qnsp.ai` | `apps/ai-orchestrator` (`/ai/v1`) | model registry (`registerModel`, `listModels`, `getModel`, `updateModel`, `activateModel`, `deployModel`), workloads (`submitWorkload`, `getWorkload`, `listWorkloads`, `cancelWorkload`), `invokeInference`, `registerArtifact` |

## Verifying inbound webhooks

QNSP signs every webhook with HMAC-SHA-256. Verify the **raw body** before parsing JSON:

```ts
import { parseQnspWebhook, QnspWebhookError } from "@cuilabs/qnsp";

app.post("/webhooks/qnsp", express.raw({ type: "application/json" }), (req, res) => {
  try {
    const event = parseQnspWebhook({
      body: req.body, // raw Buffer
      signatureHeader: req.header("x-qnsp-signature") ?? "",
      timestampHeader: req.header("x-qnsp-timestamp"),
      secret: process.env.QNSP_WEBHOOK_SECRET!,
    });
    if (event.eventType === "key.rotated") {
      // ...
    }
    res.sendStatus(200);
  } catch (err) {
    if (err instanceof QnspWebhookError) {
      res.status(400).send(err.reason);
    } else {
      throw err;
    }
  }
});
```

Constant-time HMAC comparison, 5-minute replay window by default (`MAX_WEBHOOK_SKEW_MS`), refuses payloads missing required fields.

## Error handling

All errors descend from `QnspError`:

| Class | When |
|---|---|
| `QnspNetworkError` | DNS, TLS, timeout, or connection failure |
| `QnspAuthError` | API key rejected at activation |
| `QnspApiError` | A service returned 4xx/5xx with a structured body |
| `QnspWebhookError` | HMAC mismatch, expired timestamp, malformed body, etc. |

```ts
import { QnspApiError, QnspNetworkError } from "@cuilabs/qnsp";

try {
  await qnsp.vault.getSecret("missing");
} catch (err) {
  if (err instanceof QnspApiError) console.log("HTTP", err.statusCode, err.code);
  else if (err instanceof QnspNetworkError) console.log("could not reach QNSP:", err.message);
  else throw err;
}
```

## Activation + tier introspection

`QnspClient` performs a one-shot handshake against `/billing/v1/sdk/activate` on first use. The result is cached in memory; subsequent calls reuse it until ~60 s before expiry. You can inspect the current activation:

```ts
await qnsp.tenantId();      // resolved tenant
await qnsp.tier();          // plan tier
await qnsp.limits();        // full limits dict
await qnsp.hasFeature("sseEnabled");  // convenience boolean

// Force the handshake at startup so you fail fast on a bad key:
await qnsp.ensureActivated();
```

If the activation token is rotated server-side, the SDK invalidates its cache and retries the originating request once on a 401.

## Migration from per-service SDKs

The per-service `@qnsp/*-sdk` packages on npm are now **deprecated** in favour of `@cuilabs/qnsp`. They continue to install and work, but new code should use this package.

| Before | After |
|---|---|
| `import { VaultClient } from "@qnsp/vault-sdk"` | `import { QnspClient } from "@cuilabs/qnsp"` then `qnsp.vault` |
| `import { KmsClient } from "@qnsp/kms-client"` | `qnsp.kms` |
| `import { AuthClient } from "@qnsp/auth-sdk"` | `qnsp.auth` |
| `import { TenantClient } from "@qnsp/tenant-sdk"` | `qnsp.tenant` |
| `import { AccessControlClient } from "@qnsp/access-control-sdk"` | `qnsp.access` |
| `import { BillingClient } from "@qnsp/billing-sdk"` | `qnsp.billing` |
| `import { CryptoInventoryClient } from "@qnsp/crypto-inventory-sdk"` | `qnsp.cryptoInventory` |
| `import { StorageClient } from "@qnsp/storage-sdk"` | `qnsp.storage` |
| `import { SearchClient } from "@qnsp/search-sdk"` | `qnsp.search` |
| `import { AiOrchestratorClient } from "@qnsp/ai-sdk"` | `qnsp.ai` |
| `import { AuditClient } from "@qnsp/audit-sdk"` | `qnsp.audit` |

The constructor signature is simpler — one `apiKey` for everything, instead of a per-service config:

```ts
// Before — 11 packages, 11 activation handshakes, 11 versions to keep in sync
import { VaultClient } from "@qnsp/vault-sdk";
import { KmsClient } from "@qnsp/kms-client";
import { AuditClient } from "@qnsp/audit-sdk";

const vault = new VaultClient({ apiKey, baseUrl: "https://api.qnsp.cuilabs.io/proxy/vault", tier });
const kms   = new KmsClient({   apiKey, baseUrl: "https://api.qnsp.cuilabs.io/proxy/kms",   tier });
const audit = new AuditClient({ apiKey, baseUrl: "https://api.qnsp.cuilabs.io/proxy/audit", tier });

// After — one package, one activation, one client
import { QnspClient } from "@cuilabs/qnsp";

const qnsp = new QnspClient({ apiKey });
// qnsp.vault, qnsp.kms, qnsp.audit, ... all share one connection pool + one activation cache
```

The wire contracts are identical, so migrating method-by-method is mechanical.

## License

Apache-2.0. See [LICENSE](./LICENSE).
