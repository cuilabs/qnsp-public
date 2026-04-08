---
title: "API Reference"
description: "QNSP REST API reference — authentication, endpoints, pagination, errors, and versioning."
version: 0.0.1
last_updated: 2026-04-01
copyright: © 2025 CUI Labs. All rights reserved.
license: BSL-1.1
---
# API Reference

The QNSP REST API is the foundation for all programmatic access to the platform. All requests are proxied through the edge gateway at `https://api.qnsp.cuilabs.io`.

## In This Section

- [Overview](./overview) — Base URL, request format, content types
- [Authentication](./authentication) — API keys, Bearer tokens, tenant headers
- [Reference](./reference) — Complete endpoint listing by service
- [Pagination](./pagination) — Cursor-based pagination for list endpoints
- [Idempotency](./idempotency) — Safe retries with idempotency keys
- [Errors](./errors) — Error object schema and HTTP status codes
- [Versioning](./versioning) — API versioning policy and stability guarantees

## Quick Example

```bash
curl -sS \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "x-qnsp-tenant-id: $TENANT_ID" \
  https://api.qnsp.cuilabs.io/vault/v1/secrets
```

See [Authentication](./authentication) for how to obtain an access token.
