# @qnsp/ai-sdk

## 0.1.2

### Patch Changes

- 2ebcd93: Add-on catalog hardening: enforce north-star billing invariants

  **Data model (config.ts):**

  - Mark `model-serving-bandwidth` as `pricingModel: "informational"`, `purchaseBlocked`, `hidden`
  - Add `pricingModel: "usage"`, `unit`, `unitPriceCents` to `storage-hot-tier`
  - Add `includesAddons` to `evidence-compliance-pack` and `resilience-pack`
  - Add `coveredByPacks` to all constituent add-ons (6 for evidence, 3 for resilience)
  - Add `includedInTiers` to `secure-ai-training` and `encrypted-fine-tuning` (enterprise-pro+)
  - Narrow `requiresTier` on those two to `["enterprise-standard"]` only
  - Add `requiresTier` enterprise-standard+ to `pipeline-throughput-boost`, `artifact-preprocessing-dedup`, `priority-gpu-scheduling`, `guaranteed-gpu-slot`, `enclave-concurrency`

  **Enforcement (new AddOnPurchaseValidator):**

  - `purchaseBlocked` / deprecated SKU rejection
  - `includedInTiers` → 409 ALREADY_INCLUDED_BY_TIER
  - `mutuallyExclusiveGroup` → 409 MUTUAL_EXCLUSION
  - `coveredByPacks` → 409 COVERED_BY_PACK (pack already active)
  - `requiresTier` → 403 TIER_REQUIRED
  - Wired into both `/billing/addons/enable` and `/billing/addons/request`

  **Catalog endpoint:**

  - Filters out hidden, purchaseBlocked, and informational SKUs
  - Exposes new metadata: `scope`, `pricingModel`, `unit`, `unitPriceCents`, `coveredByPacks`, `mutuallyExclusiveGroup`, `includedInTiers`

  **Tier downgrade preview:**

  - New `POST /billing/v1/tier-change/preview` endpoint
  - Returns `incompatibleAddons`, `willLoseFlags`, `billingDelta`

  **SDK fixes:**

  - Add `"./package.json": "./package.json"` export to `@qnsp/ai-sdk` and `@qnsp/kms-client`

  **Tests:**

  - 22 new tests for AddOnPurchaseValidator covering all enforcement rules + downgrade impact
  - All 54 billing-service tests passing

- ad6d0d4: Automated changeset generated for staged code updates to keep release workflows fully synchronized.
- b7599c7: Automated changeset generated for staged code updates to keep release workflows fully synchronized.
- be1dd80: Automated changeset generated for staged code updates to keep release workflows fully synchronized.
- 71de019: Automated changeset generated for staged code updates to keep release workflows fully synchronized.
- Enterprise-grade SDK hardening across all API-calling SDKs:

  1. **Constructor validation**: Runtime guards for required API key/token with developer-friendly error messages
  2. **HTTPS enforcement**: All SDKs reject non-HTTPS baseUrl in production (HTTP allowed only for localhost in development/test)
  3. **Rate limiting with retry**: 429 handling with Retry-After header support, exponential backoff (2^attempt \* baseDelay, capped 30s), configurable maxRetries (default 3) and retryDelayMs (default 1000)
  4. **Error message sanitization**: HTTP error responses no longer leak server error body text; errors report status code and status text only
  5. **Input validation**: UUID validation via Zod for all tenant/resource ID parameters (storage-sdk, search-sdk, kms-client, ai-sdk)
  6. **Telemetry hooks**: OpenTelemetry-based observability with configurable OTLP export, request counters, failure counters, and duration histograms (auth-sdk, crypto-inventory-sdk, kms-client, ai-sdk, search-sdk)

- 7256284: SDK onboarding error messages and edge gateway universal auth enforcement

  - All 12 SDKs now return developer-friendly 401 error messages with signup URL
    (https://cloud.qnsp.cuilabs.io/signup) and documentation links when API key
    is missing and backend returns 401
  - Edge gateway service proxy now enforces authentication on ALL non-health,
    non-public proxy routes (previously only tenant-service and ai-orchestrator
    intelligence routes required auth)
  - Updated proxy enforcement E2E test to include auth header for entitlement
    enforcement test (correctly expects 403 after auth, not 401 before auth)

## 0.1.1

### Patch Changes

- Add tenant crypto policy integration and PQC algorithm utilities to all SDKs.

  ### @qnsp/tenant-sdk

  - Added crypto policy management APIs: `getTenantCryptoPolicy()`, `upsertTenantCryptoPolicy()`
  - Added algorithm query methods: `getAllowedKemAlgorithms()`, `getAllowedSignatureAlgorithms()`, `getDefaultKemAlgorithm()`, `getDefaultSignatureAlgorithm()`
  - Added `CRYPTO_POLICY_ALGORITHMS` tier configurations
  - Added `toNistAlgorithmName()` and `ALGORITHM_TO_NIST` utilities

  ### @qnsp/storage-sdk

  - Added `PqcMetadata` interface with `algorithmNist` field
  - `initiateUpload()` now returns NIST algorithm name
  - Added `toNistAlgorithmName()` utility

  ### @qnsp/auth-sdk

  - Added `PqcSignatureMetadata` interface
  - Added `toNistAlgorithmName()` and `ALGORITHM_TO_NIST` for signature algorithms

  ### @qnsp/vault-sdk

  - Enhanced `VaultSecretPqcMetadata` with `algorithmNist` field
  - Added `toNistAlgorithmName()` utility

  ### @qnsp/kms-client

  - Added `KmsPqcMetadata` interface
  - `wrapKey()` now returns `algorithmNist` field
  - Added `toNistAlgorithmName()` utility

  ### @qnsp/audit-sdk

  - Added `toNistAlgorithmName()` and `ALGORITHM_TO_NIST` for signature algorithms

  ### @qnsp/access-control-sdk

  - Added `toNistAlgorithmName()` and `ALGORITHM_TO_NIST` for signature algorithms

  ### Documentation

  - Updated all SDK documentation with crypto policy integration examples
  - Added algorithm naming conventions (internal vs NIST)

## 0.1.0

### Minor Changes

- 77d95ce: Initial public release of QNSP TypeScript SDK packages.

### Patch Changes

- 2fac7bd: Automated changeset generated for staged code updates to keep release workflows fully synchronized.
