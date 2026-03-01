---
title: CLI Automation
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# CLI Automation

Using QNSP CLI in automated environments.

## Non-interactive mode

Ensure the CLI doesn't prompt:
```bash
export QNSP_SERVICE_ID="your-service-id"
export QNSP_SERVICE_SECRET="your-service-secret"
export QNSP_TENANT_ID="your-tenant-uuid"

# With secrets set, qnsp won't need to prompt for credentials.
qnsp kms keys list
```

## JSON output

Machine-readable output:
```bash
qnsp kms keys list --output json | jq '.items[] | .keyId'
```

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Authentication error |
| 4 | Authorization error |
| 5 | Resource not found |
| 6 | Rate limited |
| 7 | Network error |

## Error handling

```bash
#!/bin/bash
set -e

if ! qnsp kms keys get "$KEY_ID" > /dev/null 2>&1; then
  echo "Key not found, creating..."
  qnsp kms keys create --name my-key --algorithm aes-256-gcm
fi
```

## Retry logic

```bash
#!/bin/bash

max_retries=3
retry_count=0

until qnsp vault secrets get "$SECRET_ID"; do
  retry_count=$((retry_count + 1))
  if [ $retry_count -ge $max_retries ]; then
    echo "Max retries reached"
    exit 1
  fi
  echo "Retrying in 5 seconds..."
  sleep 5
done
```

## Secrets in scripts

Never hardcode secrets:
```bash
# Good: environment variable
export QNSP_SERVICE_SECRET=$(vault read -field=secret qnsp/service)
qnsp auth token --service-id "$QNSP_SERVICE_ID" --service-secret "$QNSP_SERVICE_SECRET"

# Bad: hardcoded
qnsp auth token --service-secret "hardcoded-secret"  # DON'T DO THIS
```

## Logging

Enable verbose logging:
```bash
QNSP_VERBOSE=true qnsp kms keys list
```
