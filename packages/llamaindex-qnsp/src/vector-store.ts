/**
 * QNSP Vector Store for LlamaIndex
 *
 * Provides PQC-encrypted semantic search backed by QNSP search-service (SSE-X).
 * Compatible with LlamaIndex's VectorStore interface without importing from llamaindex
 * directly — works as a standalone adapter or with the full LlamaIndex framework.
 */

import { SearchClient } from "@qnsp/search-sdk";
import { z } from "zod";

// ─── Activation types (inline to avoid direct @qnsp/sdk-activation dep) ──────

const ACTIVATION_PATH = "/billing/v1/sdk/activate";

interface ActivationResponse {
	readonly tenantId: string;
}

async function resolveActivationTenantId(apiKey: string, baseUrl: string): Promise<string> {
	const url = `${baseUrl.replace(/\/$/, "")}${ACTIVATION_PATH}`;
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			sdkId: "llamaindex-qnsp",
			sdkVersion: "0.1.0",
			runtime: "node",
		}),
		signal: AbortSignal.timeout(15_000),
	});
	if (!response.ok) {
		throw new Error(
			`QNSP LlamaIndex: SDK activation failed (HTTP ${response.status}). Ensure your API key is valid.`,
		);
	}
	const data = (await response.json()) as ActivationResponse;
	return data.tenantId;
}

// ─── LlamaIndex-compatible types (standalone, no llamaindex import required) ──

export interface TextNode {
	readonly id_: string;
	readonly text: string;
	readonly metadata?: Record<string, unknown>;
	readonly embedding?: readonly number[];
}

export interface VectorStoreQuery {
	readonly queryStr?: string;
	readonly queryEmbedding?: readonly number[];
	readonly similarityTopK?: number;
}

export interface VectorStoreQueryResult {
	readonly nodes: TextNode[];
	readonly similarities: number[];
	readonly ids: string[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

export interface QnspVectorStoreConfig {
	/**
	 * QNSP API key. Get one at https://cloud.qnsp.cuilabs.io/api-keys
	 * The API key carries the tenant ID internally — no separate tenantId needed.
	 */
	readonly apiKey: string;
	/**
	 * Tenant ID for all search operations.
	 * Optional — when omitted, the tenant is resolved automatically from the API key
	 * via SDK activation. Only provide this if you need to override the resolved tenant.
	 */
	readonly tenantId?: string;
	/**
	 * Source service label used when indexing documents.
	 * Defaults to "llamaindex-qnsp".
	 */
	readonly sourceService?: string;
	/**
	 * Base URL for the QNSP API.
	 * Defaults to https://api.qnsp.cuilabs.io
	 */
	readonly baseUrl?: string;
	/**
	 * Request timeout in milliseconds.
	 * Defaults to 15000 (15 seconds).
	 */
	readonly timeoutMs?: number;
	/**
	 * Optional SSE key for encrypted search tokens.
	 * When provided, all index and query operations use SSE-X encrypted tokens.
	 */
	readonly sseKey?: Uint8Array | string;
}

// ─── Zod schema for validating search hits ────────────────────────────────────

const searchHitSchema = z.object({
	documentId: z.string(),
	title: z.string().nullable(),
	description: z.string().nullable(),
	metadata: z.record(z.string(), z.unknown()),
	score: z.number(),
});

// ─── Null PQC envelope helpers ────────────────────────────────────────────────
// The edge gateway fills in PQC signatures for API key callers server-side.
// These fields are required by IndexDocumentRequest but populated by the service.

const NULL_SECURITY_ENVELOPE = {
	controlPlaneTokenSha256: null,
	pqcSignatures: [],
	hardwareProvider: null,
	attestationStatus: null,
	attestationProof: null,
} as const;

const NULL_SIGNATURE = {
	provider: "none",
	algorithm: "none",
	value: "",
	publicKey: "",
} as const;

// ─── QnspVectorStore ──────────────────────────────────────────────────────────

/**
 * LlamaIndex-compatible vector store backed by QNSP encrypted search (SSE-X).
 *
 * Nodes are stored as indexed documents in QNSP search-service.
 * The node text is stored in the document body; metadata is preserved.
 * Queries use QNSP's semantic search with optional SSE-X token encryption.
 *
 * @example
 * ```typescript
 * import { QnspVectorStore } from "@qnsp/llamaindex-qnsp";
 *
 * const store = new QnspVectorStore({
 *   apiKey: process.env.QNSP_API_KEY,
 *   tenantId: process.env.QNSP_TENANT_ID,
 * });
 *
 * // Add nodes
 * await store.add([{ id_: "doc-1", text: "Quantum-safe encryption overview", metadata: {} }]);
 *
 * // Query
 * const result = await store.query({ queryStr: "post-quantum cryptography" });
 * ```
 */
export class QnspVectorStore {
	readonly #client: SearchClient;
	readonly #sourceService: string;
	readonly #apiKey: string;
	readonly #baseUrl: string;
	#resolvedTenantId: string | null;
	#activationPromise: Promise<void> | null = null;

	constructor(config: QnspVectorStoreConfig) {
		this.#resolvedTenantId = config.tenantId ?? null;
		this.#sourceService = config.sourceService ?? "llamaindex-qnsp";
		this.#apiKey = config.apiKey;
		this.#baseUrl = config.baseUrl ?? "https://api.qnsp.cuilabs.io";
		this.#client = new SearchClient({
			apiKey: config.apiKey,
			baseUrl: this.#baseUrl,
			...(config.timeoutMs !== undefined ? { timeoutMs: config.timeoutMs } : {}),
			...(config.sseKey !== undefined ? { sseKey: config.sseKey } : {}),
		});
	}

	/**
	 * Resolve the effective tenant ID — either from config or via SDK activation.
	 * Caches the result after the first call.
	 */
	async #ensureTenantId(): Promise<string> {
		if (this.#resolvedTenantId) {
			return this.#resolvedTenantId;
		}
		if (!this.#activationPromise) {
			this.#activationPromise = resolveActivationTenantId(this.#apiKey, this.#baseUrl).then(
				(tenantId) => {
					this.#resolvedTenantId = tenantId;
				},
			);
		}
		await this.#activationPromise;
		if (!this.#resolvedTenantId) {
			throw new Error(
				"QNSP LlamaIndex: tenantId could not be resolved. Ensure your API key is valid.",
			);
		}
		return this.#resolvedTenantId;
	}

	/**
	 * Add nodes to the QNSP encrypted search index.
	 * Each node is indexed as a document with its text as the body and metadata preserved.
	 * Returns the list of node IDs that were indexed.
	 */
	async add(nodes: TextNode[]): Promise<string[]> {
		if (nodes.length === 0) {
			return [];
		}

		const tenantId = await this.#ensureTenantId();

		await Promise.all(
			nodes.map((node) =>
				this.#client.indexDocumentWithAutoSse({
					tenantId,
					documentId: node.id_,
					version: "1",
					sourceService: this.#sourceService,
					title: node.id_,
					description: null,
					body: node.text,
					tags: [],
					metadata: node.metadata ?? {},
					security: NULL_SECURITY_ENVELOPE,
					signature: NULL_SIGNATURE,
				}),
			),
		);

		return nodes.map((n) => n.id_);
	}

	/**
	 * Query the QNSP encrypted search index.
	 * Uses SSE-X token derivation when an SSE key is configured.
	 */
	async query(query: VectorStoreQuery): Promise<VectorStoreQueryResult> {
		const queryStr = query.queryStr ?? "";
		if (!queryStr) {
			return { nodes: [], similarities: [], ids: [] };
		}

		const tenantId = await this.#ensureTenantId();
		const limit = query.similarityTopK ?? 10;

		const response = await this.#client.searchWithAutoSse({
			tenantId,
			query: queryStr,
			limit,
		});

		const nodes: TextNode[] = [];
		const similarities: number[] = [];
		const ids: string[] = [];

		for (const hit of response.items) {
			const parsed = searchHitSchema.safeParse(hit);
			if (!parsed.success) {
				continue;
			}
			const { documentId, title, metadata, score } = parsed.data;
			nodes.push({
				id_: documentId,
				text: title ?? documentId,
				metadata,
			});
			similarities.push(score);
			ids.push(documentId);
		}

		return { nodes, similarities, ids };
	}

	/**
	 * Remove a node from the search index by document ID.
	 *
	 * Note: QNSP search-service does not expose a delete-document endpoint in the
	 * current SDK. This method re-indexes the document with empty content and a
	 * "__deleted__" tag so it no longer matches queries, effectively tombstoning it.
	 * A future SDK version will expose a hard-delete endpoint.
	 */
	async delete(nodeId: string): Promise<void> {
		const tenantId = await this.#ensureTenantId();

		await this.#client.indexDocumentWithAutoSse({
			tenantId,
			documentId: nodeId,
			version: "deleted",
			sourceService: this.#sourceService,
			title: null,
			description: null,
			body: null,
			tags: ["__deleted__"],
			metadata: { deleted: true, deletedAt: new Date().toISOString() },
			security: NULL_SECURITY_ENVELOPE,
			signature: NULL_SIGNATURE,
		});
	}
}
