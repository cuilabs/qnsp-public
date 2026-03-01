---
title: Quotas
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# Quotas

Resource quotas and limits.

## Default quotas

| Resource | Default limit |
|----------|---------------|
| Keys per tenant | 1,000 |
| Secrets per tenant | 10,000 |
| Storage per tenant | 100 GB |
| Service accounts | 100 |
| Policies | 500 |
| Audit retention | 90 days |

## Tier-based quotas

| Resource | Developer | Business | Enterprise |
|----------|-----------|----------|------------|
| Keys | 100 | 1,000 | Unlimited |
| Secrets | 1,000 | 10,000 | Unlimited |
| Storage | 10 GB | 100 GB | Custom |
| API calls/month | 100K | 1M | Custom |

## Checking quotas

```
GET /tenant/v1/quotas
```

Returns:
```json
{
  "quotas": {
    "keys": {"used": 50, "limit": 1000},
    "secrets": {"used": 500, "limit": 10000},
    "storage": {"used": "5GB", "limit": "100GB"}
  }
}
```

## Quota exceeded

When quota exceeded:
```json
{
  "statusCode": 403,
  "error": "QUOTA_EXCEEDED",
  "message": "Key quota exceeded",
  "details": {
    "resource": "keys",
    "used": 1000,
    "limit": 1000
  }
}
```

## Increasing quotas

Contact support or upgrade tier:
- Self-service tier upgrade
- Custom quota requests
- Enterprise agreements
