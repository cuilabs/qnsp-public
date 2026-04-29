# Changelog

All notable changes to `qnsp` (Python SDK) will be documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project follows [Semantic Versioning](https://semver.org/).

## [0.2.0] — 2026-04-30

**Repositioning release.** The SDK is now general-purpose — every QNSP customer uses the same shape, with no per-partner namespaces.

### Added

- `qnsp.crypto` — local PQC primitives via `liboqs-python` 0.12.0, opt-in via the `qnsp[crypto]` extra. Covers ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205), Falcon, plus the full liboqs 0.12.0 algorithm surface (HQC, BIKE, FrodoKEM, Classic-McEliece, MAYO, CROSS). Algorithm names mirror `@qnsp/cryptography` and the new Go/Rust SDKs.
- `qnsp.vault` — `VaultClient` with create / get / get-version / rotate / delete / list-versions.
- `qnsp.kms` — `KmsClient` with create-key / list-keys / get-key / rotate / delete plus sign / verify / wrap / unwrap.
- `qnsp.audit` — `AuditClient` with log-event, ingest-events (batch), and list-events.
- `_service.py` — shared HTTP plumbing for service clients, including 401-triggered token refresh + retry.
- `_activation.py` — `ApiKeyActivation` flow that mirrors `@qnsp/sdk-activation` from the TypeScript family. Handshake hits `/billing/v1/sdk/activate` with `sdkId="qnsp-python"`, caches the result with a 60 s near-expiry buffer.
- Generic `parse_qnsp_webhook()` and `verify_qnsp_webhook_signature()` — every QNSP webhook consumer needs these regardless of integration.
- Top-level introspection: `client.tenant_id`, `client.tier`, `client.limits`, `client.has_feature("sseEnabled")`.

### Changed

- **Removed all BEE-specific surface.** `qnsp.partners.bee`, `BeePartnerClient`, `BeeProvisionResponse`, `BeeStatusResponse`, `parse_bee_webhook`, `verify_bee_webhook_signature`, `BeeWebhookEvent` are all gone. Per-partner SDKs were the wrong abstraction; partners use QNSP like any other customer. The webhook helpers were renamed to QNSP-generic names since no partner-specific logic exists in them.
- `QnspClient` no longer takes `client_id`/`client_secret`. The `from_partner_credentials` constructor is removed alongside `QnspPartnerClient`. Service-account JWT minting can be reintroduced as a generic feature in a later release if a non-partner use case materialises.
- README rewritten to lead with vault / KMS / audit / local crypto. No BEE references.

### Migration from 0.1.x

If you were using the v0.1.0 BEE-specific SDK:

```diff
- from qnsp import QnspClient, parse_bee_webhook
-
- with QnspClient(client_id=..., client_secret=...) as q:
-     sub = q.bee.provision(...)
+ # Use httpx (or any HTTP client) to call the partner endpoints
+ # directly. The endpoints + auth are documented at
+ # docs/integrations/bee-partner-contract.md (private repo) /
+ # cuilabs/qnsp-public if exported. The SDK no longer wraps them.
```

If you used `parse_bee_webhook` for general QNSP webhook verification (its only legitimate use):

```diff
- from qnsp import parse_bee_webhook
- event = parse_bee_webhook(...)
+ from qnsp import parse_qnsp_webhook
+ event = parse_qnsp_webhook(...)  # identical signature
```

## [0.1.0] — 2026-04-30 (yanked)

Initial release — BEE-partner-specific surface (provision / deprovision / status). Yanked from PyPI shortly after publish; superseded by the general-purpose 0.2.0. If you installed 0.1.0, upgrade with `pip install --upgrade qnsp` and follow the migration above.
