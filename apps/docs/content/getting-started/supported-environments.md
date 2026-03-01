---
title: Supported Environments
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# Supported Environments

QNSP services recognize three environment types via `NODE_ENV`:

## Environment types

| Environment | Purpose | Characteristics |
|-------------|---------|-----------------|
| `development` | Local development | Relaxed validation, verbose logging |
| `test` | Automated testing | Deterministic behavior, test fixtures |
| `production` | Live workloads | Strict validation, optimized performance |

## Base URLs

| Environment | Base URL |
|-------------|----------|
| Production | `https://api.qnsp.cuilabs.io` |
| Local | `http://localhost:<port>` |

Staging endpoints (if available) are provided separately per deployment.

## Environment-specific behavior

- **Token TTLs**: May differ between environments
- **Rate limits**: Development environments have relaxed limits
- **Logging**: Production uses structured JSON; development uses human-readable format
