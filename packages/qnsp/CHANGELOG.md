# @qnsp/qnsp

## 0.1.0 — 2026-04-30

**Initial release.** The single-package Node.js / TypeScript SDK for QNSP, replacing the 11 per-service `@qnsp/*-sdk` packages with one consolidated entry point.

### Why this exists

The previous TypeScript SDK family was fragmented across 11 packages (`@qnsp/vault-sdk`, `@qnsp/kms-client`, `@qnsp/audit-sdk`, `@qnsp/auth-sdk`, `@qnsp/tenant-sdk`, `@qnsp/access-control-sdk`, `@qnsp/billing-sdk`, `@qnsp/crypto-inventory-sdk`, `@qnsp/storage-sdk`, `@qnsp/search-sdk`, `@qnsp/ai-sdk`). Each ran its own activation handshake, kept its own version, owned its own CHANGELOG, and emitted its own activation telemetry — making it hard to answer simple questions like "did this developer's SDK reach our backend?" or "which SDK install tripped the activation gate?".

`@qnsp/qnsp` collapses that into one package with eleven sub-namespaces, mirroring the `qnsp` Python / Go / Rust SDK shape. One activation, one connection pool, one CHANGELOG, one source of truth — same diagnostic surface as the other-language SDKs.

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

The 11 per-service `@qnsp/*-sdk` packages on npm are now `npm deprecate`d to point at `@qnsp/qnsp`. Existing installs continue to work; new code should reach for `@qnsp/qnsp` directly. See the [Migration section in the README](./README.md#migration-from-per-service-sdks) for the import-by-import mapping.

The internal QNSP monorepo continues to use the per-service packages for service-to-service calls; that migration will happen in a separate wave and is invisible to external consumers.
