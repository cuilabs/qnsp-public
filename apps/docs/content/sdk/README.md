---
title: SDK Reference
description: Per-language SDKs (TypeScript, Python, Go, Rust, Java) and SDK-level guides covering authentication, retries, and error handling.
---

> **Note** — As of 2026-04-30, the per-service `@qnsp/auth-sdk` package is consolidated into the unified `@cuilabs/qnsp` SDK (one package per language). New integrations should use:
>
> ```typescript
> import { QnspClient } from "@cuilabs/qnsp";
> const qnsp = new QnspClient({ apiKey: process.env.QNSP_API_KEY! });
> await qnsp.auth./* method */(...);
> ```
>
> See [SDK overview](../sdk/) for the consolidated package. The per-service shapes documented below remain accurate at the wire level (REST/gRPC) and are kept for reference.


# SDK Reference

Per-language SDKs (TypeScript, Python, Go, Rust, Java) and SDK-level guides covering authentication, retries, and error handling.

## Pages

- [Access Control SDK (@qnsp/access-control-sdk)](./access-control-sdk)
- [AI SDK (@qnsp/ai-sdk)](./ai-sdk)
- [Audit SDK (@qnsp/audit-sdk)](./audit-sdk)
- [Auth SDK (@qnsp/auth-sdk)](./auth-sdk)
- [SDK Authentication](./authentication)
- [AutoGen Integration (@qnsp/autogen-qnsp)](./autogen-qnsp)
- [Billing SDK (@qnsp/billing-sdk)](./billing-sdk)
- [Browser SDK (@qnsp/browser-sdk)](./browser-sdk)
- [SDK Compatibility](./compatibility)
- [SDK Configuration](./configuration)
- [Crypto Attestation API](./crypto-attestation-api)
- [Crypto Inventory SDK (@qnsp/crypto-inventory-sdk)](./crypto-inventory-sdk)
- [SDK Error Handling](./error-handling)
- [KMS Client (@qnsp/kms-client)](./kms-client)
- [LangChain Integration (@qnsp/langchain-qnsp)](./langchain-qnsp)
- [Supported Languages](./languages)
- [LlamaIndex Integration (@qnsp/llamaindex-qnsp)](./llamaindex-qnsp)
- [MCP Server (@qnsp/mcp-server)](./mcp-server)
- [Memory Zeroization](./memory-zeroization)
- [SDK Overview](./overview)
- [Resilience Utilities (@qnsp/resilience)](./resilience)
- [SDK Retries](./retries)
- [SDK Activation](./sdk-activation)
- [Search SDK (@qnsp/search-sdk)](./search-sdk)
- [Storage SDK (@qnsp/storage-sdk)](./storage-sdk)
- [Tenant SDK (@qnsp/tenant-sdk)](./tenant-sdk)
- [Thread Safety](./thread-safety)
- [Vault SDK (@qnsp/vault-sdk)](./vault-sdk)

## Sections

- [Go](./go)
- [Java](./java)
- [Node](./node)
- [Python](./python)
- [Rust](./rust)

