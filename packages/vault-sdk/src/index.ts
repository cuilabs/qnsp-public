import { performance } from "node:perf_hooks";

import type {
	VaultClientTelemetry,
	VaultClientTelemetryConfig,
	VaultClientTelemetryEvent,
} from "./observability.js";
import { createVaultClientTelemetry, isVaultClientTelemetry } from "./observability.js";
import { checkTierAccess, type PricingTier, TierError } from "./tier.js";
import { validateUUID } from "./validation.js";

export { TierError };

/**
 * @qnsp/vault-sdk
 *
 * TypeScript SDK client for the QNSP vault-service API.
 * Provides a high-level interface for secret management with envelope encryption, versioning, and rotation.
 * All secrets are encrypted with tenant-specific PQC algorithms based on crypto policy.
 *
 * TIER REQUIREMENT: dev-pro or higher
 * Vault features are not available on free or dev-starter tiers.
 */

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

export interface VaultClientConfig {
	readonly baseUrl: string;
	readonly apiKey: string;
	readonly tier?: PricingTier;
	readonly timeoutMs?: number;
	readonly telemetry?: VaultClientTelemetry | VaultClientTelemetryConfig;
	readonly maxRetries?: number;
	readonly retryDelayMs?: number;
}

type InternalVaultClientConfig = {
	readonly baseUrl: string;
	readonly apiKey: string;
	readonly timeoutMs: number;
	readonly maxRetries: number;
	readonly retryDelayMs: number;
};

export interface RotationPolicy {
	readonly intervalSeconds: number;
	readonly expiresAt: number | null;
}

export interface RotationPolicyInput {
	readonly intervalSeconds?: number;
	readonly expiresAt?: number;
}

export interface SecretEnvelope {
	readonly encrypted: string;
	readonly algorithm: string;
	readonly keyId?: string;
}

export interface VaultSecretPqcMetadata {
	readonly provider: string;
	readonly algorithm: string;
	readonly algorithmNist?: string;
	readonly keyId: string;
}

export interface Secret {
	readonly id: string;
	readonly name: string;
	readonly tenantId: string;
	readonly version: number;
	readonly metadata: Record<string, unknown>;
	readonly rotationPolicy: RotationPolicy;
	readonly checksum: string;
	readonly createdAt: string;
	readonly updatedAt: string;
	readonly versionCreatedAt: string;
	readonly envelope: SecretEnvelope;
	readonly pqc?: VaultSecretPqcMetadata;
}

export interface CreateSecretRequest {
	readonly tenantId: string;
	readonly name: string;
	readonly payload: string; // Base64-encoded payload
	readonly metadata?: Record<string, unknown>;
	readonly rotationPolicy?: RotationPolicyInput;
}

export interface RotateSecretRequest {
	readonly tenantId: string;
	readonly newPayload?: string; // Base64-encoded payload
	readonly metadata?: Record<string, unknown>;
	readonly rotationPolicy?: RotationPolicyInput;
}

interface RequestOptions {
	readonly body?: unknown;
	readonly headers?: Record<string, string>;
	readonly signal?: AbortSignal;
	readonly operation?: string;
	readonly telemetryRoute?: string;
	readonly telemetryTarget?: string;
}

export class VaultClient {
	private readonly config: InternalVaultClientConfig;
	private readonly telemetry: VaultClientTelemetry | null;
	private readonly targetService: string;

	constructor(config: VaultClientConfig) {
		// Check tier access - vault requires dev-pro or higher
		if (config.tier) {
			checkTierAccess("vault", config.tier);
		}

		if (!config.apiKey || config.apiKey.trim().length === 0) {
			throw new Error(
				"QNSP Vault SDK: apiKey is required. " +
					"Get your free API key at https://cloud.qnsp.cuilabs.io/signup — " +
					"no credit card required (FREE tier: 5 GB storage, 2,000 API calls/month). " +
					"Docs: https://docs.qnsp.cuilabs.io/sdk/vault-sdk",
			);
		}

		const baseUrl = config.baseUrl.replace(/\/$/, "");

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

		this.config = {
			baseUrl,
			apiKey: config.apiKey,
			timeoutMs: config.timeoutMs ?? 30_000,
			maxRetries: config.maxRetries ?? 3,
			retryDelayMs: config.retryDelayMs ?? 1_000,
		};

		this.telemetry = config.telemetry
			? isVaultClientTelemetry(config.telemetry)
				? config.telemetry
				: createVaultClientTelemetry(config.telemetry)
			: null;

		try {
			this.targetService = new URL(this.config.baseUrl).host;
		} catch {
			this.targetService = "vault-service";
		}
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
		const route = options?.telemetryRoute ?? new URL(path, this.config.baseUrl).pathname;
		const target = options?.telemetryTarget ?? this.targetService;
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
					`Vault API error: Rate limit exceeded after ${this.config.maxRetries} retries`,
				);
			}

			if (!response.ok) {
				status = "error";
				// Sanitize error message to prevent information disclosure
				// Don't include full response text in error to avoid leaking sensitive data
				errorMessage = `HTTP ${response.status}`;
				throw new Error(`Vault API error: ${response.status} ${response.statusText}`);
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
			const durationMs = performance.now() - start;
			const event: VaultClientTelemetryEvent = {
				operation: options?.operation ?? `${method} ${route}`,
				method,
				route,
				target,
				status,
				durationMs,
				...(typeof httpStatus === "number" ? { httpStatus } : {}),
				...(status === "error" && errorMessage ? { error: errorMessage } : {}),
			};
			this.recordTelemetryEvent(event);
		}
	}

	private recordTelemetryEvent(event: VaultClientTelemetryEvent): void {
		if (!this.telemetry) {
			return;
		}
		this.telemetry.record(event);
	}

	/**
	 * Create a new secret.
	 * The payload must be base64-encoded.
	 * Returns the created secret with version 1.
	 */
	async createSecret(request: CreateSecretRequest): Promise<Secret> {
		validateUUID(request.tenantId, "tenantId");

		return this.request<Secret>("POST", "/vault/v1/secrets", {
			body: {
				tenantId: request.tenantId,
				name: request.name,
				payload: request.payload,
				...(request.metadata !== undefined ? { metadata: request.metadata } : {}),
				...(request.rotationPolicy !== undefined ? { rotationPolicy: request.rotationPolicy } : {}),
			},
			operation: "createSecret",
		});
	}

	/**
	 * Get the latest version of a secret.
	 * Returns the secret metadata, envelope, and version information.
	 * Note: The plaintext payload is not returned for security reasons.
	 */
	async getSecret(id: string, options?: { readonly leaseToken?: string }): Promise<Secret> {
		validateUUID(id, "id");

		const params = new URLSearchParams();
		if (options?.leaseToken) {
			params.set("leaseToken", options.leaseToken);
		}
		const queryString = params.toString();
		const path = queryString ? `/vault/v1/secrets/${id}?${queryString}` : `/vault/v1/secrets/${id}`;

		const headers: Record<string, string> = {};
		if (options?.leaseToken) {
			headers["x-lease-token"] = options.leaseToken;
		}

		return this.request<Secret>("GET", path, {
			headers,
			operation: "getSecret",
		});
	}

	/**
	 * Get a specific version of a secret.
	 * Returns the secret metadata, envelope, and version information for the specified version.
	 * Note: The plaintext payload is not returned for security reasons.
	 */
	async getSecretVersion(id: string, version: number): Promise<Secret> {
		validateUUID(id, "id");

		return this.request<Secret>("GET", `/vault/v1/secrets/${id}/versions/${version}`, {
			operation: "getSecretVersion",
		});
	}

	/**
	 * Rotate a secret to create a new version.
	 * Optionally provide a new payload (base64-encoded), updated metadata, or rotation policy.
	 * Returns the new secret version.
	 */
	async rotateSecret(id: string, request: RotateSecretRequest): Promise<Secret> {
		validateUUID(id, "id");
		validateUUID(request.tenantId, "tenantId");

		return this.request<Secret>("POST", `/vault/v1/secrets/${id}/rotate`, {
			body: {
				tenantId: request.tenantId,
				...(request.newPayload !== undefined ? { newPayload: request.newPayload } : {}),
				...(request.metadata !== undefined ? { metadata: request.metadata } : {}),
				...(request.rotationPolicy !== undefined ? { rotationPolicy: request.rotationPolicy } : {}),
			},
			operation: "rotateSecret",
		});
	}

	/**
	 * Delete a secret (soft delete).
	 * Requires the tenantId to verify ownership.
	 */
	async deleteSecret(id: string, tenantId: string): Promise<void> {
		validateUUID(id, "id");
		validateUUID(tenantId, "tenantId");

		return this.request<void>(
			"DELETE",
			`/vault/v1/secrets/${id}?tenantId=${encodeURIComponent(tenantId)}`,
			{
				operation: "deleteSecret",
			},
		);
	}
}

export * from "./observability.js";
export * from "./validation.js";
