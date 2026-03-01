---
title: Performance Monitoring
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# Performance Monitoring

Monitor and optimize QNSP performance.

## Key performance indicators

### Latency
| Endpoint | P50 | P95 | P99 |
|----------|-----|-----|-----|
| Auth | 50ms | 100ms | 200ms |
| KMS encrypt | 20ms | 50ms | 100ms |
| KMS decrypt | 20ms | 50ms | 100ms |
| Vault read | 30ms | 80ms | 150ms |
| Storage GET | 50ms | 150ms | 300ms |

### Throughput
| Service | Requests/sec |
|---------|--------------|
| Edge gateway | 10,000+ |
| Auth service | 5,000+ |
| KMS service | 2,000+ |
| Vault service | 3,000+ |

## Performance metrics

### Request latency
```
histogram_quantile(0.99, 
  rate(qnsp_request_duration_seconds_bucket[5m])
)
```

### Error rate
```
rate(qnsp_errors_total[5m]) / 
rate(qnsp_requests_total[5m])
```

### Saturation
```
qnsp_active_connections / 
qnsp_max_connections
```

## Performance dashboards

Pre-built Grafana dashboards:
- Service overview
- Request latency
- Error analysis
- Resource utilization

## Performance optimization

### Client-side
- Connection pooling
- Request batching
- Caching responses
- Compression

### Configuration
- Adjust timeouts
- Tune connection limits
- Enable keep-alive

## Benchmarking

Run performance tests:
```bash
qnsp benchmark \
  --operation encrypt \
  --concurrency 10 \
  --duration 60s
```
