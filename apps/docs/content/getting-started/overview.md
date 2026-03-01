---
title: Getting Started Overview
version: 0.0.2
last_updated: 2026-01-16
copyright: © 2025 CUI Labs. All rights reserved.
license: Apache-2.0 (SDK packages) / BSL-1.1 (core platform)
source_files:
  - /package.json
  - /apps/*/src/config/env.ts
---

# Overview

QNSP is an API-first platform providing tenant-scoped security primitives: identity, key management, secrets, encrypted storage, and audit.

QNSP was conceived, architected, and engineered starting in Dec 2020. The current monorepo was bootstrapped in Nov 2025.

> **Monorepo**: `@qnsp/monorepo` v0.0.1  
> **Node.js**: ≥24.12.0 | **pnpm**: ≥10.25.0

## What QNSP Provides

- **Identity & Auth**: PQC-signed JWTs (Dilithium), refresh tokens, service accounts, RBAC
- **KMS**: Key generation, rotation, BYOK import
- **Secrets**: Secure storage with TTL and rotation
- **Storage**: Encryption at rest
- **Audit**: Immutable event logs and Merkle checkpointing

## Service Map

Ports derived from `apps/*/src/config/env.ts`:

| Service | Default Port | Purpose |
|---------|--------------|---------|
| `platform-api` | 8080 | Platform management API |
| `auth-service` | 8081 | Token issuance, WebAuthn, identity |
| `vault-service` | 8090 | Secrets management |
| `storage-service` | 8092 | Encrypted object storage |
| `ai-orchestrator` | 8094 | AI/ML workload orchestration |
| `kms-service` | 8095 | Key management, HSM integration |
| `search-service` | 8101 | Searchable encryption queries |
| `access-control-service` | 8102 | Policy evaluation, RBAC |
| `audit-service` | 8103 | Event logging, Merkle checkpointing |
| `security-monitoring-service` | 8104 | Threat detection |
| `observability-service` | 8105 | Metrics, OTLP |
| `billing-service` | 8106 | Subscription, usage metering |
| `edge-gateway` | 8107 | Ingress, WAF, DDoS, rate limiting |
| `tenant-service` | 8108 | Tenant provisioning |
| `crypto-inventory-service` | 8115 | Cryptographic asset tracking |

## Next Steps

- [Authentication Prerequisites](./authentication-prerequisites)
- [Quickstart with curl](./quickstart-curl)
- [API Reference](/api/overview)
