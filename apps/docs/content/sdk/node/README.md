---
title: Node.js SDK
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# Node.js SDK

QNSP provides per-service TypeScript SDK packages for Node.js.

## Installation

```bash
pnpm install @qnsp/auth-sdk @qnsp/vault-sdk @qnsp/storage-sdk
```

For users who prefer npm or yarn, these are also supported:

```bash
npm install @qnsp/auth-sdk @qnsp/vault-sdk @qnsp/storage-sdk
# or
yarn add @qnsp/auth-sdk @qnsp/vault-sdk @qnsp/storage-sdk
```

## Requirements

- Node.js 24.12.0
- TypeScript 5.0+ (optional but recommended)

## Quick start

```typescript
import { AuthClient } from "@qnsp/auth-sdk";
import { VaultClient } from "@qnsp/vault-sdk";

const auth = new AuthClient({
	baseUrl: process.env["QNSP_AUTH_SERVICE_URL"] ?? "http://localhost:8081",
	apiKey: process.env["QNSP_API_KEY"] ?? "",
});

const token = await auth.login({
	email: "user@example.com",
	password: "<password>",
	tenantId: "<tenant_uuid>",
});

const vault = new VaultClient({
	baseUrl: process.env["QNSP_VAULT_SERVICE_URL"] ?? "http://localhost:8090",
	apiKey: token.accessToken,
});

const secret = await vault.createSecret({
	tenantId: "<tenant_uuid>",
	name: "example-secret",
	payload: "<base64_payload>",
});
```

## TypeScript support

Full TypeScript support with generated types:

```typescript
import type { TokenPair } from "@qnsp/auth-sdk";
```

## ESM and CommonJS

SDK packages are published as ESM.

```javascript
// ESM
import { AuthClient } from "@qnsp/auth-sdk";

// CommonJS (Node): use dynamic import
const { AuthClient } = await import("@qnsp/auth-sdk");
```
