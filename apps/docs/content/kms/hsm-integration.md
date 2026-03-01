---
title: HSM Integration
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# HSM Integration

QNSP KMS integrates with Hardware Security Modules for root key protection.

## Supported HSMs

| Vendor | Model | Interface |
|--------|-------|-----------|
| AWS | CloudHSM | PKCS#11 |
| Thales | Luna | PKCS#11 |
| Utimaco | CryptoServer | PKCS#11 |
| Entrust | nShield | PKCS#11 |

## HSM-protected operations

### Root key storage
- Tenant Master Keys wrapped by HSM root
- Root key never leaves HSM
- All unwrap operations in HSM

### Key generation
- Optional HSM-based RNG
- Key material generated in HSM
- Exported wrapped

## Configuration

```yaml
hsm:
  provider: "cloudhsm"
  clusterId: "cluster-xxx"
  credentials:
    customerCa: "/path/to/ca.crt"
    clientCert: "/path/to/client.crt"
    clientKey: "/path/to/client.key"
```

## High availability

- HSM cluster with multiple nodes
- Automatic failover
- Synchronous replication

## Performance

| Operation | Latency |
|-----------|---------|
| Unwrap key | 5-10 ms |
| Generate key | 10-20 ms |
| Sign (in HSM) | 5-15 ms |

## Compliance

HSM integration supports:
- FIPS 140-2 Level 3
- PCI DSS
- Common Criteria
