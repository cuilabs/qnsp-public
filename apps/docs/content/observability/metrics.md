---
title: Metrics
version: 0.0.1
last_updated: 2026-03-23
copyright: © 2025 CUI Labs. All rights reserved.
license: BSL-1.1
source_files:
  - /apps/observability-service/src/config/env.ts
  - /apps/pdp-service/src/pdp-metrics.ts
  - /apps/edge-gateway/src/observability.ts
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

## PDP and edge enforcement (production signals)

From `apps/pdp-service/src/pdp-metrics.ts` and `apps/edge-gateway/src/observability.ts` (typically exported via OTLP with CloudWatch namespace **`QNSP`** when using the ADOT awsemf pipeline in `infra/terraform/modules/otlp_gateway`):

| Metric | Type | Notable attributes |
|--------|------|--------------------|
| `pdp_evaluation_decisions_total` | counter | `evaluation_mode`, `evaluation_subreason` |
| `pdp_policy_materialization_outcomes_total` | counter | `outcome` |
| `pdp_policy_snapshot_age_ms` | histogram | `disposition` (`accepted_fresh` / `rejected_stale`) |
| `edge_pdp_decision_evaluation_total` | counter | `evaluation_mode`, `evaluation_subreason` |
| `edge_enforcement_degraded_privileged_denied_total` | counter | privileged mutations denied under `DEGRADED_LEGACY` |

**Dashboards / alarms:** `docs/operations/pdp-edge-enforcement-observability.md` (Terraform module `pdp_edge_enforcement_observability`, optional Grafana JSON under `infra/observability/dashboards/`).

**Scope note:** `/edge/v1/*` is outside the PDP enforcement hook — see `docs/architecture/EDGE-V1-CONTROL-PLANE-PDP-EXCEPTION.md`.
