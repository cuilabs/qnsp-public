---
title: SDK Reference
description: Per-language SDKs (TypeScript, Python, Go, Rust, JVM/Android) and SDK-level guides covering authentication, retries, and error handling.
---

> **Note** — As of 2026-04-30, the per-service `@cuilabs/qnsp-auth-sdk` package is consolidated into the unified `@cuilabs/qnsp` SDK (one package per language). New integrations should use:
>
> ```typescript
> import { QnspClient } from "@cuilabs/qnsp";
> const qnsp = new QnspClient({ apiKey: process.env.QNSP_API_KEY! });
> await qnsp.auth./* method */(...);
> ```
>
> See [SDK overview](../sdk/) for the consolidated package. The per-service shapes documented below remain accurate at the wire level (REST/gRPC) and are kept for reference.


# SDK Reference

Per-language SDKs (TypeScript, Python, Go, Rust, JVM/Android) and SDK-level guides covering authentication, retries, and error handling.

## Pages

- [Access Control SDK (@cuilabs/qnsp-access-control-sdk)](./access-control-sdk)
- [AI SDK (@cuilabs/qnsp-ai-sdk)](./ai-sdk)
- [Audit SDK (@cuilabs/qnsp-audit-sdk)](./audit-sdk)
- [Auth SDK (@cuilabs/qnsp-auth-sdk)](./auth-sdk)
- [SDK Authentication](./authentication)
- [AutoGen Integration (@cuilabs/qnsp-autogen-qnsp)](./autogen-qnsp)
- [Billing SDK (@cuilabs/qnsp-billing-sdk)](./billing-sdk)
- [Browser SDK (@cuilabs/qnsp-browser)](./browser-sdk)
- [SDK Compatibility](./compatibility)
- [SDK Configuration](./configuration)
- [Crypto Attestation API](./crypto-attestation-api)
- [Crypto Inventory SDK (@cuilabs/qnsp-crypto-inventory-sdk)](./crypto-inventory-sdk)
- [SDK Error Handling](./error-handling)
- [KMS Client (@cuilabs/qnsp-kms-client)](./kms-client)
- [LangChain Integration (@cuilabs/qnsp-langchain-qnsp)](./langchain-qnsp)
- [Supported Languages](./languages)
- [LlamaIndex Integration (@cuilabs/qnsp-llamaindex-qnsp)](./llamaindex-qnsp)
- [MCP Server (@cuilabs/qnsp-mcp)](./mcp-server)
- [Memory Zeroization](./memory-zeroization)
- [SDK Overview](./overview)
- [Resilience Utilities (@cuilabs/qnsp-resilience)](./resilience)
- [SDK Retries](./retries)
- [SDK Activation](./sdk-activation)
- [Search SDK (@cuilabs/qnsp-search-sdk)](./search-sdk)
- [Storage SDK (@cuilabs/qnsp-storage-sdk)](./storage-sdk)
- [Tenant SDK (@cuilabs/qnsp-tenant-sdk)](./tenant-sdk)
- [Thread Safety](./thread-safety)
- [Vault SDK (@cuilabs/qnsp-vault-sdk)](./vault-sdk)

## Sections

- [Go](./go)
- [Java](./java)
- [Node](./node)
- [Python](./python)
- [Rust](./rust)

