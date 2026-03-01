import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";

import type { AiClientTelemetry, AiClientTelemetryConfig } from "./observability.js";
import { createAiClientTelemetry, isAiClientTelemetry } from "./observability.js";
import { checkTierAccess, type PricingTier, TierError } from "./tier.js";
import type {
	InferenceRequest,
	InferenceResponse,
	InferenceStreamEvent,
	ListWorkloadsResponse,
	ModelDeploymentRequest,
	RegisterArtifactRequest,
	RegisteredArtifact,
	SubmitWorkloadRequest,
	SubmitWorkloadResponse,
	WorkloadDetail,
} from "./types.js";
import { validateUUID } from "./validation.js";

export interface AiOrchestratorClientOptions {
	readonly baseUrl: string;
	readonly token: string;
	readonly tier?: PricingTier;
	readonly maxRetries?: number;
	readonly retryDelayMs?: number;
	readonly fetchImpl?: typeof fetch;
	readonly telemetry?: AiClientTelemetry | AiClientTelemetryConfig;
}

export { TierError };

export interface ListWorkloadsParams {
	readonly tenantId?: string;
	readonly status?: string;
	readonly cursor?: string;
	readonly limit?: number;
}

export interface CancelWorkloadRequest {
	readonly workloadId: string;
	readonly reason?: string;
}

export class AiOrchestratorClient {
	private readonly baseUrl: URL;
	private readonly token: string;
	private readonly tier: PricingTier | undefined;
	private readonly maxRetries: number;
	private readonly retryDelayMs: number;
	private readonly fetchImpl: typeof fetch;
	private readonly telemetry: AiClientTelemetry | null;
	private readonly targetService: string;

	constructor(options: AiOrchestratorClientOptions) {
		if (!options.token || options.token.trim().length === 0) {
			throw new Error(
				"QNSP AI SDK: token is required. " +
					"Get your free API key at https://cloud.qnsp.cuilabs.io/signup — " +
					"no credit card required (FREE tier: 5 GB storage, 2,000 API calls/month). " +
					"Docs: https://docs.qnsp.cuilabs.io/sdk/ai-sdk",
			);
		}

		const baseUrlNormalized = options.baseUrl.replace(/\/$/, "");

		// Enforce HTTPS in production (allow HTTP only for localhost in development)
		if (!baseUrlNormalized.startsWith("https://")) {
			const isLocalhost =
				baseUrlNormalized.startsWith("http://localhost") ||
				baseUrlNormalized.startsWith("http://127.0.0.1");
			const isDevelopment =
				process.env["NODE_ENV"] === "development" || process.env["NODE_ENV"] === "test";
			if (!isLocalhost || !isDevelopment) {
				throw new Error(
					"baseUrl must use HTTPS in production. HTTP is only allowed for localhost in development.",
				);
			}
		}

		this.baseUrl = new URL(
			baseUrlNormalized.endsWith("/") ? baseUrlNormalized : `${baseUrlNormalized}/`,
		);
		this.token = options.token;
		this.tier = options.tier;
		this.maxRetries = options.maxRetries ?? 3;
		this.retryDelayMs = options.retryDelayMs ?? 1_000;
		this.fetchImpl = options.fetchImpl ?? fetch;

		this.telemetry = options.telemetry
			? isAiClientTelemetry(options.telemetry)
				? options.telemetry
				: createAiClientTelemetry(options.telemetry)
			: null;

		try {
			this.targetService = new URL(baseUrlNormalized).host;
		} catch {
			this.targetService = "ai-orchestrator";
		}
	}

	/**
	 * Check if the current tier has access to AI inference.
	 * Throws TierError if not authorized.
	 */
	private checkInferenceAccess(): void {
		if (this.tier) {
			checkTierAccess("ai-inference", this.tier);
		}
	}

	/**
	 * Check if the current tier has access to AI training.
	 * Throws TierError if not authorized.
	 */
	private checkTrainingAccess(): void {
		if (this.tier) {
			checkTierAccess("ai-training", this.tier);
		}
	}

	/**
	 * Check if the current tier has access to enclaves.
	 * Throws TierError if not authorized.
	 */
	private checkEnclaveAccess(): void {
		if (this.tier) {
			checkTierAccess("enclaves", this.tier);
		}
	}

	async registerArtifact(input: RegisterArtifactRequest): Promise<RegisteredArtifact> {
		return this.request<RegisteredArtifact>("ai/v1/artifacts", {
			method: "POST",
			body: JSON.stringify(input),
		});
	}

	async submitWorkload(input: SubmitWorkloadRequest): Promise<SubmitWorkloadResponse> {
		// Training workloads require enterprise-pro tier
		const isTraining =
			input.name?.toLowerCase().includes("training") ||
			input.name?.toLowerCase().includes("fine-tune");
		if (isTraining) {
			this.checkTrainingAccess();
		}
		// GPU workloads with high resources likely need enclave access
		const needsEnclave = input.resources?.gpu && input.resources.gpu > 0;
		if (needsEnclave) {
			this.checkEnclaveAccess();
		}

		const { idempotencyKey, ...payload } = input;
		const headers: Record<string, string> = {};
		if (idempotencyKey) {
			headers["idempotency-key"] = idempotencyKey;
		}

		const body = JSON.stringify({
			...payload,
			env: payload.env ?? {},
		});

		return this.request<SubmitWorkloadResponse>("ai/v1/workloads", {
			method: "POST",
			headers,
			body,
		});
	}

	async deployModel(request: ModelDeploymentRequest): Promise<SubmitWorkloadResponse> {
		this.checkInferenceAccess();
		const manifestDigest = createHash("sha3-512")
			.update(JSON.stringify(request.manifest))
			.digest("hex");
		const issuedAt = new Date().toISOString();
		const workload: SubmitWorkloadRequest = {
			tenantId: request.tenantId,
			name: `${request.modelName}-deployment`,
			priority: request.priority ?? "normal",
			schedulingPolicy: request.schedulingPolicy ?? "on-demand",
			containerImage: request.runtimeImage,
			command: request.command ?? ["python", "-m", "qnsp.runtime.inference"],
			env: {
				MODEL_NAME: request.modelName,
				MODEL_VERSION: request.manifest.version,
				...request.env,
			},
			resources: request.resources,
			artifacts: [
				{
					artifactId: request.artifactId,
					mountPath: "/models",
					accessMode: "read",
				},
			],
			manifest: {
				pqcSignature: manifestDigest,
				algorithm: "sha3-512",
				issuedAt,
				modelName: request.modelName,
				modelVersion: request.manifest.version,
				artifactId: request.artifactId,
				modelPackage: request.manifest,
			},
			labels: {
				"qnsp.io/model-name": request.modelName,
				"qnsp.io/model-version": request.manifest.version,
				...(request.labels ?? {}),
			},
		};
		return this.submitWorkload(workload);
	}

	async getWorkload(workloadId: string): Promise<WorkloadDetail> {
		validateUUID(workloadId, "workloadId");
		return this.request<WorkloadDetail>(`ai/v1/workloads/${workloadId}`, {
			method: "GET",
		});
	}

	async listWorkloads(params: ListWorkloadsParams = {}): Promise<ListWorkloadsResponse> {
		const url = new URL("ai/v1/workloads", this.baseUrl);
		if (params.tenantId) {
			validateUUID(params.tenantId, "tenantId");
			url.searchParams.set("tenantId", params.tenantId);
		}
		if (params.status) {
			url.searchParams.set("status", params.status);
		}
		if (params.cursor) {
			url.searchParams.set("cursor", params.cursor);
		}
		if (typeof params.limit === "number") {
			url.searchParams.set("limit", params.limit.toString());
		}

		return this.request<ListWorkloadsResponse>(url, {
			method: "GET",
		});
	}

	async cancelWorkload(input: CancelWorkloadRequest) {
		const init: RequestInit = {
			method: "POST",
		};
		if (input.reason) {
			init.body = JSON.stringify({ reason: input.reason });
		}
		return this.request<{ workloadId: string; status: string; canceledAt: string }>(
			`ai/v1/workloads/${input.workloadId}/cancel`,
			init,
		);
	}

	async invokeInference(request: InferenceRequest): Promise<InferenceResponse> {
		this.checkInferenceAccess();
		return this.request<InferenceResponse>("ai/v1/inference", {
			method: "POST",
			body: JSON.stringify({
				tenantId: request.tenantId,
				modelDeploymentId: request.modelDeploymentId,
				input: request.input,
				priority: request.priority ?? "normal",
			}),
		});
	}

	async *streamInferenceEvents(workloadId: string): AsyncGenerator<InferenceStreamEvent> {
		validateUUID(workloadId, "workloadId");
		const response = await this.requestRaw(`ai/v1/inference/${workloadId}/stream`, {
			method: "GET",
		});
		const body = response.body;
		if (!body) {
			return;
		}

		const reader = body.getReader();
		const decoder = new TextDecoder();
		let buffer = "";

		try {
			while (true) {
				const { value, done } = await reader.read();
				if (done) {
					break;
				}
				buffer += decoder.decode(value, { stream: true });
				let newlineIndex = buffer.indexOf("\n");
				while (newlineIndex >= 0) {
					const line = buffer.slice(0, newlineIndex).trim();
					buffer = buffer.slice(newlineIndex + 1);
					if (line.length > 0) {
						yield JSON.parse(line) as InferenceStreamEvent;
					}
					newlineIndex = buffer.indexOf("\n");
				}
			}
			const remaining = buffer.trim();
			if (remaining.length > 0) {
				yield JSON.parse(remaining) as InferenceStreamEvent;
			}
		} finally {
			reader.releaseLock();
		}
	}

	private async request<T>(path: string | URL, init: RequestInit = {}): Promise<T> {
		const response = await this.requestRaw(path, init);
		if (response.status === 204) {
			return undefined as T;
		}
		return (await response.json()) as T;
	}

	private async requestRaw(path: string | URL, init: RequestInit = {}): Promise<Response> {
		return this.requestRawWithRetry(path, init, 0);
	}

	private async requestRawWithRetry(
		path: string | URL,
		init: RequestInit,
		attempt: number,
	): Promise<Response> {
		const url = typeof path === "string" ? new URL(path, this.baseUrl) : path;
		const headers = new Headers({
			Authorization: `Bearer ${this.token}`,
			"Content-Type": "application/json",
			Accept: "application/json",
		});

		if (init.headers) {
			const extra = new Headers(init.headers);
			extra.forEach((value, key) => {
				headers.set(key, value);
			});
		}

		const route = url.pathname;
		const method = (init.method ?? "GET").toUpperCase();
		const start = performance.now();
		let status: "ok" | "error" = "ok";
		let httpStatus: number | undefined;
		let errorMessage: string | undefined;

		try {
			const response = await this.fetchImpl(url, {
				...init,
				headers,
			});

			httpStatus = response.status;

			// Handle rate limiting (429) with retry logic
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
					return this.requestRawWithRetry(path, init, attempt + 1);
				}

				status = "error";
				errorMessage = `HTTP ${response.status}`;
				throw new AiOrchestratorError(
					`AI Orchestrator API error: Rate limit exceeded after ${this.maxRetries} retries`,
					429,
				);
			}

			if (!response.ok) {
				status = "error";
				errorMessage = `HTTP ${response.status}`;
				if (response.status === 401) {
					throw new AiOrchestratorError(
						"QNSP AI Orchestrator API: Authentication failed. " +
							"Verify your token is valid or get a new API key at https://cloud.qnsp.cuilabs.io/signup " +
							"Docs: https://docs.qnsp.cuilabs.io/sdk/ai-sdk",
						response.status,
					);
				}
				throw new AiOrchestratorError(
					`AI Orchestrator API error: ${response.status} ${response.statusText}`,
					response.status,
				);
			}

			return response;
		} catch (error) {
			status = "error";
			if (!errorMessage && error instanceof Error) {
				errorMessage = error.message;
			}
			throw error;
		} finally {
			if (this.telemetry) {
				const durationMs = performance.now() - start;
				this.telemetry.record({
					operation: `${method} ${route}`,
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
}

export class AiOrchestratorError extends Error {
	public readonly statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.name = "AiOrchestratorError";
		this.statusCode = statusCode;
	}
}
