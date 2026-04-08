/**
 * @qnsp/llamaindex-qnsp
 *
 * LlamaIndex adapters for QNSP — PQC-encrypted vector store backed by QNSP search-service (SSE-X).
 *
 * @example
 * ```typescript
 * import { QnspVectorStore } from "@qnsp/llamaindex-qnsp";
 *
 * const store = new QnspVectorStore({
 *   apiKey: process.env.QNSP_API_KEY,
 *   tenantId: process.env.QNSP_TENANT_ID,
 * });
 * ```
 */

export type {
	QnspVectorStoreConfig,
	TextNode,
	VectorStoreQuery,
	VectorStoreQueryResult,
} from "./vector-store.js";
export { QnspVectorStore } from "./vector-store.js";
