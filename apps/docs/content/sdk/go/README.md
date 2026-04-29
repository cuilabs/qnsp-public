---
title: Go SDK
version: 0.1.0
last_updated: 2026-04-30
copyright: © 2025-2026 CUI Labs. All rights reserved.
---
# Go SDK

Module path: `github.com/cuilabs/qnsp-public/sdks/go/qnsp` ([source](https://github.com/cuilabs/qnsp-public/tree/main/sdks/go/qnsp), [changelog](https://github.com/cuilabs/qnsp-public/blob/main/sdks/go/qnsp/CHANGELOG.md)).

## Installation

```bash
go get github.com/cuilabs/qnsp-public/sdks/go/qnsp@latest
```

The base module pulls in only the standard library. The optional `qnsp/crypto` subpackage links against `liboqs` via [`liboqs-go`](https://github.com/open-quantum-safe/liboqs-go); if you do not import `qnsp/crypto`, no native dependency is required.

To use `qnsp/crypto` you need `liboqs` and `pkg-config` available at build time:

| Platform | Command |
| --- | --- |
| macOS | `brew install liboqs pkg-config` |
| Debian/Ubuntu | `apt install liboqs-dev pkg-config` |
| From source | <https://github.com/open-quantum-safe/liboqs> |

You may also need to set `PKG_CONFIG_PATH` to include the `liboqs-go.pc` file shipped inside the module cache (`$GOPATH/pkg/mod/github.com/open-quantum-safe/liboqs-go@<version>/.config`).

Requires Go 1.22+.

## Quick start

```go
package main

import (
	"context"
	"encoding/base64"
	"os"

	"github.com/cuilabs/qnsp-public/sdks/go/qnsp"
	"github.com/cuilabs/qnsp-public/sdks/go/qnsp/audit"
	"github.com/cuilabs/qnsp-public/sdks/go/qnsp/kms"
	"github.com/cuilabs/qnsp-public/sdks/go/qnsp/vault"
)

func main() {
	c, err := qnsp.NewClient(qnsp.ClientOptions{APIKey: os.Getenv("QNSP_API_KEY")})
	if err != nil { panic(err) }
	defer c.Close()
	ctx := context.Background()

	// Vault
	c.Vault().CreateSecret(ctx, vault.CreateSecretRequest{
		Name:       "openai-api-key",
		PayloadB64: base64.StdEncoding.EncodeToString([]byte("sk-...")),
		Algorithm:  "ml-kem-768",
	}, "")

	// KMS
	key, _ := c.KMS().CreateKey(ctx, kms.CreateKeyRequest{Algorithm: "ml-dsa-65", Purpose: "signing"}, "")
	sig, _ := c.KMS().Sign(ctx, key["keyId"].(string), []byte("hello"), "")

	// Audit
	c.Audit().LogEvent(ctx, audit.LogEventRequest{
		EventType: "model.inference",
		Payload:   map[string]any{"modelId": "gpt-4o"},
	}, "")
}
```

## Modules

The SDK ships nine customer-facing modules that mirror the QNSP services callable through the edge gateway today:

| Module | Source | What it wraps |
|---|---|---|
| `qnsp/vault` | [vault/vault.go](https://github.com/cuilabs/qnsp-public/blob/main/sdks/go/qnsp/vault/vault.go) | `apps/vault-service` (`/vault/v1`) |
| `qnsp/kms` | [kms/kms.go](https://github.com/cuilabs/qnsp-public/blob/main/sdks/go/qnsp/kms/kms.go) | `apps/kms-service` (`/kms/v1`) |
| `qnsp/audit` | [audit/audit.go](https://github.com/cuilabs/qnsp-public/blob/main/sdks/go/qnsp/audit/audit.go) | `apps/audit-service` (`/audit/v1`) |
| `qnsp/tenant` | [tenant/tenant.go](https://github.com/cuilabs/qnsp-public/blob/main/sdks/go/qnsp/tenant/tenant.go) | `apps/tenant-service` (`/tenant/v1`) |
| `qnsp/access` | [access/access.go](https://github.com/cuilabs/qnsp-public/blob/main/sdks/go/qnsp/access/access.go) | `apps/access-control-service` (`/access/v1`) |
| `qnsp/billing` | [billing/billing.go](https://github.com/cuilabs/qnsp-public/blob/main/sdks/go/qnsp/billing/billing.go) | `apps/billing-service` (`/billing/v1`) |
| `qnsp/cryptoinventory` | [cryptoinventory/cryptoinventory.go](https://github.com/cuilabs/qnsp-public/blob/main/sdks/go/qnsp/cryptoinventory/cryptoinventory.go) | `apps/crypto-inventory-service` (`/crypto/v1`) |
| `qnsp/storage` | [storage/storage.go](https://github.com/cuilabs/qnsp-public/blob/main/sdks/go/qnsp/storage/storage.go) | `apps/storage-service` (`/storage/storage/v1`) |
| `qnsp/search` | [search/search.go](https://github.com/cuilabs/qnsp-public/blob/main/sdks/go/qnsp/search/search.go) | `apps/search-service` (`/search/v1`) |
| `qnsp/crypto` | [crypto/](https://github.com/cuilabs/qnsp-public/tree/main/sdks/go/qnsp/crypto) | `liboqs-go` 0.12.0 (local PQC primitives) |

Every subclient also exposes `Do(ctx, method, path, body, query, idempotencyKey)` so endpoints not yet typed can be called without dropping to raw `net/http`.

## Webhook verification

```go
event, err := qnsp.ParseWebhook(
    body,
    r.Header.Get("X-QNSP-Signature"),
    r.Header.Get("X-QNSP-Timestamp"),
    os.Getenv("QNSP_WEBHOOK_SECRET"),
    qnsp.MaxWebhookSkew,
    time.Time{},
)
```

`qnsp.MaxWebhookSkew` defaults to 5 minutes — pass your own `time.Duration` to tighten it.

## Error handling

All errors implement `qnsp.Error`. Use `errors.As` to pull out the structured fields:

```go
import "errors"

if _, err := c.Vault().GetSecret(ctx, "missing"); err != nil {
    var apiErr *qnsp.APIError
    if errors.As(err, &apiErr) {
        fmt.Println("HTTP", apiErr.StatusCode, apiErr.Code)
    }
}
```

## Activation + introspection

```go
tenantID, _ := c.TenantID(ctx)
tier, _     := c.Tier(ctx)
limits, _   := c.Limits(ctx)
sseOn, _    := c.HasFeature(ctx, "sseEnabled")
```

The activation handshake runs lazily on first service call. Call `c.EnsureActivated(ctx)` to surface API-key errors at startup instead.
