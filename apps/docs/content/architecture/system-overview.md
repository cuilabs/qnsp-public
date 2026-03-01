---
title: System Overview
version: 0.0.3
last_updated: 2026-01-16
copyright: © 2025 CUI Labs. All rights reserved.
license: BSL-1.1
source_files:
  - /apps/edge-gateway/src/config/env.ts
  - /apps/auth-service/src/config/env.ts
  - /apps/kms-service/src/config/env.ts
  - /apps/vault-service/src/config/env.ts
  - /apps/storage-service/src/config/env.ts
  - /apps/audit-service/src/config/env.ts
  - /packages/security/src/tenant-crypto-policy-client.ts
---

# System Overview

QNSP is a microservice-based platform exposing tenant-scoped security primitives via an API-first model. All services integrate with tenant-crypto-policy-client for consistent algorithm selection based on tenant billing tiers and custom crypto policies. The platform is migrating from legacy v0 tiers to v1 profiles + tiers (evidence-first model).

## Request Flow

1. Client sends request to edge gateway
2. Edge gateway authenticates, rate-limits, and routes
3. Request reaches target service
4. Service validates authorization and processes request
5. Service queries tenant crypto policy for algorithm selection
6. Response returns through edge gateway

## Tenant Crypto Policy Integration

Services use the shared `@qnsp/security` tenant-crypto-policy-client to:
- Fetch tenant-specific crypto policies from tenant-service
- Select appropriate PQC algorithms based on billing tier (v0 tiers)
- Apply custom algorithm allowlists and forbidden lists
- Cache policies for performance (60s TTL by default)
- Fallback to default policies when tenant-service is unavailable

Tenant-aware policy responses are available at:

```
GET /platform/v1/crypto/policy
```

When `X-Tenant-Id` is provided, edge-gateway returns the tenant’s **v1** policy with ETag headers.

## Core Services

Service ports derived from `apps/*/src/config/env.ts`:

| Service | Default Port | Responsibility | Crypto Policy Integration |
|---------|--------------|----------------|---------------------------|
| `platform-api` | 8080 | Platform management API | ❌ No crypto operations |
| `auth-service` | 8081 | Identity, tokens, WebAuthn, sessions | ✅ JWT signing with PQC |
| `vault-service` | 8090 | Secrets storage and injection | ✅ Secret encryption |
| `storage-service` | 8092 | Encrypted object storage | ✅ File encryption |
| `ai-orchestrator` | 8094 | AI/ML workload orchestration | ✅ Model encryption |
| `kms-service` | 8095 | Key management, HSM/PKCS#11 | ✅ Key generation |
| `search-service` | 8101 | Searchable encryption queries | ✅ Search index encryption |
| `access-control-service` | 8102 | Policy evaluation, RBAC | ✅ Capability token signing |
| `audit-service` | 8103 | Event logging, Merkle checkpointing | ✅ Audit log signing |
| `security-monitoring-service` | 8104 | Threat detection, anomaly analysis | ✅ Detection signature verification |
| `observability-service` | 8105 | Metrics aggregation, OTLP | ✅ Metrics signing |
| `billing-service` | 8106 | Subscription, usage metering | ❌ No crypto operations |
| `edge-gateway` | 8107 | Ingress, routing, WAF, DDoS protection | ✅ Request logging signatures |
| `tenant-service` | 8108 | Tenant provisioning, configuration | ✅ Tenant metadata signing |
| `crypto-inventory-service` | 8115 | Cryptographic asset tracking | ✅ Asset metadata signing |

**Crypto Policy Tiers (v0):**
- `default`: Kyber-768, Dilithium-3 (balanced performance)
- `strict`: Kyber-768/1024, Dilithium-3/5, Falcon-1024 (enhanced security)
- `maximum`: Kyber-1024, Dilithium-5, Falcon-1024, SPHINCS+ (maximum security)
- `government`: Kyber-1024, Dilithium-5, SPHINCS+ (government compliance)

**Crypto Policy Profiles + Tiers (v1):**
- Profiles: `gov-high-assurance`, `defense-long-life-data`, `financial-hybrid-pqc`, `research-eval`
- Tiers: `TIER1_APPROVED`, `TIER2_HIGH_ASSURANCE`, `TIER3_DIVERSITY`, `TIER4_EXPERIMENTAL`, `TIER0_LEGACY`

## Edge Gateway Features

From `apps/edge-gateway/src/config/env.ts`:

| Feature | Default | Description |
|---------|---------|-------------|
| Rate limiting | 5,000 RPS | `EDGE_RATE_LIMIT_RPS` |
| WAF | Enabled | SQL injection, XSS, path traversal, SSRF |
| DDoS protection | Enabled | Volume threshold: 100 req/60s |
| Bot protection | Enabled | Challenge threshold: 20 req |
| PQC-TLS | Disabled | Kyber-768 KEM, Dilithium-2 signatures |

## Communication Model

- **External**: HTTPS terminates at the public AWS ALB; ALB forwards HTTP to edge-gateway (port 8107)
- **Internal**: HTTP between services (TLS/mTLS depends on deployment topology)
- **Async**: Event-driven via audit-service

In production, `platform-api` is deployed and routed through edge-gateway at `/proxy/platform/*`.
