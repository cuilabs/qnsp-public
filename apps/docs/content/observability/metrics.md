---
title: Metrics
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
license: BSL-1.1
source_files:
  - /apps/observability-service/src/config/env.ts
---

# Metrics

QNSP exposes metrics for monitoring platform health and performance.

## Observability Service Configuration

From `apps/observability-service/src/config/env.ts`:

| Setting | Environment Variable | Default |
|---------|---------------------|--------|
| Port | `PORT` | 8105 |
| Proxy timeout | `OBSERVABILITY_PROXY_TIMEOUT_MS` | 15,000 ms |
| Max body size | `OBSERVABILITY_PROXY_MAX_BODY_BYTES` | 10 MB |

## OTLP Upstreams

| Signal | Environment Variable |
|--------|---------------------|
| Metrics | `OTLP_METRICS_UPSTREAM_URL` |
| Traces | `OTLP_TRACES_UPSTREAM_URL` |
| Logs | `OTLP_LOGS_UPSTREAM_URL` |

## Metric Types

### Counters
Monotonically increasing values:
- `qnsp_requests_total`
- `qnsp_errors_total`
- `qnsp_auth_attempts_total`

### Gauges
Point-in-time values:
- `qnsp_active_connections`
- `qnsp_cache_size_bytes`
- `qnsp_queue_depth`

### Histograms
Distribution of values:
- `qnsp_request_duration_seconds`
- `qnsp_encryption_duration_seconds`
- `qnsp_response_size_bytes`

## Key metrics

| Metric | Type | Description |
|--------|------|-------------|
| `qnsp_requests_total` | counter | Total requests by service, method, status |
| `qnsp_request_duration_seconds` | histogram | Request latency |
| `qnsp_errors_total` | counter | Errors by type |
| `qnsp_rate_limit_hits_total` | counter | Rate limit triggers |
| `qnsp_auth_success_total` | counter | Successful authentications |
| `qnsp_kms_operations_total` | counter | KMS operations by type |

## Labels

Common labels:
- `service`: Service name
- `method`: HTTP method
- `status`: HTTP status code
- `tenant_id`: Tenant identifier
- `operation`: Operation type

## Endpoints

The observability service is an OTLP ingestion proxy (it forwards telemetry to your configured upstream collectors).

OTLP ingest endpoints:
```
POST /otlp/v1/metrics
POST /otlp/v1/traces
POST /otlp/v1/logs
```
