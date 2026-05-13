---
title: "Quickstart"
description: "Get started with QNSP in under 10 minutes — create a tenant, obtain an API token, and make your first secure API call from TypeScript, Python, Go, or Rust."
version: 0.2.0
last_updated: 2026-04-30
copyright: © 2025-2026 CUI Labs. All rights reserved.
license: BSL-1.1
---
# Quickstart

Get from zero to a working QNSP integration in under 10 minutes.

## 1. Create an account

Sign up at [cloud.qnsp.cuilabs.io/auth](https://cloud.qnsp.cuilabs.io/auth).

Available paths today:
- One-click social sign-in with **GitHub**, **Google**, **Microsoft**, **GitLab**, or **Bitbucket**
- Email + password signup for a new workspace
- Enterprise SSO with **Microsoft Entra ID**, **Okta**, **Auth0**, **Google Workspace**, **AWS IAM Identity Center**, or a tenant-configured **SAML 2.0 / OIDC** provider

Your workspace (tenant) is provisioned automatically on first sign-in for self-serve signup flows. If you are joining an existing organization, use **Continue with your company SSO** or your existing tenant login flow instead of creating a second workspace.

## 2. Generate an API key

In the QNSP portal, go to **Settings → API Keys → New API Key**. Copy the key — it is shown once only.

Store it as an environment variable:

```bash
export QNSP_API_KEY="qnsp_live_..."
export QNSP_TENANT_ID="<your-tenant-uuid>"
```

## 3. Make your first API call

```bash
curl -sS \
  -H "Authorization: Bearer $QNSP_API_KEY" \
  -H "x-qnsp-tenant-id: $QNSP_TENANT_ID" \
  https://api.qnsp.cuilabs.io/vault/v1/secrets
```

A `200 OK` with an empty `data` array confirms authentication is working.

## 4. Install an SDK (optional)

Pick the SDK for your language. All four families share the same wire contracts, the same algorithm names, and the same FIPS 203 / 204 / 205 posture — outputs round-trip across languages byte-for-byte.

### TypeScript / Node.js

```bash
pnpm add @cuilabs/qnsp
pnpm add -g @qnsp/cli      # CLI for scripting / CI
```

```typescript
import { QnspClient } from "@cuilabs/qnsp";

const qnsp = new QnspClient({ apiKey: process.env.QNSP_API_KEY! });

const secret = await qnsp.vault.createSecret({
  name: "db-password",
  payloadB64: Buffer.from("s3cr3t").toString("base64"),
});
console.log(secret.id);
```

### Python

```bash
pip install qnsp
# Optional: local PQC primitives via liboqs-python
pip install 'qnsp[crypto]'
```

```python
import os, base64
from qnsp import QnspClient

with QnspClient(api_key=os.environ["QNSP_API_KEY"]) as q:
    secret = q.vault.create_secret(
        name="db-password",
        payload_b64=base64.b64encode(b"s3cr3t").decode(),
    )
    print(secret["id"])
```

### Go

```bash
go get github.com/cuilabs/qnsp-public/sdks/go/qnsp@latest
```

```go
import (
    "context"
    "encoding/base64"
    "os"

    "github.com/cuilabs/qnsp-public/sdks/go/qnsp"
    "github.com/cuilabs/qnsp-public/sdks/go/qnsp/vault"
)

c, _ := qnsp.NewClient(qnsp.ClientOptions{APIKey: os.Getenv("QNSP_API_KEY")})
defer c.Close()

secret, _ := c.Vault().CreateSecret(context.Background(), vault.CreateSecretRequest{
    Name:       "db-password",
    PayloadB64: base64.StdEncoding.EncodeToString([]byte("s3cr3t")),
}, "")
```

### Rust

```bash
cargo add qnsp
# Optional: local PQC primitives via the oqs 0.11 crate
cargo add qnsp --features crypto
```

```rust
use base64::{engine::general_purpose::STANDARD, Engine};
use qnsp::{Client, ClientOptions};
use qnsp::vault::CreateSecretRequest;

let c = Client::new(ClientOptions::with_api_key(std::env::var("QNSP_API_KEY")?))?;
let secret = c.vault().create_secret(CreateSecretRequest {
    name: "db-password".into(),
    payload_b64: STANDARD.encode(b"s3cr3t"),
    algorithm: None,
    metadata: None,
}, None).await?;
```

## Next Steps

- [API Reference](./api) — Full endpoint listing
- [SDK Overview](./sdk/overview) — All available SDKs across four languages
- [Supported Languages](./sdk/languages) — Feature matrix: TypeScript / Python / Go / Rust
- [MCP Server](./sdk/mcp-server) — Connect AI assistants to QNSP
- [Getting Started Guide](./getting-started/overview) — Deeper walkthrough including auth flows
- [cURL Quickstart](./getting-started/quickstart-curl) — Step-by-step API calls without an SDK
