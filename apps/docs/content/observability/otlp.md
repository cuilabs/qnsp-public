---
title: OpenTelemetry (OTLP)
version: 0.0.1
last_updated: 2025-12-24
copyright: 2025 CUI Labs. All rights reserved.
---
# OpenTelemetry (OTLP)

QNSP supports OpenTelemetry Protocol for telemetry export.

## OTLP endpoints

OTLP ingestion is exposed by the observability service.

```
POST /otlp/v1/traces
POST /otlp/v1/metrics
POST /otlp/v1/logs
```

## Configuration

### Export to QNSP collector
```yaml
exporters:
  otlp:
    endpoint: <qnsp_base_url>
    headers:
      authorization: Bearer ${QNSP_TOKEN}
```

Exporting from QNSP to your collector is deployment-specific.

## Supported signals

| Signal | Status |
|--------|--------|
| Traces | Stable |
| Metrics | Stable |
| Logs | Beta |

## Resource attributes

QNSP adds resource attributes:
```
service.name: qnsp-kms-service
service.version: 1.2.3
deployment.environment: production
cloud.region: ap-southeast-1
qnsp.tenant_id: tenant-uuid
```

## Semantic conventions

QNSP follows OpenTelemetry semantic conventions:
- HTTP: `http.method`, `http.status_code`
- Database: `db.system`, `db.operation`
- Messaging: `messaging.system`

## Collector configuration

Example OTel Collector config:
```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317

processors:
  batch:

exporters:
  jaeger:
    endpoint: <jaeger_grpc_endpoint>

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [jaeger]
```
