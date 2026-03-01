import { performance } from "node:perf_hooks";

import type {
	BillingClientTelemetry,
	BillingClientTelemetryConfig,
	BillingClientTelemetryEvent,
} from "./observability.js";
import { createBillingClientTelemetry, isBillingClientTelemetry } from "./observability.js";
import { validateUUID } from "./validation.js";

/**
 * @qnsp/billing-sdk
 *
 * TypeScript SDK client for the QNSP billing-service API.
 * Provides a high-level interface for usage meter ingestion and invoice management.
 */

export interface BillingClientConfig {
	readonly baseUrl: string;
	readonly apiKey: string;
	readonly timeoutMs?: number;
	readonly telemetry?: BillingClientTelemetry | BillingClientTelemetryConfig;
	readonly maxRetries?: number;
	readonly retryDelayMs?: number;
}

type InternalBillingClientConfig = {
	readonly baseUrl: string;
	readonly apiKey: string;
	readonly timeoutMs: number;
	readonly maxRetries: number;
	readonly retryDelayMs: number;
};

export interface BillingSecurityEnvelope {
	readonly controlPlaneTokenSha256: string | null;
	readonly pqcSignatures: readonly {
		readonly provider: string;
		readonly algorithm: string;
		readonly value: string;
		readonly publicKey: string;
	}[];
	readonly hardwareProvider: string | null;
	readonly attestationStatus: string | null;
	readonly attestationProof: string | null;
}

export interface SecuritySignature {
	readonly provider: string;
	readonly algorithm: string;
	readonly value: string;
	readonly publicKey: string;
}

export interface Meter {
	readonly tenantId: string;
	readonly source: string;
	readonly meterType: string;
	readonly quantity: number;
	readonly unit: string;
	readonly currency?: "USD" | "EUR" | "GBP";
	readonly recordedAt: string;
	readonly metadata?: Record<string, unknown>;
	readonly security: BillingSecurityEnvelope;
	readonly signature?: SecuritySignature;
}

export interface InvoiceLineItem {
	readonly description: string;
	readonly quantity: number;
	readonly unitPriceCents: number;
	readonly totalCents: number;
	readonly meterType?: string | null;
}

export interface Invoice {
	readonly id: string;
	readonly tenantId: string;
	readonly periodStart: string;
	readonly periodEnd: string;
	readonly currency: string;
	readonly subtotalCents: number;
	readonly taxCents: number;
	readonly totalCents: number;
	readonly status: string;
	readonly lineItems: readonly InvoiceLineItem[];
	readonly security: BillingSecurityEnvelope;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface IngestMetersRequest {
	readonly meters: readonly Meter[];
}

export interface IngestMetersResponse {
	readonly accepted: number;
}

export interface CreateInvoiceRequest {
	readonly tenantId: string;
	readonly periodStart: string;
	readonly periodEnd: string;
	readonly lineItems: readonly InvoiceLineItem[];
	readonly currency?: "USD" | "EUR" | "GBP";
	readonly taxesCents?: number;
	readonly metadata?: Record<string, unknown>;
	readonly security: BillingSecurityEnvelope;
	readonly signature?: SecuritySignature;
}

export interface ListInvoicesResponse {
	readonly items: readonly Invoice[];
	readonly nextCursor: string | null;
}

interface RequestOptions {
	readonly body?: unknown;
	readonly headers?: Record<string, string>;
	readonly signal?: AbortSignal;
	readonly operation?: string;
	readonly telemetryRoute?: string;
	readonly telemetryTarget?: string;
}

export class BillingClient {
	private readonly config: InternalBillingClientConfig;
	private readonly telemetry: BillingClientTelemetry | null;
	private readonly targetService: string;

	constructor(config: BillingClientConfig) {
		if (!config.apiKey || config.apiKey.trim().length === 0) {
			throw new Error(
				"QNSP Billing SDK: apiKey is required. " +
					"Get your free API key at https://cloud.qnsp.cuilabs.io/signup — " +
					"no credit card required (FREE tier: 5 GB storage, 2,000 API calls/month). " +
					"Docs: https://docs.qnsp.cuilabs.io/sdk/billing-sdk",
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
			? isBillingClientTelemetry(config.telemetry)
				? config.telemetry
				: createBillingClientTelemetry(config.telemetry)
			: null;

		try {
			this.targetService = new URL(this.config.baseUrl).host;
		} catch {
			this.targetService = "billing-service";
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
					`Billing API error: Rate limit exceeded after ${this.config.maxRetries} retries`,
				);
			}

			if (!response.ok) {
				status = "error";
				// Sanitize error message to prevent information disclosure
				// Don't include full response text in error to avoid leaking sensitive data
				errorMessage = `HTTP ${response.status}`;
				throw new Error(`Billing API error: ${response.status} ${response.statusText}`);
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
			const event: BillingClientTelemetryEvent = {
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

	private recordTelemetryEvent(event: BillingClientTelemetryEvent): void {
		if (!this.telemetry) {
			return;
		}
		this.telemetry.record(event);
	}

	/**
	 * Ingest usage meters (batch).
	 * Accepts multiple meters in a single request.
	 * Returns the number of accepted meters.
	 */
	async ingestMeters(request: IngestMetersRequest): Promise<IngestMetersResponse> {
		// Validate tenantId in each meter
		for (const meter of request.meters) {
			validateUUID(meter.tenantId, "meter.tenantId");
		}

		return this.request<IngestMetersResponse>("POST", "/billing/v1/meters", {
			body: {
				meters: request.meters,
			},
			operation: "ingestMeters",
		});
	}

	/**
	 * Create an invoice from line items.
	 * Requires PQC-signed security envelope and optional signature.
	 */
	async createInvoice(request: CreateInvoiceRequest): Promise<Invoice> {
		validateUUID(request.tenantId, "tenantId");

		return this.request<Invoice>("POST", "/billing/v1/invoices", {
			body: {
				tenantId: request.tenantId,
				periodStart: request.periodStart,
				periodEnd: request.periodEnd,
				lineItems: request.lineItems,
				...(request.currency !== undefined ? { currency: request.currency } : {}),
				...(request.taxesCents !== undefined ? { taxesCents: request.taxesCents } : {}),
				...(request.metadata !== undefined ? { metadata: request.metadata } : {}),
				security: request.security,
				...(request.signature !== undefined ? { signature: request.signature } : {}),
			},
			operation: "createInvoice",
		});
	}

	/**
	 * List invoices for a tenant with cursor-based pagination.
	 * Returns a list of invoices and an optional next cursor for pagination.
	 */
	async listInvoices(
		tenantId: string,
		options?: {
			readonly limit?: number;
			readonly cursor?: string;
		},
	): Promise<ListInvoicesResponse> {
		validateUUID(tenantId, "tenantId");

		const params = new URLSearchParams({
			tenantId,
		});
		if (options?.limit !== undefined) {
			params.set("limit", String(options.limit));
		}
		if (options?.cursor !== undefined) {
			params.set("cursor", options.cursor);
		}

		return this.request<ListInvoicesResponse>("GET", `/billing/v1/invoices?${params}`, {
			operation: "listInvoices",
		});
	}
}

export * from "./observability.js";
export * from "./validation.js";
