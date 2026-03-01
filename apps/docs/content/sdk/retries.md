---
title: SDK Retries
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# SDK Retries

Some SDKs implement automatic retry with exponential backoff.

## Default behavior

- Max retries: 3
- Initial delay: 1000ms
- Max delay: 30 seconds
- Backoff multiplier: 2

## Retryable conditions

### HTTP status codes
- 429: Rate limited
- 502: Bad gateway
- 503: Service unavailable
- 504: Gateway timeout

### Network errors
- Connection refused
- Connection reset
- DNS resolution failure
- Timeout

## Configuration

### Node.js
```typescript
import { AuthClient } from "@qnsp/auth-sdk";

const client = new AuthClient({
	baseUrl: "http://localhost:8081",
	apiKey: process.env.QNSP_API_KEY,
	maxRetries: 5,
	retryDelayMs: 1_000,
});
```

## Rate limit handling

When rate limited (429):
1. Check `Retry-After` header
2. Wait specified duration
3. Retry request

SDKs that implement retries will:
1. Read `Retry-After` (if present)
2. Delay and retry up to `maxRetries`

## Disabling retries

```typescript
import { AuthClient } from "@qnsp/auth-sdk";

const client = new AuthClient({
	baseUrl: "http://localhost:8081",
	apiKey: process.env.QNSP_API_KEY,
	maxRetries: 0,
});
```

## Idempotency

Use idempotency keys at the API layer where supported.
