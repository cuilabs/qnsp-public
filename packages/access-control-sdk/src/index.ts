import { performance } from "node:perf_hooks";

import type {
	AccessControlClientTelemetry,
	AccessControlClientTelemetryConfig,
	AccessControlClientTelemetryEvent,
} from "./observability.js";
import {
	createAccessControlClientTelemetry,
	isAccessControlClientTelemetry,
} from "./observability.js";
import { validateUUID } from "./validation.js";

/**
 * @qnsp/access-control-sdk
 *
 * TypeScript SDK client for the QNSP access-control-service API.
 * Provides a high-level interface for policy management and capability token operations.
 * All capability tokens are signed with tenant-specific PQC algorithms based on crypto policy.
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

export interface AccessControlClientConfig {
	readonly baseUrl: string;
	readonly apiKey: string;
	readonly timeoutMs?: number;
	readonly maxRetries?: number;
	readonly retryDelayMs?: number;
	readonly telemetry?: AccessControlClientTelemetry | AccessControlClientTelemetryConfig;
}

type InternalAccessControlClientConfig = {
	readonly baseUrl: string;
	readonly apiKey: string;
	readonly timeoutMs: number;
	readonly maxRetries: number;
	readonly retryDelayMs: number;
};

export interface PolicyStatement {
	readonly effect: "allow" | "deny";
	readonly actions: readonly string[];
	readonly resources: readonly string[];
	readonly conditions?: Record<string, unknown>;
}

export type PolicyCategory = "general" | "zero_trust";

export type PolicyEnforcementLevel = "enforced" | "template";

export interface CreatePolicyRequest {
	readonly tenantId: string;
	readonly name: string;
	readonly description?: string;
	readonly category?: PolicyCategory;
	readonly enforcementLevel?: PolicyEnforcementLevel;
	readonly version?: number;
	readonly statement: PolicyStatement;
}

export interface AccessPolicy {
	readonly id: string;
	readonly tenantId: string;
	readonly name: string;
	readonly description?: string | null;
	readonly category: PolicyCategory;
	readonly enforcementLevel: PolicyEnforcementLevel;
	readonly version: number;
	readonly statement: PolicyStatement;
	readonly statementHash: string;
	readonly signature: {
		readonly algorithm: string;
		readonly provider: string;
		readonly value: string;
		readonly publicKey: string;
	};
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface ListPoliciesResult {
	readonly items: readonly AccessPolicy[];
	readonly nextCursor: string | null;
}

export interface IssueCapabilityRequest {
	readonly tenantId: string;
	readonly policyId: string;
	readonly subject: {
		readonly type: string;
		readonly id: string;
	};
	readonly issuedBy: string;
	readonly ttlSeconds?: number;
	readonly security?: {
		readonly controlPlaneTokenSha256?: string | null;
		readonly pqcSignatures?: readonly {
			readonly provider: string;
			readonly algorithm: string;
		}[];
		readonly hardwareProvider?: string | null;
		readonly attestationStatus?: string | null;
		readonly attestationProof?: string | null;
	};
}

export interface IssueCapabilityResponse {
	readonly token: string;
	readonly payload: {
		readonly tokenId: string;
		readonly tenantId: string;
		readonly policyId: string;
		readonly policyVersion: number;
		readonly subject: {
			readonly type: string;
			readonly id: string;
		};
		readonly issuedAt: string;
		readonly expiresAt: string;
		readonly statementHash: string;
		readonly security: {
			readonly controlPlaneTokenSha256: string | null;
			readonly pqcSignatures: readonly {
				readonly provider: string;
				readonly algorithm: string;
			}[];
			readonly hardwareProvider: string | null;
			readonly attestationStatus: string | null;
			readonly attestationProof: string | null;
		};
		readonly signature: {
			readonly algorithm: string;
			readonly provider: string;
			readonly value: string;
			readonly publicKey: string;
		};
	};
}

export interface IntrospectCapabilityRequest {
	readonly token: string;
}

export interface IntrospectCapabilityResponse {
	readonly active: boolean;
	readonly payload?: {
		readonly tokenId: string;
		readonly tenantId: string;
		readonly policyId: string;
		readonly policyVersion: number;
		readonly subject: {
			readonly type: string;
			readonly id: string;
		};
		readonly issuedAt: string;
		readonly expiresAt: string;
		readonly statementHash: string;
		readonly security: {
			readonly controlPlaneTokenSha256: string | null;
			readonly pqcSignatures: readonly {
				readonly provider: string;
				readonly algorithm: string;
			}[];
			readonly hardwareProvider: string | null;
			readonly attestationStatus: string | null;
			readonly attestationProof: string | null;
		};
		readonly signature: {
			readonly algorithm: string;
			readonly provider: string;
			readonly value: string;
			readonly publicKey: string;
		};
	};
	readonly reason?: string;
}

export interface RevokeCapabilityRequest {
	readonly tokenId: string;
	readonly revokedBy: string;
	readonly reason?: string;
}

export interface RevokeCapabilityResponse {
	readonly tokenId: string;
	readonly revoked: boolean;
	readonly revokedAt: string;
	readonly revokedBy: string;
	readonly reason?: string | null;
}

interface RequestOptions {
	readonly body?: unknown;
	readonly headers?: Record<string, string>;
	readonly signal?: AbortSignal;
	readonly operation?: string;
	readonly telemetryRoute?: string;
	readonly telemetryTarget?: string;
}

export class AccessControlClient {
	private readonly config: InternalAccessControlClientConfig;
	private readonly telemetry: AccessControlClientTelemetry | null;
	private readonly targetService: string;

	private static isPrivateIpv4(hostname: string): boolean {
		const m = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
		if (!m) return false;
		const parts = m.slice(1).map((x) => Number(x));
		if (parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;
		const [a, b] = parts;
		if (a == null || b == null) return false;
		// RFC1918 ranges
		if (a === 10) return true;
		if (a === 172 && b >= 16 && b <= 31) return true;
		if (a === 192 && b === 168) return true;
		return false;
	}

	private static isInternalServiceHostname(hostname: string): boolean {
		const normalized = hostname.toLowerCase();
		if (normalized === "localhost" || normalized === "127.0.0.1") return true;
		if (normalized.endsWith(".internal")) return true;
		if (AccessControlClient.isPrivateIpv4(normalized)) return true;
		return false;
	}

	constructor(config: AccessControlClientConfig) {
		if (!config.apiKey || config.apiKey.trim().length === 0) {
			throw new Error(
				"QNSP Access Control SDK: apiKey is required. " +
					"Get your free API key at https://cloud.qnsp.cuilabs.io/signup — " +
					"no credit card required (FREE tier: 5 GB storage, 2,000 API calls/month). " +
					"Docs: https://docs.qnsp.cuilabs.io/sdk/access-control-sdk",
			);
		}

		const baseUrl = config.baseUrl.replace(/\/$/, "");

		// Enforce HTTPS in production (allow HTTP only for localhost in development)
		if (!baseUrl.startsWith("https://")) {
			const isLocalhost =
				baseUrl.startsWith("http://localhost") || baseUrl.startsWith("http://127.0.0.1");
			let isInternalService = false;
			try {
				const parsed = new URL(baseUrl);
				isInternalService =
					parsed.protocol === "http:" &&
					AccessControlClient.isInternalServiceHostname(parsed.hostname);
			} catch {
				// ignore; invalid URL will be handled later by fetch/URL parsing.
			}
			const isDevelopment =
				process.env["NODE_ENV"] === "development" || process.env["NODE_ENV"] === "test";
			if ((!isLocalhost || !isDevelopment) && !isInternalService) {
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
			? isAccessControlClientTelemetry(config.telemetry)
				? config.telemetry
				: createAccessControlClientTelemetry(config.telemetry)
			: null;

		try {
			this.targetService = new URL(this.config.baseUrl).host;
		} catch {
			this.targetService = "access-control-service";
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

			if (!response.ok) {
				status = "error";

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

					httpStatus = response.status;
					errorMessage = `HTTP ${response.status}`;
					throw new Error(
						`Access Control API error: Rate limit exceeded after ${this.config.maxRetries} retries`,
					);
				}

				const errorText = await response.text().catch(() => "Unknown error");
				errorMessage = errorText;
				throw new Error(`Access Control API error: ${response.status} ${response.statusText}`);
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
			const event: AccessControlClientTelemetryEvent = {
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

	private recordTelemetryEvent(event: AccessControlClientTelemetryEvent): void {
		if (!this.telemetry) {
			return;
		}
		this.telemetry.record(event);
	}

	/**
	 * Create a new access policy.
	 */
	async createPolicy(request: CreatePolicyRequest): Promise<AccessPolicy> {
		validateUUID(request.tenantId, "tenantId");

		return this.request<AccessPolicy>("POST", "/access/v1/policies", {
			body: {
				tenantId: request.tenantId,
				name: request.name,
				...(request.description !== undefined ? { description: request.description } : {}),
				...(request.category !== undefined ? { category: request.category } : {}),
				...(request.enforcementLevel !== undefined
					? { enforcementLevel: request.enforcementLevel }
					: {}),
				...(request.version !== undefined ? { version: request.version } : {}),
				statement: request.statement,
			},
			operation: "createPolicy",
		});
	}

	/**
	 * Get a policy by ID.
	 */
	async getPolicy(policyId: string): Promise<AccessPolicy> {
		validateUUID(policyId, "policyId");

		return this.request<AccessPolicy>("GET", `/access/v1/policies/${policyId}`, {
			operation: "getPolicy",
			telemetryRoute: "/access/v1/policies/:policyId",
		});
	}

	/**
	 * List policies for a tenant.
	 */
	async listPolicies(
		tenantId: string,
		options?: {
			readonly limit?: number;
			readonly cursor?: string;
		},
	): Promise<ListPoliciesResult> {
		validateUUID(tenantId, "tenantId");

		const params = new URLSearchParams();
		if (options?.limit !== undefined) {
			params.set("limit", String(options.limit));
		}
		if (options?.cursor !== undefined) {
			params.set("cursor", options.cursor);
		}

		return this.request<ListPoliciesResult>(
			"GET",
			`/access/v1/tenants/${tenantId}/policies?${params}`,
			{
				operation: "listPolicies",
				telemetryRoute: "/access/v1/tenants/:tenantId/policies",
			},
		);
	}

	/**
	 * Issue a capability token based on a policy.
	 */
	async issueCapability(request: IssueCapabilityRequest): Promise<IssueCapabilityResponse> {
		validateUUID(request.tenantId, "tenantId");
		validateUUID(request.policyId, "policyId");

		return this.request<IssueCapabilityResponse>("POST", "/access/v1/capabilities", {
			body: {
				tenantId: request.tenantId,
				policyId: request.policyId,
				subject: request.subject,
				issuedBy: request.issuedBy,
				...(request.ttlSeconds !== undefined ? { ttlSeconds: request.ttlSeconds } : {}),
				...(request.security !== undefined ? { security: request.security } : {}),
			},
			operation: "issueCapability",
		});
	}

	/**
	 * Introspect a capability token to check if it's active and get its payload.
	 */
	async introspectCapability(
		request: IntrospectCapabilityRequest,
	): Promise<IntrospectCapabilityResponse> {
		return this.request<IntrospectCapabilityResponse>(
			"POST",
			"/access/v1/capabilities/introspect",
			{
				body: {
					token: request.token,
				},
				operation: "introspectCapability",
			},
		);
	}

	/**
	 * Revoke a capability token.
	 */
	async revokeCapability(request: RevokeCapabilityRequest): Promise<RevokeCapabilityResponse> {
		validateUUID(request.tokenId, "tokenId");

		return this.request<RevokeCapabilityResponse>(
			"POST",
			`/access/v1/capabilities/${request.tokenId}/revoke`,
			{
				body: {
					revokedBy: request.revokedBy,
					...(request.reason !== undefined ? { reason: request.reason } : {}),
				},
				operation: "revokeCapability",
				telemetryRoute: "/access/v1/capabilities/:tokenId/revoke",
			},
		);
	}
}

export * from "./observability.js";
export * from "./validation.js";
