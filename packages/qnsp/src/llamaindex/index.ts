/**
 * `@cuilabs/qnsp/llamaindex` — LlamaIndex adapters for QNSP.
 *
 * PQC-encrypted vector store backed by QNSP search-service (SSE-X). Folded in
 * from the former standalone `@cuilabs/qnsp-llamaindex-qnsp` (2026-05-16).
 *
 * @example
 * ```typescript
 * import { QnspVectorStore } from "@cuilabs/qnsp/llamaindex";
 *
 * const store = new QnspVectorStore({ apiKey: process.env.QNSP_API_KEY });
 * ```
 */

export type {
	QnspVectorStoreConfig,
	SearchSecurityEnvelope,
	TextNode,
	VectorStoreQuery,
	VectorStoreQueryResult,
} from "./vector-store.js";
export { QnspVectorStore } from "./vector-store.js";
