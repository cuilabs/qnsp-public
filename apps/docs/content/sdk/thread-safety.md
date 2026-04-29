---
title: Thread Safety
version: 0.2.0
last_updated: 2026-04-30
copyright: © 2025-2026 CUI Labs. All rights reserved.
---
# Thread Safety

QNSP ships SDKs in four languages: TypeScript/Node.js, Python, Go, and Rust. Each language has its own concurrency model — the guarantees below describe what each official SDK gives you.

## Node.js / TypeScript

- Single-threaded event loop; the SDKs are safe for concurrent `async` operations from the same client instance.
- One client instance per application is the recommended pattern.

```typescript
import { VaultClient } from "@qnsp/vault-sdk";

// Good: shared client
const client = new VaultClient({ baseUrl: "https://api.qnsp.cuilabs.io/proxy/vault", apiKey: "<token>" });

async function handler1() { await client.createSecret({ tenantId: "<uuid>", name: "s1", payload: "<base64>" }); }
async function handler2() { await client.createSecret({ tenantId: "<uuid>", name: "s2", payload: "<base64>" }); }
```

```typescript
// Bad: new client per request — wastes connections
async function handler() {
  const client = new VaultClient({ baseUrl: "https://api.qnsp.cuilabs.io/proxy/vault", apiKey: "<token>" });
  await client.createSecret({ tenantId: "<uuid>", name: "s", payload: "<base64>" });
}
```

## Python (`qnsp` v0.2.0+)

- `QnspClient` is **not** thread-safe by default. The internal activation cache and `httpx.Client` connection pool are shared by all sub-clients (`vault`, `kms`, `audit`); concurrent calls from multiple threads are safe at the HTTP layer (`httpx.Client` is thread-safe), but cache invalidation is not synchronised.
- Recommended pattern: one `QnspClient` per process, served via a global or via `contextvars` for per-request scoping.
- For multi-process workloads (gunicorn, uvicorn workers), construct one client per worker after the fork.

```python
from qnsp import QnspClient

qnsp = QnspClient(api_key=os.environ["QNSP_API_KEY"])  # process-wide singleton

async def handle():
    await asyncio.to_thread(qnsp.vault.create_secret, name="s", payload_b64="...")
```

A native-async variant (`AsyncQnspClient` over `httpx.AsyncClient`) is on the v0.3.0 roadmap.

## Go (`github.com/cuilabs/qnsp-public/sdks/go/qnsp` v0.1.0+)

- `qnsp.Client` is **safe for concurrent use** by multiple goroutines. The internal `*Activator` uses a `sync.Mutex` around the activation cache; `*http.Client` is goroutine-safe by Go's standard library guarantees.
- Recommended pattern: one `qnsp.Client` per program, passed to handlers / workers.

```go
c, _ := qnsp.NewClient(qnsp.ClientOptions{APIKey: os.Getenv("QNSP_API_KEY")})
defer c.Close()

go func() { c.Vault().CreateSecret(ctx, vault.CreateSecretRequest{...}, "") }()
go func() { c.KMS().Sign(ctx, "key-id", []byte("hello"), "") }()
```

## Rust (`qnsp` v0.1.0+)

- `qnsp::Client` is `Clone` + `Send` + `Sync`. Internal state lives behind `Arc<Activation>`; the activation cache uses `std::sync::Mutex`. `reqwest::Client` is itself a cheap `Clone` over an `Arc<Inner>`.
- Recommended pattern: build one `qnsp::Client` at startup, `clone()` it freely (cheap), and pass clones into spawned tasks.

```rust
let c = qnsp::Client::new(opts)?;
let c2 = c.clone();
tokio::spawn(async move { c2.vault().create_secret(req, None).await });
```

## Connection pooling

All four SDKs reuse a single underlying HTTP connection pool per client instance:

- TypeScript: native `fetch` (Undici under Node) reuses keep-alive connections.
- Python: `httpx.Client` keeps a connection pool per host.
- Go: `*http.Client` reuses connections via the default `Transport`.
- Rust: `reqwest::Client` keeps a connection pool per host (Hyper underneath).

Construct one client and reuse it; do not build a fresh client per request.

## Token refresh synchronisation

Each SDK runs the activation handshake on first use and caches the result with a near-expiry buffer (60 seconds before the server-issued `expiresAt`). On a `401`, the cache is invalidated and the originating request retried once.

In all four SDKs the refresh is **not** strictly serialised across concurrent callers — concurrent goroutines / threads / async tasks may both observe a refresh in flight. This is intentional: the activation endpoint is idempotent, the response is identical, and serialising would block on lock contention. If you observe duplicate handshakes in your load tests, that is the expected behaviour.

## Cleanup

- TypeScript: SDK clients do not require explicit cleanup.
- Python: `QnspClient` is a context manager; use `with QnspClient(...) as q:` or call `.close()` to release the `httpx.Client` connection pool.
- Go: call `Client.Close()` (currently a no-op but reserved).
- Rust: `Drop` releases the `Arc`-shared state automatically.
