import { NetworkError, normalizeError, RateLimitError, TimeoutError } from "./index.js";

export interface HttpClientConfig {
	baseURL?: string;
	timeout?: number;
	maxRetries?: number;
	retryDelay?: number;
	headers?: Record<string, string>;
	userAgent?: string;
}

export interface RequestConfig extends RequestInit {
	timeout?: number;
	maxRetries?: number;
	retryDelay?: number;
	signal?: AbortSignal;
}

export class HttpClient {
	private readonly config: Required<
		Pick<
			HttpClientConfig,
			"baseURL" | "timeout" | "maxRetries" | "retryDelay" | "headers" | "userAgent"
		>
	>;

	constructor(config: HttpClientConfig = {}) {
		this.config = {
			baseURL: config.baseURL || "",
			timeout: config.timeout || 30_000,
			maxRetries: config.maxRetries || 3,
			retryDelay: config.retryDelay || 1_000,
			headers: config.headers || {},
			userAgent: config.userAgent || "QNSP-HttpClient/1.0",
		};
	}

	async request<T = unknown>(path: string, options: RequestConfig = {}): Promise<T> {
		const url = this.buildUrl(path);
		const timeout = options.timeout || this.config.timeout;
		const maxRetries = options.maxRetries || this.config.maxRetries;
		const retryDelay = options.retryDelay || this.config.retryDelay;

		let lastError: unknown;
		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				const response = await this.makeRequest(url, options, timeout);
				return (await this.handleResponse(response, options.method ?? "GET")) as T;
			} catch (error) {
				lastError = error;
				const normalized = normalizeError(error);

				if (
					normalized instanceof NetworkError &&
					normalized.status &&
					normalized.status >= 400 &&
					normalized.status < 500 &&
					normalized.status !== 429
				) {
					break;
				}

				if (attempt === maxRetries) {
					break;
				}

				const delay = retryDelay * 2 ** attempt;
				await this.delay(delay);
			}
		}

		throw normalizeError(lastError);
	}

	get<T = unknown>(path: string, config?: RequestConfig): Promise<T> {
		return this.request(path, { ...config, method: "GET" });
	}

	post<T = unknown>(path: string, data?: unknown, config?: RequestConfig): Promise<T> {
		return this.request(path, {
			...config,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...config?.headers,
			},
			...(data !== undefined ? { body: JSON.stringify(data) } : {}),
		});
	}

	put<T = unknown>(path: string, data?: unknown, config?: RequestConfig): Promise<T> {
		return this.request(path, {
			...config,
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				...config?.headers,
			},
			...(data !== undefined ? { body: JSON.stringify(data) } : {}),
		});
	}

	patch<T = unknown>(path: string, data?: unknown, config?: RequestConfig): Promise<T> {
		return this.request(path, {
			...config,
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				...config?.headers,
			},
			...(data !== undefined ? { body: JSON.stringify(data) } : {}),
		});
	}

	delete<T = unknown>(path: string, config?: RequestConfig): Promise<T> {
		return this.request(path, { ...config, method: "DELETE" });
	}

	private buildUrl(path: string): string {
		const baseURL = this.config.baseURL.endsWith("/")
			? this.config.baseURL.slice(0, -1)
			: this.config.baseURL;
		const cleanPath = path.startsWith("/") ? path : `/${path}`;
		return baseURL ? `${baseURL}${cleanPath}` : cleanPath;
	}

	private async makeRequest(
		url: string,
		options: RequestConfig,
		timeout: number,
	): Promise<Response> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		const headers: Record<string, string> = {
			"User-Agent": this.config.userAgent,
			...this.config.headers,
			...(options.headers as Record<string, string> | undefined),
		};

		try {
			if (options.signal) {
				if (options.signal.aborted) {
					controller.abort();
				} else {
					options.signal.addEventListener("abort", () => controller.abort(), { once: true });
				}
			}

			const response = await fetch(url, {
				...options,
				headers,
				signal: controller.signal,
			});
			clearTimeout(timeoutId);
			return response;
		} catch (error) {
			clearTimeout(timeoutId);
			if (error instanceof Error) {
				if (error.name === "AbortError") {
					throw new TimeoutError(
						`Request to ${url} timed out after ${timeout}ms`,
						timeout,
						`${options.method || "GET"} ${url}`,
					);
				}
				throw new NetworkError(
					`Network request failed: ${error.message}`,
					url,
					options.method || "GET",
					undefined,
					error,
				);
			}
			throw error;
		}
	}

	private async handleResponse(response: Response, method: string): Promise<unknown> {
		if (response.status === 429) {
			const retryAfter = response.headers.get("Retry-After");
			const limit = response.headers.get("X-RateLimit-Limit");
			throw new RateLimitError(
				"Rate limit exceeded",
				retryAfter ? parseInt(retryAfter, 10) : undefined,
				limit ? parseInt(limit, 10) : undefined,
			);
		}

		if (response.ok) {
			const contentType = response.headers.get("Content-Type");
			if (contentType?.includes("application/json")) {
				return response.json();
			}
			if (contentType?.includes("text/")) {
				return response.text();
			}
			return undefined;
		}

		let errorBody: unknown;
		try {
			errorBody = await response.clone().json();
		} catch {
			try {
				errorBody = await response.clone().text();
			} catch {
				errorBody = undefined;
			}
		}

		const bodyPreview =
			errorBody === undefined
				? ""
				: typeof errorBody === "string"
					? ` - ${errorBody}`
					: ` - ${JSON.stringify(errorBody)}`;

		throw new NetworkError(
			`HTTP ${response.status}: ${response.statusText}${bodyPreview}`,
			response.url,
			method,
			response.status,
		);
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

export function createHttpClient(config?: HttpClientConfig): HttpClient {
	return new HttpClient(config);
}

export const httpClient = createHttpClient({
	timeout: 30_000,
	maxRetries: 3,
	retryDelay: 1_000,
	userAgent: "QNSP-Platform/1.0",
});
