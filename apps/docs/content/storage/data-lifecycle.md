---
title: Data Lifecycle
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# Data Lifecycle

Managing data through its lifecycle in QNSP Storage.

## Lifecycle stages

```
Create → Active → Archive → Delete → Purge
```

## Lifecycle policies

### Retention
```json
{
  "retention": {
    "mode": "governance",
    "period": "7y"
  }
}
```

Modes:
- `governance`: Admin can override
- `compliance`: Cannot be shortened

### Tiering
```json
{
  "tiering": {
    "rules": [
      {"after": "30d", "tier": "warm"},
      {"after": "90d", "tier": "cold"}
    ]
  }
}
```

### Expiration
```json
{
  "expiration": {
    "after": "365d",
    "action": "delete"
  }
}
```

## Deletion

### Soft delete
- Object marked deleted
- Recoverable for retention period
- Metadata preserved

### Hard delete
- Object data removed
- Metadata removed
- Encryption keys destroyed

### Crypto-shred
- Delete encryption keys
- Data becomes unrecoverable
- Immediate effect

## Legal hold

Prevent deletion regardless of policy:
```
PUT /storage/v1/objects/{id}/legal-hold
{
  "enabled": true,
  "reason": "litigation-2024-001"
}
```

## Audit

All lifecycle events logged:
- State transitions
- Policy applications
- Manual overrides
