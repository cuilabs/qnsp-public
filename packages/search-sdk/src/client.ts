import { performance } from "node:perf_hooks";

import { type RequestInit as UndiciRequestInit, fetch as undiciFetch } from "undici";

import type { SearchClientTelemetry, SearchClientTelemetryConfig } from "./observability.js";
import { createSearchClientTelemetry, isSearchClientTelemetry } from "./observability.js";
import { createSseToken, deriveDocumentSseTokens, deriveQuerySseTokens } from "./sse.js";
import type { IndexDocumentRequest, SearchQueryRequest, SearchQueryResponse } from "./types.js";
import { validateUUID } from "./validation.js";

export interface SearchClientOptions {
	readonly baseUrl: string;
	readonly apiToken: string;
	readonly timeoutMs?: number;
	readonly maxRetries?: number;
	readonly retryDelayMs?: number;
	readonly fetchImpl?: typeof undiciFetch;
	readonly sseKey?: Uint8Array | string;
	readonly telemetry?: SearchClientTelemetry | SearchClientTelemetryConfig;
}

export class SearchClient {
	private readonly baseUrl: string;
	private readonly apiToken: string;
	private readonly timeoutMs: number;
	private readonly maxRetries: number;
	private readonly retryDelayMs: number;
	private readonly fetchImpl: typeof undiciFetch;
	private readonly sseKey: Uint8Array | string | null;
	private readonly telemetry: SearchClientTelemetry | null;
	private readonly targetService: string;

	constructor(options: SearchClientOptions) {
		if (!options.apiToken || options.apiToken.trim().length === 0) {
			throw new Error(
				"QNSP Search SDK: apiToken is required. " +
					"Get your free API key at https://cloud.qnsp.cuilabs.io/signup — " +
					"no credit card required (FREE tier: 5 GB storage, 2,000 API calls/month). " +
					"Docs: https://docs.qnsp.cuilabs.io/sdk/search-sdk",
			);
		}
		const baseUrl = options.baseUrl.replace(/\/$/, "");

		// Enforce HTTPS in production (allow HTTP only for localhost in development)
		if (!baseUrl.startsWith("https://")) {
			const isLocalhost =
				baseUrl.startsWith("http://localhost") || baseUrl.startsWith("http://127.0.0.1");
			const isDevelopment =
				process.env["NODE_ENV"] === "development" || process.env["NODE_ENV"] === "test";
			if (!isLocalhost || !isDevelopment) {
				throw new Error(
					"baseUrl must use HTTPS in production. HTTP is only allowed for localhost in development.",
				);
			}
		}

		this.baseUrl = baseUrl;
		this.apiToken = options.apiToken;
		this.timeoutMs = options.timeoutMs ?? 15_000;
		this.maxRetries = options.maxRetries ?? 3;
		this.retryDelayMs = options.retryDelayMs ?? 1_000;
		this.fetchImpl = options.fetchImpl ?? undiciFetch;
		this.sseKey = options.sseKey ?? null;

		this.telemetry = options.telemetry
			? isSearchClientTelemetry(options.telemetry)
				? options.telemetry
				: createSearchClientTelemetry(options.telemetry)
			: null;

		try {
			this.targetService = new URL(this.baseUrl).host;
		} catch {
			this.targetService = "search-service";
		}
	}

	private async fetchWithRetry(
		url: string,
		init: UndiciRequestInit,
		attempt: number,
	): Promise<Response> {
		const response = await this.fetchImpl(url, init);

		if (response.status === 429) {
			if (attempt < this.maxRetries) {
				const retryAfterHeader = response.headers.get("Retry-After");
				let delayMs = this.retryDelayMs;

				if (retryAfterHeader) {
					const retryAfterSeconds = Number.parseInt(retryAfterHeader, 10);
					if (!Number.isNaN(retryAfterSeconds) && retryAfterSeconds > 0) {
						delayMs = retryAfterSeconds * 1_000;
					}
				} else {
					// Exponential backoff: 2^attempt * baseDelay, capped at 30 seconds
					delayMs = Math.min(2 ** attempt * this.retryDelayMs, 30_000);
				}

				await new Promise((resolve) => setTimeout(resolve, delayMs));
				return this.fetchWithRetry(url, init, attempt + 1);
			}

			throw new Error(`Search API error: Rate limit exceeded after ${this.maxRetries} retries`);
		}

		return response;
	}

	async indexDocument(input: IndexDocumentRequest): Promise<void> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), this.timeoutMs);
		const route = "/search/v1/documents/index";
		const method = "POST";
		const start = performance.now();
		let status: "ok" | "error" = "ok";
		let httpStatus: number | undefined;
		let errorMessage: string | undefined;

		try {
			const response = await this.fetchWithRetry(
				`${this.baseUrl}${route}`,
				{
					method,
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${this.apiToken}`,
					},
					body: JSON.stringify(input),
					signal: controller.signal,
				},
				0,
			);
			httpStatus = response.status;
			if (!response.ok) {
				status = "error";
				errorMessage = `HTTP ${response.status}`;
				throw new Error(`Search API error: ${response.status} ${response.statusText}`);
			}
		} catch (error) {
			status = "error";
			if (!errorMessage && error instanceof Error) {
				errorMessage = error.message;
			}
			throw error;
		} finally {
			clearTimeout(timer);
			if (this.telemetry) {
				this.telemetry.record({
					operation: "indexDocument",
					method,
					route,
					target: this.targetService,
					status,
					durationMs: performance.now() - start,
					...(typeof httpStatus === "number" ? { httpStatus } : {}),
					...(status === "error" && errorMessage ? { error: errorMessage } : {}),
				});
			}
		}
	}

	async search(params: SearchQueryRequest): Promise<SearchQueryResponse> {
		if (!params.query && (!params.sseTokens || params.sseTokens.length === 0)) {
			throw new Error("search query requires either plaintext query or SSE tokens");
		}
		validateUUID(params.tenantId, "tenantId");
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), this.timeoutMs);
		const route = "/search/v1/documents";
		const method = "GET";
		const start = performance.now();
		let status: "ok" | "error" = "ok";
		let httpStatus: number | undefined;
		let errorMessage: string | undefined;

		try {
			const query = new URLSearchParams();
			query.set("tenantId", params.tenantId);
			if (params.query && params.query.length > 0) {
				query.set("q", params.query);
			}
			if (params.limit) {
				query.set("limit", params.limit.toString());
			}
			if (params.cursor) {
				query.set("cursor", params.cursor);
			}
			if (params.language) {
				query.set("language", params.language);
			}
			for (const token of params.sseTokens ?? []) {
				query.append("sse", token);
			}

			const response = await this.fetchWithRetry(
				`${this.baseUrl}${route}?${query.toString()}`,
				{
					method,
					headers: { Authorization: `Bearer ${this.apiToken}` },
					signal: controller.signal,
				},
				0,
			);

			httpStatus = response.status;
			if (!response.ok) {
				status = "error";
				errorMessage = `HTTP ${response.status}`;
				throw new Error(`Search API error: ${response.status} ${response.statusText}`);
			}
			return (await response.json()) as SearchQueryResponse;
		} catch (error) {
			status = "error";
			if (!errorMessage && error instanceof Error) {
				errorMessage = error.message;
			}
			throw error;
		} finally {
			clearTimeout(timer);
			if (this.telemetry) {
				this.telemetry.record({
					operation: "search",
					method,
					route,
					target: this.targetService,
					status,
					durationMs: performance.now() - start,
					...(typeof httpStatus === "number" ? { httpStatus } : {}),
					...(status === "error" && errorMessage ? { error: errorMessage } : {}),
				});
			}
		}
	}

	createSseToken(value: string): string {
		if (!this.sseKey) {
			throw new Error("SearchClient was not configured with an SSE key");
		}
		return createSseToken(this.sseKey, value);
	}

	deriveDocumentSseTokens(
		document: Pick<
			IndexDocumentRequest,
			| "tenantId"
			| "documentId"
			| "sourceService"
			| "tags"
			| "metadata"
			| "body"
			| "title"
			| "description"
		>,
	): string[] {
		if (!this.sseKey) {
			throw new Error("SearchClient was not configured with an SSE key");
		}
		return deriveDocumentSseTokens(document, this.sseKey);
	}

	deriveQuerySseTokens(query: string): string[] {
		if (!this.sseKey) {
			throw new Error("SearchClient was not configured with an SSE key");
		}
		return deriveQuerySseTokens(query, this.sseKey);
	}

	/**
	 * Batch index multiple documents efficiently.
	 * This reduces network overhead by sending multiple documents in parallel.
	 */
	async batchIndexDocuments(documents: readonly IndexDocumentRequest[]): Promise<void> {
		await Promise.all(documents.map((doc) => this.indexDocument(doc)));
	}

	/**
	 * Search with automatic SSE token derivation if key is configured.
	 * Falls back to plaintext query if SSE key is not available.
	 */
	async searchWithAutoSse(
		params: Omit<SearchQueryRequest, "sseTokens"> & { query: string },
	): Promise<SearchQueryResponse> {
		const sseTokens = this.sseKey ? this.deriveQuerySseTokens(params.query) : undefined;
		const request: SearchQueryRequest = {
			...params,
			...(sseTokens !== undefined ? { sseTokens } : {}),
		};
		return this.search(request);
	}

	/**
	 * Index document with automatic SSE token derivation if key is configured.
	 */
	async indexDocumentWithAutoSse(document: Omit<IndexDocumentRequest, "sseTokens">): Promise<void> {
		const sseTokens = this.sseKey
			? deriveDocumentSseTokens(
					{
						tenantId: document.tenantId,
						documentId: document.documentId,
						sourceService: document.sourceService,
						tags: document.tags ?? [],
						metadata: document.metadata ?? {},
						title: document.title ?? null,
						description: document.description ?? null,
						body: document.body ?? null,
					},
					this.sseKey,
					{
						includeContent: true,
						includeBody: true,
					},
				)
			: undefined;

		const request: IndexDocumentRequest = {
			...document,
			...(sseTokens !== undefined ? { sseTokens } : {}),
		};
		return this.indexDocument(request);
	}
}
