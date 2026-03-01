---
title: Search SDK (@qnsp/search-sdk)
version: 0.1.0
last_updated: 2026-01-04
copyright: © 2025 CUI Labs. All rights reserved.
license: Apache-2.0
source_files:
  - /packages/search-sdk/src/client.ts
  - /packages/search-sdk/src/types.ts
---

# Search SDK (`@qnsp/search-sdk`)

TypeScript client for `search-service`. Search indexes are encrypted with tenant-specific PQC algorithms based on crypto policy.

## Install

```bash
pnpm install @qnsp/search-sdk
```

## Create a client

```ts
import { SearchClient } from "@qnsp/search-sdk";

const search = new SearchClient({
	baseUrl: "http://localhost:8101",
	apiToken: "<access_token>",
	sseKey: "<optional_sse_key>", // For searchable symmetric encryption
});
```

## Index Documents

```ts
// Index a single document
await search.indexDocument({
	tenantId: "<tenant_uuid>",
	documentId: "<doc_uuid>",
	sourceService: "storage-service",
	title: "Q4 Report",
	description: "Quarterly financial report",
	body: "Full document content...",
	tags: ["finance", "quarterly"],
	metadata: { department: "accounting" },
});

// Batch index multiple documents
await search.batchIndexDocuments([
	{ tenantId: "...", documentId: "...", /* ... */ },
	{ tenantId: "...", documentId: "...", /* ... */ },
]);

// Index with automatic SSE token derivation
await search.indexDocumentWithAutoSse({
	tenantId: "<tenant_uuid>",
	documentId: "<doc_uuid>",
	sourceService: "storage-service",
	title: "Confidential Report",
	body: "Encrypted searchable content...",
});
```

## Search Documents

```ts
// Basic search
const results = await search.search({
	tenantId: "<tenant_uuid>",
	query: "quarterly report",
	limit: 20,
});

// Search with automatic SSE
const results = await search.searchWithAutoSse({
	tenantId: "<tenant_uuid>",
	query: "confidential data",
	limit: 20,
	language: "en",
});

// Paginate results
let cursor = results.nextCursor;
while (cursor) {
	const page = await search.search({
		tenantId: "<tenant_uuid>",
		query: "quarterly report",
		cursor,
	});
	// Process page.items
	cursor = page.nextCursor;
}
```

## Searchable Symmetric Encryption (SSE)

When configured with an SSE key, the SDK can derive encrypted search tokens:

```ts
const search = new SearchClient({
	baseUrl: "http://localhost:8101",
	apiToken: "<token>",
	sseKey: "<32_byte_key>",
});

// Create SSE token for a value
const token = search.createSseToken("confidential");

// Derive tokens for document indexing
const docTokens = search.deriveDocumentSseTokens({
	tenantId: "<tenant_uuid>",
	documentId: "<doc_uuid>",
	sourceService: "storage-service",
	title: "Report",
	body: "Content...",
	tags: ["finance"],
	metadata: {},
});

// Derive tokens for query
const queryTokens = search.deriveQuerySseTokens("quarterly report");
```

## Key APIs

### Indexing
- `SearchClient.indexDocument(input)` - Index single document
- `SearchClient.batchIndexDocuments(documents)` - Batch index
- `SearchClient.indexDocumentWithAutoSse(document)` - Index with auto SSE

### Querying
- `SearchClient.search(params)` - Search with filters
- `SearchClient.searchWithAutoSse(params)` - Search with auto SSE

### SSE Utilities
- `SearchClient.createSseToken(value)` - Create encrypted token
- `SearchClient.deriveDocumentSseTokens(document)` - Derive index tokens
- `SearchClient.deriveQuerySseTokens(query)` - Derive query tokens
