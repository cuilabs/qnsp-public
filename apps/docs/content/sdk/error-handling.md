---
title: SDK Error Handling
version: 0.2.0
last_updated: 2026-04-30
copyright: © 2025-2026 CUI Labs. All rights reserved.
license: Apache-2.0
source_files:
  - /packages/auth-sdk/src/errors.ts
  - /packages/vault-sdk/src/errors.ts
  - /sdks/python/qnsp/src/qnsp/_errors.py
  - /sdks/go/qnsp/internal/qnspcore/errors.go
  - /sdks/rust/qnsp/src/errors.rs
---

> **Note** — As of 2026-04-30, the per-service `@cuilabs/qnsp-vault-sdk` package is consolidated into the unified `@cuilabs/qnsp` SDK (one package per language). New integrations should use:
>
> ```typescript
> import { QnspClient } from "@cuilabs/qnsp";
> const qnsp = new QnspClient({ apiKey: process.env.QNSP_API_KEY! });
> await qnsp.vault./* method */(...);
> ```
>
> See [SDK overview](../sdk/) for the consolidated package. The per-service shapes documented below remain accurate at the wire level (REST/gRPC) and are kept for reference.


# SDK Error Handling

Every QNSP SDK distinguishes four kinds of failure so callers can branch on the failure mode without parsing error strings:

| Kind | When it fires |
|---|---|
| Network | DNS, TLS, timeout, or connection failure reaching the QNSP edge gateway |
| Auth | API key rejected at activation (HTTP 401/403 from `/billing/v1/sdk/activate`) |
| API | A QNSP service returned a 4xx/5xx with a structured body |
| Webhook | Signature mismatch, timestamp out of skew, malformed payload, missing fields |

The class names differ per language but the taxonomy is identical, so the same `try`/`catch`/`Result` shape ports across stacks.

## TypeScript / Node.js

```typescript
import { VaultClient } from "@cuilabs/qnsp-vault-sdk";
import { QnspApiError, QnspNetworkError } from "@cuilabs/qnsp-vault-sdk/errors";

const vault = new VaultClient({ baseUrl: "https://api.qnsp.cuilabs.io/proxy/vault", apiKey: "<token>" });

try {
  await vault.getSecret({ tenantId: "<uuid>", id: "missing" });
} catch (err) {
  if (err instanceof QnspApiError) console.log("HTTP", err.statusCode, err.code);
  else if (err instanceof QnspNetworkError) console.log("could not reach QNSP:", err.message);
  else throw err;
}
```

Each `@cuilabs/qnsp-*-sdk` package exports its own typed error classes from `./errors`.

## Python

```python
from qnsp import QnspApiError, QnspNetworkError, QnspAuthError, QnspError

with QnspClient(api_key=os.environ["QNSP_API_KEY"]) as q:
    try:
        q.vault.get_secret("missing")
    except QnspApiError as exc:
        print("HTTP", exc.status_code, exc.code, exc.body)
    except QnspNetworkError as exc:
        print("could not reach QNSP:", exc)
    except QnspAuthError as exc:
        print("api key rejected:", exc.code, exc.message)
```

All errors descend from `QnspError`. See [`sdks/python/qnsp/src/qnsp/_errors.py`](https://github.com/cuilabs/qnsp-public/blob/main/sdks/python/qnsp/src/qnsp/_errors.py).

## Go

```go
import (
    "errors"
    "github.com/cuilabs/qnsp-public/sdks/go/qnsp"
)

if _, err := c.Vault().GetSecret(ctx, "missing"); err != nil {
    var apiErr *qnsp.APIError
    var netErr *qnsp.NetworkError
    var authErr *qnsp.AuthError
    switch {
    case errors.As(err, &apiErr):
        fmt.Println("HTTP", apiErr.StatusCode, apiErr.Code)
    case errors.As(err, &netErr):
        fmt.Println("could not reach QNSP:", netErr.Err)
    case errors.As(err, &authErr):
        fmt.Println("api key rejected:", authErr.Code)
    }
}
```

All Go errors implement the unexported `qnspError()` marker so `qnsp.Error` works as a type-narrowing predicate. See [`sdks/go/qnsp/internal/qnspcore/errors.go`](https://github.com/cuilabs/qnsp-public/blob/main/sdks/go/qnsp/internal/qnspcore/errors.go).

## Rust

```rust
match c.vault().get_secret("missing").await {
    Err(qnsp::Error::Api(e)) if e.status_code == 404 => println!("not found"),
    Err(qnsp::Error::Network(e)) => println!("could not reach QNSP: {e}"),
    Err(qnsp::Error::Auth(e)) => println!("api key rejected: {e:?}"),
    Err(qnsp::Error::Webhook(e)) => println!("webhook: {e}"),
    Err(e) => return Err(e),
    Ok(secret) => println!("{secret:?}"),
}
```

All errors flow through the `qnsp::Error` enum. See [`sdks/rust/qnsp/src/errors.rs`](https://github.com/cuilabs/qnsp-public/blob/main/sdks/rust/qnsp/src/errors.rs).

## JVM / Android

```kotlin
import io.cuilabs.qnsp.QnspApiException
import io.cuilabs.qnsp.QnspAuthException
import io.cuilabs.qnsp.QnspNetworkException
import io.cuilabs.qnsp.QnspWebhookException

try {
    val secret = qnsp.vault.getSecret("missing")
} catch (e: QnspApiException) {
    if (e.statusCode == 404) println("not found") else println("api error ${e.statusCode} ${e.code}")
} catch (e: QnspNetworkException) {
    println("could not reach QNSP: ${e.message}")
} catch (e: QnspAuthException) {
    println("api key rejected: ${e.code}")
} catch (e: QnspWebhookException) {
    println("webhook: ${e.message}")
}
```

All SDK errors extend the unchecked `QnspException` base class — catch `QnspException` to handle any failure uniformly. `QnspApiException` exposes `statusCode`, the stable `code` string, and the raw `body`. See [`sdks/jvm/src/main/kotlin/io/cuilabs/qnsp/QnspErrors.kt`](https://github.com/cuilabs/qnsp-public/blob/main/sdks/jvm/src/main/kotlin/io/cuilabs/qnsp/QnspErrors.kt).

## Status-code mapping

QNSP services map to standard HTTP semantics:

| Status | Meaning | Common cause |
|---|---|---|
| 400 | Bad request | Validation failure on request body |
| 401 | Unauthorised | API key invalid OR activation token expired (SDK retries once) |
| 402 | Payment required | Tier does not entitle the call (e.g. SSE on free tier) |
| 403 | Forbidden | RBAC / capability check failed |
| 404 | Not found | Resource id does not exist for the tenant |
| 409 | Conflict | Idempotency key reuse with mismatched body, version mismatch on update |
| 422 | Unprocessable | Semantically invalid request (e.g. unsupported algorithm name) |
| 429 | Too many requests | Quota exhausted; retry after `Retry-After` header |
| 502 | Bad gateway | Upstream service temporarily unavailable |
| 503 | Service unavailable | Tenant entitlement state cannot be resolved |

Each SDK surfaces the structured body of an API error so you can act on `code` (a stable string identifier) rather than parsing the human-readable `message`.

## Webhook errors

Webhook verification helpers (`parse_qnsp_webhook` in Python, `qnsp.ParseWebhook` in Go, `qnsp::parse_webhook` in Rust, `QnspWebhooks.parse` on JVM, per-service equivalents in TypeScript) return a typed error whose `.reason` field describes which check failed:

- `signature header must start with 'sha256='`
- `signature mismatch` — HMAC verification failed
- `timestamp is too old` / `timestamp is in the future` — replay protection (5-minute window by default)
- `body is not valid JSON`
- `missing event_type` / `missing event_id`

Surface the error message back to the webhook sender as a 400; do not echo it to end users.
