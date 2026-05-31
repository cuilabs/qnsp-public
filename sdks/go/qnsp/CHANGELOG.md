# Changelog

All notable changes to the QNSP Go SDK (`github.com/cuilabs/qnsp-public/sdks/go/qnsp`) will be documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project follows [Semantic Versioning](https://semver.org/).

## [0.2.0] — 2026-04-30

**Full-parity release.** Adds the two customer-facing service modules that were missing in 0.1.0, bringing the Go SDK to feature parity with the TypeScript family (11 service modules total).

### Added

- `qnsp/auth` — `*Client` with `Login`, `RefreshToken`, `Revoke`, WebAuthn passkey lifecycle (register/authenticate start+complete, list, delete), `MfaChallenge`/`MfaVerify`, `FederateSAML`/`FederateOIDC`, `EvaluateRisk`, `ListRiskPolicies`. Wraps `apps/auth-service` (`/auth/v1`).
- `qnsp/ai` — `*Client` with model registry (`RegisterModel`, `ListModels`, `GetModel`, `UpdateModel`, `ActivateModel`, `DeployModel`), workloads (`SubmitWorkload`, `GetWorkload`, `ListWorkloads`, `CancelWorkload`) with enclave-attestation metadata, `InvokeInference`, `RegisterArtifact`. Wraps `apps/ai-orchestrator` (`/ai/v1`).
- Top-level `Client.Auth()` and `Client.AI()` accessors.

### Changed

- Activation handshake reports `sdkVersion="0.2.0"` (was `0.1.0`).

## [0.1.0] — 2026-04-30

Initial release. The SDK is general-purpose — every QNSP customer uses the same shape, with no per-partner namespaces.

### Added

- `qnsp.Client` with `Vault()`, `KMS()`, `Audit()`, `Tenant()`, `Access()`, `Billing()`, `CryptoInventory()`, `Storage()`, `Search()` accessors over a shared activation cache and HTTP connection pool.
- `qnsp/vault` — `*Client` with `CreateSecret`, `GetSecret`, `GetSecretVersion`, `RotateSecret`, `DeleteSecret`, `ListSecretVersions`.
- `qnsp/kms` — `*Client` with `CreateKey`, `ListKeys`, `GetKey`, `RotateKey`, `DeleteKey`, `Sign`, `Verify`, `Wrap`, `Unwrap`.
- `qnsp/audit` — `*Client` with `LogEvent`, `IngestEvents` (batch), `ListEvents`.
- `qnsp/tenant` — tenant CRUD, crypto-policy management, quotas, health snapshots.
- `qnsp/access` — RBAC roles, role assignments, `CheckPermission`.
- `qnsp/billing` — `GetEntitlements`, usage-meter ingest, invoice listing, credit-balance lookup.
- `qnsp/cryptoinventory` — Cryptographic Bill of Materials: asset listing, discovery runs, PQC readiness score.
- `qnsp/storage` — PQC-encrypted object storage (SSE-X): `PutObject`, `GetObject`, `DeleteObject`, `ListObjects`, `ListBuckets`.
- `qnsp/search` — encrypted vector search: index lifecycle, `UpsertVectors`, `Query`.
- Each submodule also exposes a generic `Do(ctx, method, path, body, query, idempotencyKey)` escape hatch for endpoints not yet typed.
- `qnsp/crypto` — local PQC primitives wrapping `liboqs-go` 0.12.0. Covers ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205), Falcon, plus the full liboqs 0.12.0 algorithm surface (HQC, BIKE, FrodoKEM, Classic-McEliece, MAYO, CROSS). Algorithm names mirror `@cuilabs/qnsp-cryptography` (TypeScript), `qnsp.crypto` (Python), and the new Rust SDK.
- `qnsp.Activator` — one-shot handshake against `/billing/v1/sdk/activate` with `sdkId="qnsp-go"`, cached with a 60 s near-expiry buffer.
- `qnsp.ParseWebhook` and `qnsp.VerifyWebhookSignature` — HMAC-SHA-256 verify, replay protection (`qnsp.MaxWebhookSkew = 5 * time.Minute`), typed `qnsp.WebhookEvent`.
- Top-level introspection: `Client.TenantID`, `Client.Tier`, `Client.Limits`, `Client.HasFeature`.
- Typed errors: `qnsp.Error`, `qnsp.NetworkError`, `qnsp.AuthError`, `qnsp.APIError`, `qnsp.WebhookError`.

### Notes

- The crypto subpackage requires `liboqs` to be installed at link time (`brew install liboqs` on macOS, `apt install liboqs-dev` on Debian). If you do not import `qnsp/crypto`, no native library is required.
