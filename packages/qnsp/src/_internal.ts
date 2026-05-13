/**
 * Shared HTTP plumbing + activation cache.
 *
 * Internal — consumers should reach this only via `QnspClient`. Each
 * service module (vault, kms, audit, …) takes an `Internal` instance
 * in its constructor and calls `internal.request(method, path, …)`.
 */

import { activateSdk, type SdkActivationResponse } from "./_activation/index.js";

import { QnspApiError, QnspAuthError, QnspNetworkError } from "./errors.js";

export const SDK_ID = "qnsp";
export const SDK_VERSION = "0.1.0";

const DEFAULT_BASE_URL = "https://api.qnsp.cuilabs.io";
const DEFAULT_TIMEOUT_MS = 15_000;
const EXPIRY_BUFFER_MS = 60_000; // refresh 60 s before expiry

/** Public configuration accepted by `new QnspClient(opts)`. */
export interface QnspClientOptions {
	/** API key issued from <https://cloud.qnsp.cuilabs.io/api-keys>. Required. */
	readonly apiKey: string;
	/** Override the QNSP edge-gateway URL. Defaults to https://api.qnsp.cuilabs.io. */
	readonly baseUrl?: string;
	/** Per-request timeout in milliseconds. Defaults to 15 000. */
	readonly timeoutMs?: number;
}

/** Cached activation result. */
interface ActivationState {
	readonly response: SdkActivationResponse;
	readonly cachedAt: number;
}

/** Optional per-request overrides. */
export interface RequestOptions {
	readonly idempotencyKey?: string | undefined;
	readonly query?: Record<string, string | number | boolean | undefined> | undefined;
}

export class Internal {
	readonly baseUrl: string;
	readonly timeoutMs: number;
	readonly apiKey: string;

	private cached: ActivationState | null = null;
	private activationPromise: Promise<SdkActivationResponse> | null = null;

	constructor(opts: QnspClientOptions) {
		if (!opts.apiKey || opts.apiKey.trim().length === 0) {
			throw new QnspAuthError("api key required (sign up at https://cloud.qnsp.cuilabs.io/auth)");
		}
		this.apiKey = opts.apiKey;
		this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
		this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	}

	/** Force the activation handshake to run now. */
	async ensureActivated(): Promise<SdkActivationResponse> {
		const cached = this.cached;
		if (cached !== null) {
			const expiresAtMs = parseExpiresAt(cached.response);
			if (expiresAtMs - Date.now() > EXPIRY_BUFFER_MS) {
				return cached.response;
			}
		}
		return this.refreshActivation();
	}

	/** Drop the cached activation; the next request will re-handshake. */
	invalidateActivation(): void {
		this.cached = null;
		this.activationPromise = null;
	}

	private async refreshActivation(): Promise<SdkActivationResponse> {
		if (this.activationPromise) {
			return this.activationPromise;
		}
		this.activationPromise = activateSdk({
			apiKey: this.apiKey,
			sdkId: SDK_ID,
			sdkVersion: SDK_VERSION,
			platformUrl: this.baseUrl,
		})
			.then((response) => {
				this.cached = { response, cachedAt: Date.now() };
				this.activationPromise = null;
				return response;
			})
			.catch((err: unknown) => {
				this.activationPromise = null;
				throw err;
			});
		return this.activationPromise;
	}

	/**
	 * Authenticated request against the QNSP edge gateway. JSON in, JSON
	 * out. A 401 invalidates the activation cache and retries once.
	 *
	 * @param method  HTTP method (GET / POST / PUT / PATCH / DELETE)
	 * @param path    Path under the base URL, including the service prefix
	 *                (e.g. "/vault/v1/secrets")
	 * @param body    JSON body for non-GET methods. `undefined` to omit.
	 * @param options Per-request options (idempotency key, query string)
	 */
	async request<T = Record<string, unknown>>(
		method: string,
		path: string,
		body?: unknown,
		options?: RequestOptions,
	): Promise<T> {
		await this.ensureActivated();

		let response = await this.send(method, path, body, options);
		if (response.status === 401) {
			this.invalidateActivation();
			await this.ensureActivated();
			response = await this.send(method, path, body, options);
		}

		const text = await safeReadText(response);

		if (!response.ok) {
			throw parseApiError(response.status, text);
		}

		if (response.status === 204 || text.length === 0) {
			return {} as T;
		}

		try {
			return JSON.parse(text) as T;
		} catch {
			throw new QnspApiError("response is not valid JSON", response.status);
		}
	}

	private async send(
		method: string,
		path: string,
		body: unknown,
		options: RequestOptions | undefined,
	): Promise<Response> {
		const url = buildUrl(this.baseUrl, path, options?.query);
		const headers: Record<string, string> = {
			authorization: `Bearer ${this.apiKey}`,
			accept: "application/json",
		};
		const init: RequestInit = { method, headers };
		if (body !== undefined) {
			headers["content-type"] = "application/json";
			init.body = JSON.stringify(body);
		}
		if (options?.idempotencyKey) {
			headers["idempotency-key"] = options.idempotencyKey;
		}
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), this.timeoutMs);
		init.signal = controller.signal;
		try {
			return await fetch(url, init);
		} catch (err) {
			throw new QnspNetworkError(method, url, err);
		} finally {
			clearTimeout(timer);
		}
	}
}

function buildUrl(base: string, path: string, query: RequestOptions["query"]): string {
	let url = `${base}${path}`;
	if (query) {
		const usp = new URLSearchParams();
		for (const [key, value] of Object.entries(query)) {
			if (value === undefined) continue;
			usp.set(key, String(value));
		}
		const encoded = usp.toString();
		if (encoded.length > 0) {
			url += url.includes("?") ? `&${encoded}` : `?${encoded}`;
		}
	}
	return url;
}

async function safeReadText(response: Response): Promise<string> {
	try {
		return await response.text();
	} catch {
		return "";
	}
}

function parseApiError(status: number, raw: string): QnspApiError {
	let body: unknown = null;
	try {
		body = JSON.parse(raw);
	} catch {
		body = raw;
	}
	let code: string | null = null;
	let message = `HTTP ${status}`;
	if (body && typeof body === "object") {
		const obj = body as Record<string, unknown>;
		if (typeof obj["code"] === "string") code = obj["code"];
		if (typeof obj["message"] === "string") {
			message = obj["message"];
		} else if (typeof obj["error"] === "string") {
			message = obj["error"];
		}
	} else if (typeof raw === "string" && raw.length > 0) {
		message = raw;
	}
	return new QnspApiError(message, status, code, body);
}

function parseExpiresAt(response: SdkActivationResponse): number {
	const { expiresAt } = response as unknown as { expiresAt?: string | number };
	if (typeof expiresAt === "number") return expiresAt;
	if (typeof expiresAt === "string") {
		const parsed = Date.parse(expiresAt);
		if (!Number.isNaN(parsed)) return parsed;
	}
	// Conservative default — 5 minutes from now.
	return Date.now() + 5 * 60_000;
}
