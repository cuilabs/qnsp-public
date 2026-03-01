---
title: PQC Authentication
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# PQC Authentication

QNSP uses post-quantum cryptography for token signing.

## Why PQC

Classical signature algorithms (RSA, ECDSA) are vulnerable to quantum attacks. QNSP uses PQC algorithms to provide long-term security.

## Token signing

Access tokens are JWTs signed with:
- **Dilithium** (ML-DSA): Primary signature algorithm
- **Falcon**: Alternative for size-constrained environments
- **SPHINCS+**: Stateless hash-based fallback

## Algorithm selection

Default: Dilithium (ML-DSA-65)

Configurable via:
- `PQC_SIGNATURE_ALGORITHM` environment variable
- Tenant-level override

## Hybrid mode

For transition periods, hybrid signatures combine:
- Classical (Ed25519)
- PQC (Dilithium)

Both signatures must verify for token acceptance.

## Key rotation

PQC signing keys rotate on schedule:
- Automatic rotation period configurable
- Old keys remain valid for verification during overlap
- Key IDs in JWT header (`kid`)

## Verification

Services fetch public keys from auth-service:
```
GET /auth/jwt/public-key
```
