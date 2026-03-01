---
title: KMS Architecture
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
license: BSL-1.1
source_files:
  - /apps/kms-service/src/config/env.ts
  - /apps/kms-service/src/server.ts
---

# KMS Architecture

The Key Management Service (KMS) provides centralized cryptographic key operations.

## Service Configuration

From `apps/kms-service/src/config/env.ts`:

| Setting | Environment Variable | Default |
|---------|---------------------|---------|
| Port | `PORT` | 8095 |
| Default algorithm | `KMS_ALGORITHM` | `AES-256-GCM` |
| FIPS mode | `KMS_REQUIRE_FIPS` | `false` |
| Evidence logging | `KMS_EVIDENCE_ENABLED` | `false` |
| Cache enabled | `KMS_CACHE_ENABLED` | `true` |
| Cache TTL | `KMS_CACHE_TTL_SECONDS` | 600 (10 min) |

## HSM/PKCS#11 Configuration

From `apps/kms-service/src/config/env.ts`:

| Setting | Environment Variable | Description |
|---------|---------------------|-------------|
| Module path | `KMS_PKCS11_MODULE_PATH` | Path to PKCS#11 library |
| Slot | `KMS_PKCS11_SLOT` | HSM slot number |
| PIN | `KMS_PKCS11_PIN` | HSM PIN |
| Key ID | `KMS_PKCS11_KEY_ID` | Optional key identifier |
| Label | `KMS_PKCS11_LABEL` | Optional key label |

Multiple HSM configurations via `KMS_PKCS11_CONFIGS_JSON`:
```json
[
  {"modulePath": "/usr/lib/softhsm/libsofthsm2.so", "slot": 0, "pin": "1234"}
]
```

## Database Configuration

| Setting | Environment Variable | Default |
|---------|---------------------|---------|
| Database URL | `DATABASE_URL` | `postgresql://qnsp:qnsp-password@127.0.0.1:5432/kms` |
| Pool max | `DATABASE_POOL_MAX` | 20 |
| Idle timeout | `DATABASE_POOL_IDLE_MS` | 30,000 ms |
| SSL mode | `DATABASE_SSL` | `disable` |

## Request Flow

```
Client → Edge Gateway (8107) → KMS Service (8095) → HSM (PKCS#11)
                                       ↓
                                 PostgreSQL
```

## Key Operations

| Operation | Description | HSM Required |
|-----------|-------------|--------------|
| Create | Generate new key | Optional |
| Encrypt | Encrypt data with key | No |
| Decrypt | Decrypt data with key | No |
| Sign | Create signature | No |
| Verify | Verify signature | No |
| Wrap | Wrap another key | No |
| Unwrap | Unwrap a key | No |
| Rotate | Create new version | Optional |
| Destroy | Crypto-shred key | No |

## Caching

When `KMS_CACHE_ENABLED=true`:
- L1: In-memory cache
- L2: Redis (if `KMS_CACHE_REDIS_URL` configured)
- TTL: `KMS_CACHE_TTL_SECONDS` (default 600s)

## Audit Integration

When `KMS_EVIDENCE_ENABLED=true`:
- Events sent to `AUDIT_SERVICE_URL`
- Signed with `AUDIT_SBOM_SIGNING_PRIVATE_KEY_PEM`
- Bearer token: `AUDIT_BEARER_TOKEN`
