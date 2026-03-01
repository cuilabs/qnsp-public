---
title: Status Page
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# Status Page

Monitor QNSP service status.

## Cloud status dashboard

QNSP Cloud service health is displayed on the QNSP website ("Cloud Status (Production)").

- QNSP website: https://qnsp.cuilabs.io#overview

The dashboard data is fetched from the website's status endpoint:

```
GET /api/status
```

## Components monitored

| Component | Description |
|-----------|-------------|
| API Gateway | Edge gateway availability |
| Authentication | Auth service |
| Key Management | KMS service |
| Secrets | Vault service |
| Storage | Storage service |
| Search | Search service |
| Audit | Audit service |

## Status levels

| Status | Description |
|--------|-------------|
| Operational | All systems normal |
| Degraded | Partial functionality |
| Partial outage | Some features unavailable |
| Major outage | Service unavailable |
| Maintenance | Planned maintenance |

## Incident updates

During incidents:
- Initial report within 15 minutes
- Updates every 30 minutes
- Resolution summary

## Notes

- The public dashboard reflects QNSP Cloud (hosted production) only.
- Private/VPC/sovereign and air-gapped deployments are monitored within customer-controlled environments.
