/**
 * Advanced SSE Index Optimization
 *
 * Provides optimization utilities for SSE-encrypted search indices including:
 * - Token frequency analysis
 * - Index compression strategies
 * - Batch token generation
 * - Query optimization helpers
 */

import { createSseToken, type DeriveSseOptions, deriveDocumentSseTokens } from "./sse.js";
import type { IndexDocumentRequest } from "./types.js";

export interface TokenFrequencyAnalysis {
	readonly token: string;
	readonly frequency: number;
	readonly documents: number;
}

export interface IndexOptimizationOptions {
	readonly maxTokensPerDocument?: number;
	readonly minTokenFrequency?: number;
	readonly enableCompression?: boolean;
	readonly batchSize?: number;
}

export interface BatchIndexRequest {
	readonly documents: readonly Pick<
		IndexDocumentRequest,
		| "tenantId"
		| "documentId"
		| "sourceService"
		| "tags"
		| "metadata"
		| "body"
		| "title"
		| "description"
	>[];
	readonly options?: DeriveSseOptions;
}

/**
 * Analyze token frequency across a set of documents.
 * Useful for identifying common tokens that can be optimized.
 */
export function analyzeTokenFrequency(
	tokens: readonly string[],
): Map<string, TokenFrequencyAnalysis> {
	const frequency = new Map<string, number>();

	for (const token of tokens) {
		const existing = frequency.get(token);
		if (existing) {
			frequency.set(token, existing + 1);
		} else {
			frequency.set(token, 1);
		}
	}

	const result = new Map<string, TokenFrequencyAnalysis>();
	for (const [token, count] of frequency.entries()) {
		result.set(token, {
			token,
			frequency: count,
			documents: count, // In this context, frequency represents document count
		});
	}

	return result;
}

/**
 * Optimize SSE tokens by removing low-frequency tokens and compressing common patterns.
 */
export function optimizeSseTokens(
	tokens: readonly string[],
	options: IndexOptimizationOptions = {},
): string[] {
	const maxTokens = options.maxTokensPerDocument ?? 128;
	const minFrequency = options.minTokenFrequency ?? 1;

	if (tokens.length <= maxTokens) {
		return [...tokens];
	}

	// Analyze frequency
	const frequency = analyzeTokenFrequency(tokens);

	// Filter by minimum frequency and sort by frequency (descending)
	const filtered = Array.from(frequency.entries())
		.filter(([, analysis]) => analysis.frequency >= minFrequency)
		.sort((a, b) => b[1].frequency - a[1].frequency)
		.slice(0, maxTokens)
		.map(([token]) => token);

	return filtered;
}

/**
 * Batch derive SSE tokens for multiple documents efficiently.
 * This reduces redundant tokenization operations.
 */
export function batchDeriveDocumentSseTokens(
	batch: BatchIndexRequest,
	key: Uint8Array | string,
): Map<string, string[]> {
	const result = new Map<string, string[]>();

	for (const document of batch.documents) {
		const documentId = document.documentId;
		const tokens = deriveDocumentSseTokens(document, key, batch.options);
		result.set(documentId, tokens);
	}

	return result;
}

/**
 * Create optimized SSE tokens with compression and frequency filtering.
 */
export function createOptimizedSseTokens(
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
	key: Uint8Array | string,
	options: DeriveSseOptions & IndexOptimizationOptions = {},
): string[] {
	const tokens = deriveDocumentSseTokens(document, key, options);
	return optimizeSseTokens(tokens, options);
}

/**
 * Pre-compute common SSE tokens for a tenant to improve query performance.
 * These tokens can be cached and reused across queries.
 */
export function precomputeCommonTokens(
	_key: Uint8Array | string,
	commonTerms: readonly string[],
): string[] {
	return commonTerms.map((term) => createSseToken(_key, `kw:${term.toLowerCase()}`));
}

/**
 * Create a token cache for frequently used tokens.
 * This reduces redundant HMAC operations.
 */
export class SseTokenCache {
	private readonly cache = new Map<string, string>();
	private readonly key: Uint8Array | string;
	private readonly maxSize: number;

	constructor(key: Uint8Array | string, maxSize = 1000) {
		this.key = key;
		this.maxSize = maxSize;
	}

	get(value: string): string {
		const cached = this.cache.get(value);
		if (cached) {
			return cached;
		}

		const token = createSseToken(this.key, value);

		// Evict oldest entries if cache is full
		if (this.cache.size >= this.maxSize) {
			const firstKey = this.cache.keys().next().value;
			if (firstKey) {
				this.cache.delete(firstKey);
			}
		}

		this.cache.set(value, token);
		return token;
	}

	clear(): void {
		this.cache.clear();
	}

	get size(): number {
		return this.cache.size;
	}
}
