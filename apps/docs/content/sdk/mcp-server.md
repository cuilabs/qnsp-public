---
title: MCP Server (@qnsp/mcp-server)
version: 0.1.0
last_updated: 2026-04-11
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

## Package

- npm package: `@qnsp/mcp-server`
- binary: `qnsp-mcp`
- current version: `0.1.0`
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

The MCP server currently registers tenant-scoped tools across:

- KMS: generate, list, inspect, and rotate PQC keys
- Vault: create, list, and retrieve secrets
- Crypto posture: run scans, inspect inventory, and review readiness
- Audit: query immutable audit records
- Search: run encrypted search queries when the tenant tier permits it
- Tenant and billing: inspect tenant info, billing status, and limits
- Platform operations: check platform health

## Authentication and entitlements

The MCP server activates against QNSP using your API key before serving tool calls.

During activation it resolves:

- tenant identity
- billing tier
- entitlements
- effective limits

That means tool availability follows billing as the source of truth. For example, search tools remain tier-gated the same way they are in the portal and SDKs.

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
