/**
 * @qnsp/crypto-inventory-sdk
 *
 * TypeScript SDK client for the QNSP crypto-inventory-service API.
 * Provides cryptographic asset discovery and inventory management.
 * Tracks PQC and classical crypto assets across the platform.
 */

import { performance } from "node:perf_hooks";

import { z } from "zod";

import type { CryptoInventoryTelemetry, CryptoInventoryTelemetryConfig } from "./observability.js";
import { createCryptoInventoryTelemetry, isCryptoInventoryTelemetry } from "./observability.js";

/**
 * Mapping from internal algorithm names to NIST/standards display names.
 * Covers all 90 PQC algorithms supported by QNSP.
 * Canonical source: @qnsp/cryptography pqc-standards.ts ALGORITHM_NIST_NAMES
 */
export const ALGORITHM_TO_NIST: Record<string, string> = {
	// FIPS 203 — ML-KEM
	"kyber-512": "ML-KEM-512",
	"kyber-768": "ML-KEM-768",
	"kyber-1024": "ML-KEM-1024",
	// FIPS 204 — ML-DSA
	"dilithium-2": "ML-DSA-44",
	"dilithium-3": "ML-DSA-65",
	"dilithium-5": "ML-DSA-87",
	// FIPS 205 — SLH-DSA (SHA-2 variants)
	"sphincs-sha2-128f-simple": "SLH-DSA-SHA2-128f",
	"sphincs-sha2-128s-simple": "SLH-DSA-SHA2-128s",
	"sphincs-sha2-192f-simple": "SLH-DSA-SHA2-192f",
	"sphincs-sha2-192s-simple": "SLH-DSA-SHA2-192s",
	"sphincs-sha2-256f-simple": "SLH-DSA-SHA2-256f",
	"sphincs-sha2-256s-simple": "SLH-DSA-SHA2-256s",
	// FIPS 205 — SLH-DSA (SHAKE variants)
	"sphincs-shake-128f-simple": "SLH-DSA-SHAKE-128f",
	"sphincs-shake-128s-simple": "SLH-DSA-SHAKE-128s",
	"sphincs-shake-192f-simple": "SLH-DSA-SHAKE-192f",
	"sphincs-shake-192s-simple": "SLH-DSA-SHAKE-192s",
	"sphincs-shake-256f-simple": "SLH-DSA-SHAKE-256f",
	"sphincs-shake-256s-simple": "SLH-DSA-SHAKE-256s",
	// FN-DSA (FIPS 206 draft)
	"falcon-512": "FN-DSA-512",
	"falcon-1024": "FN-DSA-1024",
	// HQC (NIST selected March 2025)
	"hqc-128": "HQC-128",
	"hqc-192": "HQC-192",
	"hqc-256": "HQC-256",
	// BIKE (NIST Round 4)
	"bike-l1": "BIKE-L1",
	"bike-l3": "BIKE-L3",
	"bike-l5": "BIKE-L5",
	// Classic McEliece (ISO standard)
	"mceliece-348864": "Classic-McEliece-348864",
	"mceliece-460896": "Classic-McEliece-460896",
	"mceliece-6688128": "Classic-McEliece-6688128",
	"mceliece-6960119": "Classic-McEliece-6960119",
	"mceliece-8192128": "Classic-McEliece-8192128",
	// FrodoKEM (ISO standard)
	"frodokem-640-aes": "FrodoKEM-640-AES",
	"frodokem-640-shake": "FrodoKEM-640-SHAKE",
	"frodokem-976-aes": "FrodoKEM-976-AES",
	"frodokem-976-shake": "FrodoKEM-976-SHAKE",
	"frodokem-1344-aes": "FrodoKEM-1344-AES",
	"frodokem-1344-shake": "FrodoKEM-1344-SHAKE",
	// NTRU (lattice-based, re-added in liboqs 0.15)
	"ntru-hps-2048-509": "NTRU-HPS-2048-509",
	"ntru-hps-2048-677": "NTRU-HPS-2048-677",
	"ntru-hps-4096-821": "NTRU-HPS-4096-821",
	"ntru-hps-4096-1229": "NTRU-HPS-4096-1229",
	"ntru-hrss-701": "NTRU-HRSS-701",
	"ntru-hrss-1373": "NTRU-HRSS-1373",
	// NTRU-Prime
	sntrup761: "sntrup761",
	// MAYO (NIST Additional Signatures Round 2)
	"mayo-1": "MAYO-1",
	"mayo-2": "MAYO-2",
	"mayo-3": "MAYO-3",
	"mayo-5": "MAYO-5",
	// CROSS (NIST Additional Signatures Round 2)
	"cross-rsdp-128-balanced": "CROSS-RSDP-128-balanced",
	"cross-rsdp-128-fast": "CROSS-RSDP-128-fast",
	"cross-rsdp-128-small": "CROSS-RSDP-128-small",
	"cross-rsdp-192-balanced": "CROSS-RSDP-192-balanced",
	"cross-rsdp-192-fast": "CROSS-RSDP-192-fast",
	"cross-rsdp-192-small": "CROSS-RSDP-192-small",
	"cross-rsdp-256-balanced": "CROSS-RSDP-256-balanced",
	"cross-rsdp-256-fast": "CROSS-RSDP-256-fast",
	"cross-rsdp-256-small": "CROSS-RSDP-256-small",
	"cross-rsdpg-128-balanced": "CROSS-RSDPG-128-balanced",
	"cross-rsdpg-128-fast": "CROSS-RSDPG-128-fast",
	"cross-rsdpg-128-small": "CROSS-RSDPG-128-small",
	"cross-rsdpg-192-balanced": "CROSS-RSDPG-192-balanced",
	"cross-rsdpg-192-fast": "CROSS-RSDPG-192-fast",
	"cross-rsdpg-192-small": "CROSS-RSDPG-192-small",
	"cross-rsdpg-256-balanced": "CROSS-RSDPG-256-balanced",
	"cross-rsdpg-256-fast": "CROSS-RSDPG-256-fast",
	"cross-rsdpg-256-small": "CROSS-RSDPG-256-small",
	// UOV (NIST Additional Signatures Round 2)
	"ov-Is": "UOV-Is",
	"ov-Ip": "UOV-Ip",
	"ov-III": "UOV-III",
	"ov-V": "UOV-V",
	"ov-Is-pkc": "UOV-Is-pkc",
	"ov-Ip-pkc": "UOV-Ip-pkc",
	"ov-III-pkc": "UOV-III-pkc",
	"ov-V-pkc": "UOV-V-pkc",
	"ov-Is-pkc-skc": "UOV-Is-pkc-skc",
	"ov-Ip-pkc-skc": "UOV-Ip-pkc-skc",
	"ov-III-pkc-skc": "UOV-III-pkc-skc",
	"ov-V-pkc-skc": "UOV-V-pkc-skc",
	// SNOVA (NIST Additional Signatures Round 2, liboqs 0.14+)
	"snova-24-5-4": "SNOVA-24-5-4",
	"snova-24-5-4-shake": "SNOVA-24-5-4-SHAKE",
	"snova-24-5-4-esk": "SNOVA-24-5-4-ESK",
	"snova-24-5-4-shake-esk": "SNOVA-24-5-4-SHAKE-ESK",
	"snova-25-8-3": "SNOVA-25-8-3",
	"snova-37-17-2": "SNOVA-37-17-2",
	"snova-37-8-4": "SNOVA-37-8-4",
	"snova-24-5-5": "SNOVA-24-5-5",
	"snova-56-25-2": "SNOVA-56-25-2",
	"snova-49-11-3": "SNOVA-49-11-3",
	"snova-60-10-4": "SNOVA-60-10-4",
	"snova-29-6-5": "SNOVA-29-6-5",
};

/**
 * Convert internal algorithm name to NIST standardized name.
 */
export function toNistAlgorithmName(algorithm: string): string {
	return ALGORITHM_TO_NIST[algorithm] ?? algorithm;
}

export type AssetType = "certificate" | "key" | "secret";
export type AssetSource = "kms" | "vault" | "edge-gateway" | "external";

export type DiscoveryJobStatus = "queued" | "running" | "succeeded" | "failed";
export type DiscoveryJobTrigger = "manual" | "scheduled";

export interface CryptoAsset {
	readonly id: string;
	readonly tenantId: string;
	readonly assetType: AssetType;
	readonly source: AssetSource;
	readonly algorithm: string;
	readonly algorithmNist?: string;
	readonly isPqc: boolean;
	readonly keySize?: number;
	readonly expiresAt?: string | null;
	readonly rotationDue?: string | null;
	readonly metadata?: Record<string, unknown>;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface AssetStats {
	readonly totalAssets: number;
	readonly pqcAssets: number;
	readonly classicalAssets: number;
	readonly byType: Record<AssetType, number>;
	readonly bySource: Record<AssetSource, number>;
	readonly byAlgorithm: Record<string, number>;
	readonly expiringWithin30Days: number;
	readonly rotationOverdue: number;
}

export interface DiscoveryRun {
	readonly id: string;
	readonly tenantId: string;
	readonly source: AssetSource;
	readonly status: "running" | "completed" | "failed";
	readonly assetsDiscovered: number;
	readonly assetsUpdated: number;
	readonly startedAt: string;
	readonly completedAt: string | null;
	readonly errorMessage: string | null;
}

export interface DiscoveryJob {
	readonly id: string;
	readonly tenantId: string;
	readonly source: AssetSource;
	readonly runId: string;
	readonly triggeredBy: DiscoveryJobTrigger;
	readonly requestId: string | null;
	readonly status: DiscoveryJobStatus;
	readonly attempts: number;
	readonly lockedAt: string | null;
	readonly lockedBy: string | null;
	readonly errorMessage: string | null;
	readonly createdAt: string;
	readonly updatedAt: string;
	readonly completedAt: string | null;
}

const uuidSchema = z.string().uuid();
const discoveryJobStatusSchema = z.enum(["queued", "running", "succeeded", "failed"]);

export interface ListAssetsRequest {
	readonly tenantId: string;
	readonly assetType?: AssetType;
	readonly source?: AssetSource;
	readonly isPqc?: boolean;
	readonly algorithm?: string;
	readonly limit?: number;
	readonly offset?: number;
}

export interface ListAssetsResponse {
	readonly assets: readonly CryptoAsset[];
	readonly count: number;
}

export interface DiscoverAssetsRequest {
	readonly tenantId?: string;
	readonly source?: "kms" | "vault" | "edge-gateway";
}

export interface CryptoInventoryClientConfig {
	readonly baseUrl: string;
	readonly apiKey: string;
	readonly timeoutMs?: number;
	readonly maxRetries?: number;
	readonly retryDelayMs?: number;
	readonly telemetry?: CryptoInventoryTelemetry | CryptoInventoryTelemetryConfig;
}

type InternalConfig = {
	readonly baseUrl: string;
	readonly apiKey: string;
	readonly timeoutMs: number;
	readonly maxRetries: number;
	readonly retryDelayMs: number;
};

interface RequestOptions {
	readonly body?: unknown;
	readonly headers?: Record<string, string>;
	readonly signal?: AbortSignal;
	readonly operation?: string;
}

export class CryptoInventoryClient {
	private readonly config: InternalConfig;
	private readonly telemetry: CryptoInventoryTelemetry | null;
	private readonly targetService: string;

	constructor(config: CryptoInventoryClientConfig) {
		const baseUrl = config.baseUrl.replace(/\/$/, "");

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

		if (!config.apiKey || config.apiKey.trim().length === 0) {
			throw new Error(
				"QNSP Crypto Inventory SDK: apiKey is required. " +
					"Get your free API key at https://cloud.qnsp.cuilabs.io/signup — " +
					"no credit card required (FREE tier: 5 GB storage, 2,000 API calls/month). " +
					"Docs: https://docs.qnsp.cuilabs.io/sdk/crypto-inventory-sdk",
			);
		}

		this.config = {
			baseUrl,
			apiKey: config.apiKey,
			timeoutMs: config.timeoutMs ?? 30_000,
			maxRetries: config.maxRetries ?? 3,
			retryDelayMs: config.retryDelayMs ?? 1_000,
		};

		this.telemetry = config.telemetry
			? isCryptoInventoryTelemetry(config.telemetry)
				? config.telemetry
				: createCryptoInventoryTelemetry(config.telemetry)
			: null;

		try {
			this.targetService = new URL(this.config.baseUrl).host;
		} catch {
			this.targetService = "crypto-inventory-service";
		}
	}

	private withTenantHeader(tenantId?: string): Record<string, string> {
		if (!tenantId) return {};
		uuidSchema.parse(tenantId);
		return { "x-qnsp-tenant": tenantId };
	}

	private async request<T>(method: string, path: string, options?: RequestOptions): Promise<T> {
		return this.requestWithRetry<T>(method, path, options, 0);
	}

	private async requestWithRetry<T>(
		method: string,
		path: string,
		options: RequestOptions | undefined,
		attempt: number,
	): Promise<T> {
		const url = `${this.config.baseUrl}${path}`;
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			...options?.headers,
		};

		headers["Authorization"] = `Bearer ${this.config.apiKey}`;

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
		const signal = options?.signal ?? controller.signal;
		const route = path.replace(/\?.*$/, "");
		const start = performance.now();
		let status: "ok" | "error" = "ok";
		let httpStatus: number | undefined;
		let errorMessage: string | undefined;

		try {
			const init: RequestInit = {
				method,
				headers,
				signal,
			};

			if (options?.body !== undefined) {
				init.body = JSON.stringify(options.body);
			}

			const response = await fetch(url, init);

			clearTimeout(timeoutId);
			httpStatus = response.status;

			// Handle rate limiting (429) with retry logic
			if (response.status === 429) {
				if (attempt < this.config.maxRetries) {
					const retryAfterHeader = response.headers.get("Retry-After");
					let delayMs = this.config.retryDelayMs;

					if (retryAfterHeader) {
						const retryAfterSeconds = Number.parseInt(retryAfterHeader, 10);
						if (!Number.isNaN(retryAfterSeconds) && retryAfterSeconds > 0) {
							delayMs = retryAfterSeconds * 1_000;
						}
					} else {
						// Exponential backoff: 2^attempt * baseDelay, capped at 30 seconds
						delayMs = Math.min(2 ** attempt * this.config.retryDelayMs, 30_000);
					}

					await new Promise((resolve) => setTimeout(resolve, delayMs));
					return this.requestWithRetry<T>(method, path, options, attempt + 1);
				}

				status = "error";
				errorMessage = `HTTP ${response.status}`;
				throw new Error(
					`Crypto Inventory API error: Rate limit exceeded after ${this.config.maxRetries} retries`,
				);
			}

			if (!response.ok) {
				status = "error";
				errorMessage = `HTTP ${response.status}`;
				throw new Error(`Crypto Inventory API error: ${response.status} ${response.statusText}`);
			}

			if (response.status === 204) {
				return undefined as T;
			}

			return (await response.json()) as T;
		} catch (error) {
			clearTimeout(timeoutId);
			status = "error";
			if (!errorMessage && error instanceof Error) {
				errorMessage = error.message;
			}
			if (error instanceof Error && error.name === "AbortError") {
				errorMessage = `timeout after ${this.config.timeoutMs}ms`;
				throw new Error(`Request timeout after ${this.config.timeoutMs}ms`);
			}
			throw error;
		} finally {
			if (this.telemetry) {
				const durationMs = performance.now() - start;
				this.telemetry.record({
					operation: options?.operation ?? `${method} ${route}`,
					method,
					route,
					target: this.targetService,
					status,
					durationMs,
					...(typeof httpStatus === "number" ? { httpStatus } : {}),
					...(status === "error" && errorMessage ? { error: errorMessage } : {}),
				});
			}
		}
	}

	/**
	 * List cryptographic assets with optional filters.
	 */
	async listAssets(request: ListAssetsRequest): Promise<ListAssetsResponse> {
		uuidSchema.parse(request.tenantId);

		const params = new URLSearchParams({
			tenantId: request.tenantId,
		});

		if (request.assetType) params.set("assetType", request.assetType);
		if (request.source) params.set("source", request.source);
		if (request.isPqc !== undefined) params.set("isPqc", String(request.isPqc));
		if (request.algorithm) params.set("algorithm", request.algorithm);
		if (request.limit) params.set("limit", String(request.limit));
		if (request.offset) params.set("offset", String(request.offset));

		const result = await this.request<{ assets: CryptoAsset[]; count: number }>(
			"GET",
			`/crypto/v1/assets?${params}`,
			{ operation: "listAssets" },
		);

		// Enrich with NIST algorithm names
		return {
			...result,
			assets: result.assets.map((asset) => ({
				...asset,
				algorithmNist: toNistAlgorithmName(asset.algorithm),
			})),
		};
	}

	/**
	 * Get a specific asset by ID.
	 */
	async getAsset(assetId: string): Promise<CryptoAsset> {
		const result = await this.request<{ asset: CryptoAsset }>(
			"GET",
			`/crypto/v1/assets/${assetId}`,
			{ operation: "getAsset" },
		);

		return {
			...result.asset,
			algorithmNist: toNistAlgorithmName(result.asset.algorithm),
		};
	}

	/**
	 * Get asset statistics for a tenant.
	 */
	async getAssetStats(tenantId: string): Promise<AssetStats> {
		uuidSchema.parse(tenantId);
		const result = await this.request<{ stats: AssetStats }>(
			"GET",
			`/crypto/v1/assets/stats?tenantId=${tenantId}`,
			{ operation: "getAssetStats" },
		);

		return result.stats;
	}

	/**
	 * Trigger asset discovery across services.
	 */
	async discoverAssets(request?: DiscoverAssetsRequest): Promise<readonly DiscoveryRun[]> {
		if (request?.tenantId) {
			uuidSchema.parse(request.tenantId);
		}
		const result = await this.request<{ runs: DiscoveryRun[] }>(
			"POST",
			"/crypto/v1/assets/discover",
			{
				body: request ?? {},
				headers: this.withTenantHeader(request?.tenantId),
				operation: "discoverAssets",
			},
		);

		return result.runs;
	}

	/**
	 * List discovery jobs (async discovery orchestration).
	 */
	async listDiscoveryJobs(options: {
		readonly tenantId?: string;
		readonly status?: DiscoveryJobStatus;
		readonly limit?: number;
		readonly offset?: number;
	}): Promise<{ readonly jobs: readonly DiscoveryJob[]; readonly count: number }> {
		const params = new URLSearchParams();
		if (options.tenantId) {
			uuidSchema.parse(options.tenantId);
			params.set("tenantId", options.tenantId);
		}
		if (options.status) {
			discoveryJobStatusSchema.parse(options.status);
			params.set("status", options.status);
		}
		if (options.limit !== undefined) {
			params.set("limit", String(options.limit));
		}
		if (options.offset !== undefined) {
			params.set("offset", String(options.offset));
		}

		const queryString = params.toString();
		const path = queryString
			? `/crypto/v1/discovery/jobs?${queryString}`
			: "/crypto/v1/discovery/jobs";

		const result = await this.request<{ jobs: DiscoveryJob[]; count: number }>("GET", path, {
			operation: "listDiscoveryJobs",
			headers: this.withTenantHeader(options.tenantId),
		});

		return { jobs: result.jobs, count: result.count };
	}

	/**
	 * Get a discovery job by id.
	 */
	async getDiscoveryJob(options: {
		readonly jobId: string;
		readonly tenantId?: string;
	}): Promise<DiscoveryJob> {
		uuidSchema.parse(options.jobId);
		const params = new URLSearchParams();
		if (options.tenantId) {
			uuidSchema.parse(options.tenantId);
			params.set("tenantId", options.tenantId);
		}
		const queryString = params.toString();
		const path = queryString
			? `/crypto/v1/discovery/jobs/${options.jobId}?${queryString}`
			: `/crypto/v1/discovery/jobs/${options.jobId}`;
		const result = await this.request<{ job: DiscoveryJob }>("GET", path, {
			operation: "getDiscoveryJob",
			headers: this.withTenantHeader(options.tenantId),
		});
		return result.job;
	}

	/**
	 * Get discovery run history.
	 */
	async getDiscoveryRuns(tenantId?: string, limit?: number): Promise<readonly DiscoveryRun[]> {
		const params = new URLSearchParams();
		if (tenantId) {
			uuidSchema.parse(tenantId);
			params.set("tenantId", tenantId);
		}
		if (limit) params.set("limit", String(limit));

		const queryString = params.toString();
		const path = queryString
			? `/crypto/v1/discovery/runs?${queryString}`
			: "/crypto/v1/discovery/runs";

		const result = await this.request<{ runs: DiscoveryRun[] }>("GET", path, {
			operation: "getDiscoveryRuns",
			headers: this.withTenantHeader(tenantId),
		});

		return result.runs;
	}

	/**
	 * Delete an asset from the inventory.
	 */
	async deleteAsset(assetId: string): Promise<void> {
		await this.request<{ success: boolean }>("DELETE", `/crypto/v1/assets/${assetId}`, {
			operation: "deleteAsset",
		});
	}

	/**
	 * Get PQC migration status for a tenant.
	 * Returns the percentage of assets that are PQC-enabled.
	 */
	async getPqcMigrationStatus(tenantId: string): Promise<{
		readonly totalAssets: number;
		readonly pqcAssets: number;
		readonly classicalAssets: number;
		readonly pqcPercentage: number;
		readonly migrationComplete: boolean;
	}> {
		uuidSchema.parse(tenantId);
		const stats = await this.getAssetStats(tenantId);
		const pqcPercentage = stats.totalAssets > 0 ? (stats.pqcAssets / stats.totalAssets) * 100 : 0;

		return {
			totalAssets: stats.totalAssets,
			pqcAssets: stats.pqcAssets,
			classicalAssets: stats.classicalAssets,
			pqcPercentage: Math.round(pqcPercentage * 100) / 100,
			migrationComplete: stats.classicalAssets === 0 && stats.totalAssets > 0,
		};
	}
}

export * from "./observability.js";
