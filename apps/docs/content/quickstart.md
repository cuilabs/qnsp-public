---
title: "Quickstart"
description: "Get started with QNSP in under 10 minutes — create a tenant, obtain an API token, and make your first secure API call."
version: 0.0.2
last_updated: 2026-04-13
copyright: © 2025 CUI Labs. All rights reserved.
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

Pick the SDK for your language:

```bash
# Node.js / TypeScript
npm install @qnsp/vault-sdk @qnsp/auth-sdk

# CLI (for scripting and CI)
npm install -g @qnsp/cli
```

```typescript
import { VaultClient } from "@qnsp/vault-sdk";

const vault = new VaultClient({
  apiKey: process.env.QNSP_API_KEY!,
  tenantId: process.env.QNSP_TENANT_ID!,
});

const secret = await vault.createSecret({ name: "db-password", value: "s3cr3t" });
console.log(secret.id);
```

## Next Steps

- [API Reference](./api) — Full endpoint listing
- [SDK Overview](./sdk/overview) — All available SDKs
- [MCP Server](./sdk/mcp-server) — Connect AI assistants to QNSP
- [Getting Started Guide](./getting-started/overview) — Deeper walkthrough including auth flows
- [cURL Quickstart](./getting-started/quickstart-curl) — Step-by-step API calls without an SDK
