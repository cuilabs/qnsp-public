---
title: MCP Server (@qnsp/mcp-server)
version: 0.1.2
last_updated: 2026-04-23
copyright: © 2025-2026 CUI Labs. All rights reserved.
license: Apache-2.0
source_files:
  - /packages/mcp-server/package.json
  - /packages/mcp-server/src/index.ts
  - /packages/mcp-server/src/tools.ts
  - /apps/cloud/app/api/mcp/route.ts
---

# MCP Server (`@qnsp/mcp-server`)

QNSP ships an official Model Context Protocol server for AI assistants. It exposes tenant-scoped tools for KMS, vault, audit, crypto posture, search, billing, and platform health using the same billing-backed entitlement model as the rest of the platform.

The MCP server is not just a convenience wrapper. It is one of the supported consumption surfaces for moving agentic workflows onto QNSP during migration and steady-state operations.

## Package

- npm package: `@qnsp/mcp-server`
- binary: `qnsp-mcp`
- current version: `0.1.2`
- runtime: Node.js `>= 24.12.0`

## Supported deployment modes

### 1. Local stdio server

Use this when connecting a local MCP-compatible client such as Codex, Claude Desktop, Cursor, or other MCP-capable tooling.

```bash
pnpm add -g @qnsp/mcp-server

export QNSP_API_KEY="qnsp_pqc_api_..."
export QNSP_PLATFORM_URL="https://api.qnsp.cuilabs.io"

qnsp-mcp
```

Required environment variables:

- `QNSP_API_KEY`

Optional environment variables:

- `QNSP_PLATFORM_URL`
  Default: `https://api.qnsp.cuilabs.io`

### 2. Hosted Streamable HTTP endpoint

QNSP Cloud also exposes the MCP server over HTTP:

```text
https://cloud.qnsp.cuilabs.io/api/mcp
```

This is the right choice when your MCP client supports remote HTTP transports instead of local stdio.

## Tool surface

The MCP server currently registers **15 tenant-scoped tools**. All tools live under the `qnsp_` namespace prefix so they never collide with other MCP servers an agent may have enabled simultaneously.

| Tool | Area | Description | Minimum tier |
|---|---|---|---|
| `qnsp_kms_generate_key` | KMS | Generate a PQC keypair (ML-KEM, ML-DSA, SLH-DSA, Falcon) from the 93-algorithm catalog. | Dev |
| `qnsp_kms_list_keys` | KMS | List keys in the current tenant. | Dev |
| `qnsp_kms_get_key` | KMS | Retrieve a key's public metadata. | Dev |
| `qnsp_kms_rotate_key` | KMS | Rotate a key; previous version retained for verification. | Dev |
| `qnsp_vault_create_secret` | Vault | Store a secret under PQC envelope encryption. | Pro |
| `qnsp_vault_get_secret` | Vault | Retrieve a vault secret. | Pro |
| `qnsp_vault_list_secrets` | Vault | List secrets in the tenant. | Pro |
| `qnsp_crypto_scan` | Crypto posture | Trigger a cryptographic discovery job (CBOM). | Dev |
| `qnsp_crypto_inventory` | Crypto posture | List recent inventory jobs and results. | Dev |
| `qnsp_crypto_readiness` | Crypto posture | PQC-readiness scorecard for the tenant. | Dev |
| `qnsp_audit_query` | Audit | Query the immutable, hash-chained audit log. | Dev |
| `qnsp_search_query` | Search | Searchable symmetric-encryption (SSE-X) query. | Business |
| `qnsp_tenant_info` | Tenant | Show current tenant configuration. | Dev |
| `qnsp_billing_status` | Billing | Show tier, limits, and upgrade URL. | Any |
| `qnsp_platform_health` | Platform | Platform liveness and regional posture. | Any |

If the tenant's plan does not include the feature the tool needs, the call returns a structured "upgrade required" message with a deep link to `https://cloud.qnsp.cuilabs.io/billing` — the same billing gate that protects the portal and SDKs. The edge-gateway enforces entitlements server-side as well, so the client-side check is a UX optimization and not the security boundary.

## Where MCP fits in the customer journey

The migration journey is:

**Connect → Discover → Analyze → Govern → Migrate → Validate → Operate**

The MCP server primarily sits in **Migrate**, **Validate**, and **Operate**:

- agents can consume QNSP trust services directly through MCP tools
- migration workflows can inspect crypto posture and inventory from agent frameworks
- post-cutover operations can query audit, health, readiness, and governed trust services through one assistant-facing surface

The MCP server does not replace discovery connectors or host agents. It complements them by giving AI assistants a governed interface into the same tenant-scoped QNSP platform.

## Authentication and entitlements

The MCP server activates against QNSP using your API key before serving tool calls.

During activation it resolves:

- tenant identity
- billing tier
- entitlements
- effective limits

That means tool availability follows billing as the source of truth. For example, search tools remain tier-gated the same way they are in the portal and SDKs.

Recommended credentials:

- **Tenant API key** for assistant or workload automation
- **User PAT** for local human-operated testing and debugging

For shared or durable enterprise automation, prefer a service-account-backed or tenant-owned machine identity instead of a personal token.

## Example MCP client configuration

### Local stdio

```json
{
  "mcpServers": {
    "qnsp": {
      "command": "qnsp-mcp",
      "env": {
        "QNSP_API_KEY": "qnsp_pqc_api_...",
        "QNSP_PLATFORM_URL": "https://api.qnsp.cuilabs.io"
      }
    }
  }
}
```

### Hosted HTTP

Use the hosted endpoint if your client supports remote MCP transports:

```text
https://cloud.qnsp.cuilabs.io/api/mcp
```

Authentication is still tenant-scoped and must use a valid QNSP API key or session-backed MCP auth flow, depending on the client integration.

## Operational notes

- The MCP server sends canonical tenant headers to the platform.
- Tool behavior is aligned with the cloud-hosted `/api/mcp` route.
- Search and other premium capabilities remain billing-gated.
- The package uses the same API contract shape as the portal proxy endpoints.

## Validation

Build and test the MCP package locally:

```bash
pnpm --filter @qnsp/mcp-server build
pnpm --filter @qnsp/mcp-server test
```

## Related docs

- [SDK Overview](./overview)
- [Quickstart](/quickstart)
- [API Overview](/api/overview)
- [SDK Activation](./sdk-activation)
