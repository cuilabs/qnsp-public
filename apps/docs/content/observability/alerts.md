---
title: Alerts
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# Alerts

Configure alerts for QNSP platform events.

## Alert types

### Threshold alerts
Trigger when metric crosses threshold:
```yaml
- alert: HighErrorRate
  expr: rate(qnsp_errors_total[5m]) > 0.01
  for: 5m
  labels:
    severity: critical
```

### Anomaly alerts
Trigger on unusual patterns:
```yaml
- alert: UnusualTraffic
  expr: |
    qnsp_requests_total > 
    avg_over_time(qnsp_requests_total[7d]) * 2
```

### Availability alerts
Trigger on service unavailability:
```yaml
- alert: ServiceDown
  expr: up{job="qnsp"} == 0
  for: 1m
```

## Built-in alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| High error rate | >1% errors | critical |
| High latency | p99 > 1s | warning |
| Rate limit spike | >100/min | warning |
| Auth failures | >10/min | warning |
| Service unhealthy | health != ok | critical |

## Alert destinations

### Webhook
```json
{
  "type": "webhook",
  "url": "https://alerts.example.com/webhook",
  "headers": {"Authorization": "Bearer ..."}
}
```

### Email
```json
{
  "type": "email",
  "recipients": ["ops@example.com"]
}
```

### PagerDuty
```json
{
  "type": "pagerduty",
  "routingKey": "..."
}
```

### Slack
```json
{
  "type": "slack",
  "webhookUrl": "https://hooks.slack.com/..."
}
```

## Alert management

Alert management APIs are not shipped in this repo.
