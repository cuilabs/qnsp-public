---
title: Control Plane vs Data Plane
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# Control Plane vs Data Plane

QNSP separates control plane operations from data plane operations.

## Control plane

Management operations that configure the system:

- Tenant provisioning
- Key creation and rotation policies
- Access control policy updates
- Service account management
- Audit configuration

Control plane operations are:
- Lower throughput
- Strongly consistent
- Fully audited

## Data plane

Runtime operations that process data:

- Encrypt/decrypt operations
- Secret retrieval
- Storage read/write
- Search queries
- Token validation

Data plane operations are:
- High throughput
- Eventually consistent where safe
- Optimized for latency

## Isolation

Control and data plane share authentication but have separate:
- Rate limit pools
- Failure domains
- Scaling characteristics
