---
title: KMS Auditability
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# KMS Auditability

All KMS operations are logged for compliance and forensics.

## Logged events

### Key lifecycle
- `key.created`
- `key.rotated`
- `key.suspended`
- `key.destroyed`
- `key.imported`

### Cryptographic operations
- `key.encrypt`
- `key.decrypt`
- `key.sign`
- `key.verify`
- `key.wrap`
- `key.unwrap`

### Access events
- `key.accessed`
- `key.denied`
- `policy.evaluated`

## Event structure

```json
{
  "eventId": "uuid",
  "eventType": "key.encrypt",
  "timestamp": "2024-01-15T10:30:00Z",
  "tenantId": "tenant-uuid",
  "actor": {
    "type": "service",
    "id": "service-uuid"
  },
  "resource": {
    "type": "key",
    "id": "key-uuid",
    "version": 3
  },
  "request": {
    "contextKeys": ["purpose:storage"]
  },
  "result": "success"
}
```

## Retention

- Default: 90 days
- Extended retention add-ons available
- Immutable storage

## Export

Events exportable to:
- SIEM systems
- S3-compatible storage
- Webhook endpoints

## Compliance mapping

| Requirement | KMS Audit Support |
|-------------|-------------------|
| SOC 2 | Full event logging |
| PCI DSS | Key access tracking |
| HIPAA | Access audit trails |
| GDPR | Data access logging |
