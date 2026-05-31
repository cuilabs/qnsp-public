# @cuilabs/qnsp

## 0.3.0

### Minor Changes

- Framework-adapter consolidation: the former standalone satellites
  `@cuilabs/qnsp-browser`, `-langchain-qnsp`, `-llamaindex-qnsp`, and
  `-autogen-qnsp` are folded in as subpaths of the one SDK —
  `@cuilabs/qnsp/browser` (client-side PQC encryption/signing via
  `@noble/post-quantum`), `@cuilabs/qnsp/langchain` (governed-agent
  toolkit), `@cuilabs/qnsp/llamaindex` (SSE-X encrypted vector store), and
  `@cuilabs/qnsp/autogen` (enclave code executor). Each subpath is
  self-contained (no internal `@cuilabs/qnsp-*` workspace deps) and
  preserves the prior behavior, endpoints, SSE-X token crypto, and
  activation `sdkId`s byte-for-byte. Framework integrations
  (`@langchain/core`, `llamaindex`, `autogen`) are **optional**
  `peerDependencies`; `@noble/hashes`/`@noble/post-quantum` are runtime
  deps for the browser + llamaindex SSE-X paths. The four standalone
  packages are deleted (they were never published). Non-breaking: the
  root export and `@cuilabs/qnsp/activation` are unchanged.

## 0.2.0

### Minor Changes

- Single-SDK consolidation: completes the `@qnsp` → `@cuilabs/qnsp` scope
  migration, folds the CLI in as the `qnsp` bin, and exposes the inlined
  activation client as the `@cuilabs/qnsp/activation` subpath. The retired
  standalone satellites (`-cli`, `-browser`, `-sdk-activation`,
  `-langchain-qnsp`, `-llamaindex-qnsp`, `-autogen-qnsp`) are unpublished;
  `@cuilabs/qnsp` is the one SDK to install.

## 0.1.0 — 2026-04-30

**Initial release.** The single-package Node.js / TypeScript SDK for QNSP, replacing the 11 per-service `@cuilabs/qnsp-*-sdk` packages with one consolidated entry point.

### Why this exists

The previous TypeScript SDK family was fragmented across 11 packages (`@cuilabs/qnsp-vault-sdk`, `@cuilabs/qnsp-kms-client`, `@cuilabs/qnsp-audit-sdk`, `@cuilabs/qnsp-auth-sdk`, `@cuilabs/qnsp-tenant-sdk`, `@cuilabs/qnsp-access-control-sdk`, `@cuilabs/qnsp-billing-sdk`, `@cuilabs/qnsp-crypto-inventory-sdk`, `@cuilabs/qnsp-storage-sdk`, `@cuilabs/qnsp-search-sdk`, `@cuilabs/qnsp-ai-sdk`). Each ran its own activation handshake, kept its own version, owned its own CHANGELOG, and emitted its own activation telemetry — making it hard to answer simple questions like "did this developer's SDK reach our backend?" or "which SDK install tripped the activation gate?".

`@cuilabs/qnsp` collapses that into one package with eleven sub-namespaces, mirroring the `qnsp` Python / Go / Rust SDK shape. One activation, one connection pool, one CHANGELOG, one source of truth — same diagnostic surface as the other-language SDKs.

### Added

- `QnspClient({ apiKey, baseUrl?, timeoutMs? })` — top-level client. Lazily activates against `/billing/v1/sdk/activate` on first request, reports `sdkId="qnsp"` and `sdkVersion="0.1.0"`.
- Eleven service sub-clients sharing one HTTP pool + one activation cache:
  - `qnsp.vault` (createSecret / getSecret / getSecretVersion / rotateSecret / deleteSecret / listSecretVersions)
  - `qnsp.kms` (createKey / listKeys / getKey / rotateKey / deleteKey / sign / verify / wrap / unwrap)
  - `qnsp.audit` (logEvent / ingestEvents / listEvents)
  - `qnsp.auth` (login / refreshToken / revoke / WebAuthn passkey lifecycle / MFA / SAML / OIDC / risk-based auth)
  - `qnsp.tenant` (CRUD / crypto-policy management / quota / health)
  - `qnsp.access` (RBAC roles, role assignments, checkPermission)
  - `qnsp.billing` (entitlements, usage meters, invoices, credit balance)
  - `qnsp.cryptoInventory` (CBOM: assets, discovery runs, PQC readiness)
  - `qnsp.storage` (PQC-encrypted object storage with SSE-X)
  - `qnsp.search` (encrypted vector search)
  - `qnsp.ai` (model registry, workloads, inference, artifacts)
- `parseQnspWebhook` and `verifyQnspWebhookSignature` — HMAC-SHA-256 verification + replay protection, identical to the helpers in the Python / Go / Rust SDKs.
- Typed error hierarchy: `QnspError`, `QnspNetworkError`, `QnspAuthError`, `QnspApiError`, `QnspWebhookError`.
- Top-level introspection: `tenantId()`, `tier()`, `limits()`, `hasFeature(name)`, `ensureActivated()`.

### Migration

The 11 per-service `@cuilabs/qnsp-*-sdk` packages on npm are now `npm deprecate`d to point at `@cuilabs/qnsp`. Existing installs continue to work; new code should reach for `@cuilabs/qnsp` directly. See the [Migration section in the README](./README.md#migration-from-per-service-sdks) for the import-by-import mapping.

The internal QNSP monorepo continues to use the per-service packages for service-to-service calls; that migration will happen in a separate wave and is invisible to external consumers.
