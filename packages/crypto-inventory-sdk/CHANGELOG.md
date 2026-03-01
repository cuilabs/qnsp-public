# @qnsp/crypto-inventory-sdk

## 0.3.0

### Minor Changes

- Enforce mandatory API key at SDK construction time (BREAKING)

  - All SDK clients (except @qnsp/browser-sdk) now require `apiKey` at
    construction time. Constructors throw a clear error with signup URL,
    free tier details, and documentation link if apiKey is missing or empty.
  - Removed runtime 401 no-apiKey checks — validation is now fail-fast at
    construction, not at request time.
  - Removed conditional `if (apiKey)` guards on Authorization headers —
    headers are always set since apiKey is guaranteed non-empty.
  - @qnsp/kms-client: `apiToken` parameter is now required in the string
    overload of `HttpKmsServiceClient` constructor.
  - @qnsp/browser-sdk: Added opt-in telemetry module (`configureTelemetry`,
    `recordTelemetryEvent`, `flushTelemetry`) for usage analytics without
    collecting PII or cryptographic material. No API key required (local-only
    PQC crypto).
  - Updated cloud portal SDK factory functions to always pass apiKey.
  - Updated crypto-inventory-service internal callers to always pass apiKey.
  - Updated all SDK documentation examples to include apiKey.
  - Updated developer hub quickstart code examples.

### Patch Changes

- ad6d0d4: Automated changeset generated for staged code updates to keep release workflows fully synchronized.
- b7599c7: Automated changeset generated for staged code updates to keep release workflows fully synchronized.
- be1dd80: Automated changeset generated for staged code updates to keep release workflows fully synchronized.
- 4315709: Automated changeset generated for staged code updates to keep release workflows fully synchronized.
- Enterprise-grade SDK hardening across all API-calling SDKs:

  1. **Constructor validation**: Runtime guards for required API key/token with developer-friendly error messages
  2. **HTTPS enforcement**: All SDKs reject non-HTTPS baseUrl in production (HTTP allowed only for localhost in development/test)
  3. **Rate limiting with retry**: 429 handling with Retry-After header support, exponential backoff (2^attempt \* baseDelay, capped 30s), configurable maxRetries (default 3) and retryDelayMs (default 1000)
  4. **Error message sanitization**: HTTP error responses no longer leak server error body text; errors report status code and status text only
  5. **Input validation**: UUID validation via Zod for all tenant/resource ID parameters (storage-sdk, search-sdk, kms-client, ai-sdk)
  6. **Telemetry hooks**: OpenTelemetry-based observability with configurable OTLP export, request counters, failure counters, and duration histograms (auth-sdk, crypto-inventory-sdk, kms-client, ai-sdk, search-sdk)

## 0.2.1

### Patch Changes

- 4077458: Automated changeset generated for staged code updates to keep release workflows fully synchronized.
- 4077458: Automated changeset generated for staged code updates to keep release workflows fully synchronized.

## 0.2.0

### Minor Changes

- New SDK: @qnsp/crypto-inventory-sdk

  TypeScript client for the crypto-inventory-service API. Provides:

  - Cryptographic asset discovery and inventory management
  - PQC migration status tracking
  - Asset statistics and filtering
  - Discovery run management
  - NIST algorithm name conversion utilities

  Key APIs:

  - `listAssets()` - List assets with filters
  - `getAsset()` - Get asset details
  - `getAssetStats()` - Get aggregated statistics
  - `getPqcMigrationStatus()` - Track PQC migration progress
  - `discoverAssets()` - Trigger asset discovery
  - `getDiscoveryRuns()` - Get discovery history
