import { performance } from "node:perf_hooks";

import type {
	AuthClientTelemetry,
	AuthClientTelemetryConfig,
	AuthClientTelemetryEvent,
} from "./observability.js";
import { createAuthClientTelemetry, isAuthClientTelemetry } from "./observability.js";
import { validateEmail, validateUUID } from "./validation.js";

/**
 * @qnsp/auth-sdk
 *
 * TypeScript SDK client for the QNSP auth-service API.
 * Provides a high-level interface for authentication, token management, WebAuthn, MFA, and federation.
 * All tokens are signed with tenant-specific PQC algorithms based on crypto policy.
 */

/**
 * PQC metadata for cryptographic operations.
 */
export interface PqcSignatureMetadata {
	readonly provider: string;
	readonly algorithm: string;
	readonly algorithmNist?: string;
}

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

export interface AuthClientConfig {
	readonly baseUrl: string;
	readonly apiKey: string;
	readonly timeoutMs?: number;
	readonly telemetry?: AuthClientTelemetry | AuthClientTelemetryConfig;
	readonly maxRetries?: number;
	readonly retryDelayMs?: number;
}

type InternalAuthClientConfig = {
	readonly baseUrl: string;
	readonly apiKey: string;
	readonly timeoutMs: number;
	readonly maxRetries: number;
	readonly retryDelayMs: number;
};

export interface TokenPair {
	readonly accessToken: string;
	readonly refreshToken: {
		readonly token: string;
		readonly metadata: {
			readonly tokenId: string;
			readonly subjectId: string;
			readonly tenantId: string;
			readonly roles: readonly string[];
			readonly audience: string;
			readonly expiresAt: string;
			readonly createdAt: string;
		};
	} | null;
}

export interface LoginRequest {
	readonly email: string;
	readonly password: string;
	readonly tenantId: string;
	readonly totp?: string;
	readonly audience?: string;
}

export interface RefreshTokenRequest {
	readonly refreshToken: string;
	readonly audience?: string;
}

export interface WebAuthnRegistrationStartRequest {
	readonly userId: string;
	readonly tenantId: string;
}

export interface WebAuthnRegistrationStartResponse {
	readonly options: {
		readonly challenge: string;
		readonly rp: {
			readonly id: string;
			readonly name: string;
		};
		readonly user: {
			readonly id: string;
			readonly name: string;
			readonly displayName: string;
		};
		readonly pubKeyCredParams: readonly {
			readonly type: string;
			readonly alg: number;
		}[];
		readonly timeout?: number;
		readonly attestation?: string;
		readonly excludeCredentials?: readonly {
			readonly id: string;
			readonly type: string;
		}[];
	};
	readonly challengeId: string;
}

export interface WebAuthnRegistrationCompleteRequest {
	readonly userId: string;
	readonly tenantId: string;
	readonly challengeId: string;
	readonly response: unknown; // PublicKeyCredential from WebAuthn API
}

export interface WebAuthnRegistrationCompleteResponse {
	readonly credential: {
		readonly id: string;
		readonly credentialId: string;
		readonly deviceType: string;
		readonly deviceName: string;
		readonly createdAt: string;
	};
}

export interface WebAuthnAuthenticationStartRequest {
	readonly userId?: string;
	readonly email?: string;
	readonly tenantId: string;
}

export interface WebAuthnAuthenticationStartResponse {
	readonly options: {
		readonly challenge: string;
		readonly rpId: string;
		readonly timeout?: number;
		readonly allowCredentials?: readonly {
			readonly id: string;
			readonly type: string;
		}[];
		readonly userVerification?: string;
	};
	readonly challengeId: string;
	readonly userId: string;
}

export interface ServiceTokenClientConfig {
	readonly authServiceUrl: string;
	readonly serviceId: string;
	readonly serviceSecret: string;
	readonly audience?: string;
	readonly timeoutMs?: number;
}

export interface ServiceTokenResponse {
	readonly accessToken: string;
}

export interface WebAuthnAuthenticationCompleteRequest {
	readonly userId?: string;
	readonly email?: string;
	readonly tenantId: string;
	readonly challengeId: string;
	readonly response: unknown; // PublicKeyCredential from WebAuthn API
}

export interface WebAuthnAuthenticationCompleteResponse {
	readonly accessToken: string;
	readonly refreshToken: {
		readonly token: string;
		readonly metadata: {
			readonly tokenId: string;
			readonly subjectId: string;
			readonly tenantId: string;
			readonly roles: readonly string[];
			readonly audience: string;
			readonly expiresAt: string;
			readonly createdAt: string;
		};
	} | null;
	readonly verified: boolean;
	readonly userId: string;
}

export interface WebAuthnCredential {
	readonly id: string;
	readonly credentialId: string;
	readonly deviceType: string;
	readonly deviceName: string;
	readonly createdAt: string;
	readonly lastUsedAt: string | null;
}

export interface MFAChallengeRequest {
	readonly email: string;
	readonly tenantId: string;
}

export interface MFAChallengeResponse {
	readonly statusCode: number;
	readonly message: string;
	readonly mfaRequired: boolean;
}

export interface MFAVerifyRequest {
	readonly email: string;
	readonly tenantId: string;
	readonly totp: string;
}

export interface MFAVerifyResponse {
	readonly statusCode: number;
	readonly message: string;
	readonly verified: boolean;
}

export interface SAMLAssertionRequest {
	readonly providerId: string;
	readonly externalUserId: string;
	readonly email: string;
	readonly name?: string;
	readonly tenantId?: string;
	readonly roles?: readonly string[];
	readonly attributes?: Record<string, unknown>;
}

export interface SAMLAssertionResponse {
	readonly accessToken: string;
	readonly refreshToken: {
		readonly token: string;
		readonly metadata: {
			readonly tokenId: string;
			readonly subjectId: string;
			readonly tenantId: string;
			readonly roles: readonly string[];
			readonly audience: string;
			readonly expiresAt: string;
			readonly createdAt: string;
		};
	} | null;
	readonly userId: string;
}

export interface OIDCCallbackRequest {
	readonly providerId: string;
	readonly code: string;
	readonly state?: string;
}

export interface OIDCCallbackResponse {
	readonly accessToken: string;
	readonly refreshToken: {
		readonly token: string;
		readonly metadata: {
			readonly tokenId: string;
			readonly subjectId: string;
			readonly tenantId: string;
			readonly roles: readonly string[];
			readonly audience: string;
			readonly expiresAt: string;
			readonly createdAt: string;
		};
	} | null;
	readonly userId: string;
}

interface RequestOptions {
	readonly body?: unknown;
	readonly headers?: Record<string, string>;
	readonly signal?: AbortSignal;
	readonly operation?: string;
	readonly telemetryRoute?: string;
	readonly telemetryTarget?: string;
}

export class AuthClient {
	private readonly config: InternalAuthClientConfig;
	private readonly telemetry: AuthClientTelemetry | null;
	private readonly targetService: string;

	constructor(config: AuthClientConfig) {
		if (!config.apiKey || config.apiKey.trim().length === 0) {
			throw new Error(
				"QNSP Auth SDK: apiKey is required. " +
					"Get your free API key at https://cloud.qnsp.cuilabs.io/signup — " +
					"no credit card required (FREE tier: 5 GB storage, 2,000 API calls/month). " +
					"Docs: https://docs.qnsp.cuilabs.io/sdk/auth-sdk",
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
			? isAuthClientTelemetry(config.telemetry)
				? config.telemetry
				: createAuthClientTelemetry(config.telemetry)
			: null;

		try {
			this.targetService = new URL(this.config.baseUrl).host;
		} catch {
			this.targetService = "auth-service";
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
					`Auth API error: Rate limit exceeded after ${this.config.maxRetries} retries`,
				);
			}

			if (!response.ok) {
				status = "error";
				// Sanitize error message to prevent information disclosure
				// Don't include full response text in error to avoid leaking sensitive data
				errorMessage = `HTTP ${response.status}`;
				throw new Error(`Auth API error: ${response.status} ${response.statusText}`);
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
			const event: AuthClientTelemetryEvent = {
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

	private recordTelemetryEvent(event: AuthClientTelemetryEvent): void {
		if (!this.telemetry) {
			return;
		}
		this.telemetry.record(event);
	}

	/**
	 * Login with email and password.
	 * Returns a token pair (access token and refresh token).
	 */
	async login(request: LoginRequest): Promise<TokenPair> {
		validateEmail(request.email, "email");
		validateUUID(request.tenantId, "tenantId");

		return this.request<TokenPair>("POST", "/auth/login", {
			body: {
				email: request.email,
				password: request.password,
				tenantId: request.tenantId,
				...(request.totp !== undefined ? { totp: request.totp } : {}),
				...(request.audience !== undefined ? { audience: request.audience } : {}),
			},
			operation: "login",
		});
	}

	/**
	 * Refresh an access token using a refresh token.
	 * Returns a new token pair.
	 */
	async refreshToken(request: RefreshTokenRequest): Promise<TokenPair> {
		return this.request<TokenPair>("POST", "/auth/token/refresh", {
			body: {
				refreshToken: request.refreshToken,
				...(request.audience !== undefined ? { audience: request.audience } : {}),
			},
			operation: "refreshToken",
		});
	}

	/**
	 * Start WebAuthn passkey registration.
	 * Returns registration options and challenge ID.
	 */
	async registerPasskeyStart(
		request: WebAuthnRegistrationStartRequest,
	): Promise<WebAuthnRegistrationStartResponse> {
		validateUUID(request.userId, "userId");
		validateUUID(request.tenantId, "tenantId");

		return this.request<WebAuthnRegistrationStartResponse>(
			"POST",
			"/auth/webauthn/register/start",
			{
				body: {
					userId: request.userId,
					tenantId: request.tenantId,
				},
				operation: "registerPasskeyStart",
			},
		);
	}

	/**
	 * Complete WebAuthn passkey registration.
	 * Requires the response from the WebAuthn API (navigator.credentials.create).
	 */
	async registerPasskeyComplete(
		request: WebAuthnRegistrationCompleteRequest,
	): Promise<WebAuthnRegistrationCompleteResponse> {
		validateUUID(request.userId, "userId");
		validateUUID(request.tenantId, "tenantId");
		validateUUID(request.challengeId, "challengeId");

		return this.request<WebAuthnRegistrationCompleteResponse>(
			"POST",
			"/auth/webauthn/register/complete",
			{
				body: {
					userId: request.userId,
					tenantId: request.tenantId,
					challengeId: request.challengeId,
					response: request.response,
				},
				operation: "registerPasskeyComplete",
			},
		);
	}

	/**
	 * Start WebAuthn passkey authentication.
	 * Can use either userId or email to identify the user.
	 * Returns authentication options and challenge ID.
	 */
	async authenticatePasskeyStart(
		request: WebAuthnAuthenticationStartRequest,
	): Promise<WebAuthnAuthenticationStartResponse> {
		validateUUID(request.tenantId, "tenantId");
		if (request.userId !== undefined) {
			validateUUID(request.userId, "userId");
		}
		if (request.email !== undefined) {
			validateEmail(request.email, "email");
		}

		return this.request<WebAuthnAuthenticationStartResponse>(
			"POST",
			"/auth/webauthn/authenticate/start",
			{
				body: {
					...(request.userId !== undefined ? { userId: request.userId } : {}),
					...(request.email !== undefined ? { email: request.email } : {}),
					tenantId: request.tenantId,
				},
				operation: "authenticatePasskeyStart",
			},
		);
	}

	/**
	 * Complete WebAuthn passkey authentication.
	 * Requires the response from the WebAuthn API (navigator.credentials.get).
	 * Returns a token pair upon successful authentication.
	 */
	async authenticatePasskeyComplete(
		request: WebAuthnAuthenticationCompleteRequest,
	): Promise<WebAuthnAuthenticationCompleteResponse> {
		validateUUID(request.tenantId, "tenantId");
		validateUUID(request.challengeId, "challengeId");
		if (request.userId !== undefined) {
			validateUUID(request.userId, "userId");
		}
		if (request.email !== undefined) {
			validateEmail(request.email, "email");
		}

		return this.request<WebAuthnAuthenticationCompleteResponse>(
			"POST",
			"/auth/webauthn/authenticate/complete",
			{
				body: {
					...(request.userId !== undefined ? { userId: request.userId } : {}),
					...(request.email !== undefined ? { email: request.email } : {}),
					tenantId: request.tenantId,
					challengeId: request.challengeId,
					response: request.response,
				},
				operation: "authenticatePasskeyComplete",
			},
		);
	}

	/**
	 * List all passkeys (WebAuthn credentials) for a user.
	 */
	async listPasskeys(userId: string, tenantId: string): Promise<readonly WebAuthnCredential[]> {
		validateUUID(userId, "userId");
		validateUUID(tenantId, "tenantId");

		const response = await this.request<{ credentials: readonly WebAuthnCredential[] }>(
			"GET",
			`/auth/webauthn/credentials/${userId}?tenantId=${encodeURIComponent(tenantId)}`,
			{
				operation: "listPasskeys",
			},
		);
		return response.credentials;
	}

	/**
	 * Delete a passkey (WebAuthn credential) for a user.
	 */
	async deletePasskey(credentialId: string, userId: string): Promise<void> {
		validateUUID(credentialId, "credentialId");
		validateUUID(userId, "userId");

		return this.request<void>(
			"DELETE",
			`/auth/webauthn/credentials/${credentialId}?userId=${encodeURIComponent(userId)}`,
			{
				operation: "deletePasskey",
			},
		);
	}

	/**
	 * Generate an MFA challenge (TOTP).
	 * Returns a response indicating MFA is required.
	 */
	async mfaChallenge(request: MFAChallengeRequest): Promise<MFAChallengeResponse> {
		validateEmail(request.email, "email");
		validateUUID(request.tenantId, "tenantId");

		return this.request<MFAChallengeResponse>("POST", "/auth/mfa/challenge", {
			body: {
				email: request.email,
				tenantId: request.tenantId,
			},
			operation: "mfaChallenge",
		});
	}

	/**
	 * Verify an MFA code (TOTP).
	 * Returns a response indicating verification success.
	 */
	async mfaVerify(request: MFAVerifyRequest): Promise<MFAVerifyResponse> {
		validateEmail(request.email, "email");
		validateUUID(request.tenantId, "tenantId");

		return this.request<MFAVerifyResponse>("POST", "/auth/mfa/verify", {
			body: {
				email: request.email,
				tenantId: request.tenantId,
				totp: request.totp,
			},
			operation: "mfaVerify",
		});
	}

	/**
	 * Process a SAML assertion for federation.
	 * Returns a token pair upon successful authentication.
	 */
	async federateSAML(request: SAMLAssertionRequest): Promise<SAMLAssertionResponse> {
		validateEmail(request.email, "email");
		if (request.tenantId !== undefined) {
			validateUUID(request.tenantId, "tenantId");
		}

		return this.request<SAMLAssertionResponse>("POST", "/auth/federation/saml/assertion", {
			body: {
				providerId: request.providerId,
				externalUserId: request.externalUserId,
				email: request.email,
				...(request.name !== undefined ? { name: request.name } : {}),
				...(request.tenantId !== undefined ? { tenantId: request.tenantId } : {}),
				...(request.roles !== undefined ? { roles: request.roles } : {}),
				attributes: request.attributes ?? {},
			},
			operation: "federateSAML",
		});
	}

	/**
	 * Process an OIDC callback for federation.
	 * Exchanges the authorization code for tokens and returns a token pair.
	 */
	async federateOIDC(request: OIDCCallbackRequest): Promise<OIDCCallbackResponse> {
		return this.request<OIDCCallbackResponse>("POST", "/auth/federation/oidc/callback", {
			body: {
				providerId: request.providerId,
				code: request.code,
				...(request.state !== undefined ? { state: request.state } : {}),
			},
			operation: "federateOIDC",
		});
	}
}

/**
 * Request a service account token from the auth-service /auth/service-token endpoint.
 *
 * This helper is intended for internal services (vault, storage, billing, etc.) to
 * obtain short-lived PQC-signed JWTs for outbound calls. It returns null on any
 * network or HTTP error so callers can decide whether to fall back to legacy
 * static tokens in non-production environments.
 */
export async function requestServiceToken(
	config: ServiceTokenClientConfig,
): Promise<ServiceTokenResponse | null> {
	const baseUrl = config.authServiceUrl.replace(/\/$/, "");

	if (!baseUrl.startsWith("https://")) {
		const isLocalhost =
			baseUrl.startsWith("http://localhost") || baseUrl.startsWith("http://127.0.0.1");
		const isInternalServiceMesh = baseUrl.includes(".internal");
		const isDevelopment =
			process.env["NODE_ENV"] === "development" || process.env["NODE_ENV"] === "test";
		if (!isLocalhost && !isInternalServiceMesh && !isDevelopment) {
			throw new Error(
				"authServiceUrl must use HTTPS in production. HTTP is only allowed for localhost, internal service mesh, or development.",
			);
		}
	}

	const controller = new AbortController();
	const timeoutMs = config.timeoutMs ?? 5_000;
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const url = new URL("/auth/service-token", baseUrl).toString();
		const body: { serviceId: string; audience?: string } = {
			serviceId: config.serviceId,
		};
		if (config.audience !== undefined) {
			body.audience = config.audience;
		}

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${config.serviceSecret}`,
			},
			body: JSON.stringify(body),
			signal: controller.signal,
		});

		if (!response.ok) {
			return null;
		}

		const data = (await response.json()) as { accessToken?: unknown };
		if (typeof data.accessToken !== "string" || data.accessToken.length === 0) {
			return null;
		}

		return { accessToken: data.accessToken };
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			return null;
		}
		return null;
	} finally {
		clearTimeout(timeoutId);
	}
}

/**
 * Convenience helper that returns a ready-to-use Authorization header for a
 * service account, or undefined if a token could not be obtained.
 */
export async function getServiceAuthHeader(
	config: ServiceTokenClientConfig,
): Promise<string | undefined> {
	const result = await requestServiceToken(config);
	if (!result) {
		return undefined;
	}
	return `Bearer ${result.accessToken}`;
}

// ============================================================================
// Personal Access Token (PAT) Types and Utilities
// ============================================================================

/**
 * PQC hash algorithms supported for PAT storage.
 * SHA-3 is NIST FIPS 202 approved and explicitly PQC-safe.
 */
export type PatPqcHashAlgorithm = "sha3-256" | "sha3-512" | "shake256";

/**
 * PQC signature algorithms supported for PAT signing.
 * Based on NIST FIPS 204 (ML-DSA, formerly Dilithium).
 */
export type PatPqcSignatureAlgorithm = "dilithium-2" | "dilithium-3" | "dilithium-5";

/**
 * PAT crypto tier aligned with tenant crypto policy.
 */
export type PatCryptoTier = "standard" | "hybrid" | "maximum";

/**
 * Scopes available for Personal Access Tokens.
 */
export const PAT_SCOPES = [
	"read:storage",
	"write:storage",
	"read:vault",
	"write:vault",
	"read:kms",
	"write:kms",
	"read:audit",
	"admin:tenant",
] as const;

export type PatScope = (typeof PAT_SCOPES)[number];

/**
 * PQC metadata returned with PAT operations.
 */
export interface PatPqcMetadata {
	/** Hash algorithm used for secure storage (SHA-3 family) */
	readonly hashAlgorithm: PatPqcHashAlgorithm;
	/** Signature algorithm if token is signed (ML-DSA/Dilithium) */
	readonly signatureAlgorithm: PatPqcSignatureAlgorithm | null;
	/** Whether the token has a PQC signature */
	readonly signed: boolean;
	/** Crypto tier that determined the algorithms */
	readonly cryptoTier: PatCryptoTier;
}

/**
 * Personal Access Token record.
 */
export interface PersonalAccessToken {
	readonly id: string;
	readonly name: string;
	readonly description: string | null;
	/** First 20 characters of token for identification */
	readonly tokenPrefix: string;
	readonly scopes: readonly PatScope[];
	readonly expiresAt: string | null;
	readonly lastUsedAt: string | null;
	readonly createdAt: string;
	/** PQC metadata (Quantum-Native Security) */
	readonly pqc?: PatPqcMetadata;
}

/**
 * Response from PAT creation - includes the one-time plaintext token.
 */
export interface CreatePatResponse extends PersonalAccessToken {
	/** The full token - only returned once on creation */
	readonly token: string;
	/** PQC metadata for the created token */
	readonly pqc: PatPqcMetadata;
}

/**
 * Request to create a Personal Access Token.
 */
export interface CreatePatRequest {
	readonly name: string;
	readonly description?: string;
	readonly scopes: readonly PatScope[];
	/** Token expiration in days (null for never) */
	readonly expiresInDays?: number | null;
}

/**
 * PAT validation result from the auth service.
 */
export interface ValidatePatResult {
	readonly valid: boolean;
	readonly userId: string;
	readonly tenantId: string;
	readonly scopes: readonly PatScope[];
	readonly tokenId: string;
	readonly expiresAt: string | null;
	readonly pqc?: {
		readonly hashAlgorithm: PatPqcHashAlgorithm;
		readonly signatureAlgorithm: PatPqcSignatureAlgorithm | null;
		readonly cryptoTier: PatCryptoTier;
		readonly isPqcNative: boolean;
	};
}

/**
 * Check if a token string is a QNSP Personal Access Token.
 * Supports both legacy (qnsp_pat_) and PQC-native (qnsp_pqc_pat_) formats.
 */
export function isPersonalAccessToken(token: string): boolean {
	return token.startsWith("qnsp_pat_") || token.startsWith("qnsp_pqc_pat_");
}

/**
 * Check if a token string is a PQC-native Personal Access Token.
 */
export function isPqcNativeToken(token: string): boolean {
	return token.startsWith("qnsp_pqc_pat_");
}

/**
 * Map NIST algorithm names for PAT PQC metadata.
 */
export const PAT_PQC_ALGORITHM_TO_NIST: Record<string, string> = {
	"sha3-256": "SHA3-256",
	"sha3-512": "SHA3-512",
	shake256: "SHAKE256",
	"dilithium-2": "ML-DSA-44",
	"dilithium-3": "ML-DSA-65",
	"dilithium-5": "ML-DSA-87",
};

/**
 * Get NIST standardized name for a PAT PQC algorithm.
 */
export function toPatNistAlgorithmName(algorithm: string): string {
	return PAT_PQC_ALGORITHM_TO_NIST[algorithm] ?? algorithm;
}

export * from "./observability.js";
export * from "./validation.js";
