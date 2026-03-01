---
title: Cloud Deployment
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# Cloud Deployment

QNSP is available as a managed cloud service.

## Regions

| Region | Location | Status |
|--------|----------|--------|
| ap-southeast-1 | Singapore | Available |
| us-east-1 | N. Virginia | Available |
| eu-west-1 | Ireland | Available |
| ap-northeast-1 | Tokyo | Coming soon |

## Deployment tiers

### Shared
- Multi-tenant infrastructure
- Cost-effective
- Standard SLAs

### Dedicated
- Single-tenant compute
- Enhanced isolation
- Custom SLAs

### Private
- Customer VPC deployment
- Full network isolation
- Custom compliance

## Getting started

1. Sign up at https://cloud.qnsp.cuilabs.io
2. Create tenant
3. Configure authentication
4. Start integrating

## Network connectivity

### Public endpoints
```
api.qnsp.cuilabs.io
api.<region>.qnsp.cuilabs.io
```

### Private Link (AWS)
Available for dedicated/private tiers.

### VPC Peering
Available for private tier.

## Data residency

Configure data residency per tenant:
- Primary region for data storage
- Allowed regions for processing
- Replication restrictions
