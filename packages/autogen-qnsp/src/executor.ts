/**
 * QNSP AutoGen Executor
 *
 * Submits code execution workloads to QNSP AI orchestrator enclaves.
 * Provides a function-executor interface compatible with AutoGen's code execution
 * pattern — without importing from autogen directly.
 *
 * All workloads run inside PQC-attested enclaves. The executor waits for
 * completion and returns structured output with the enclave attestation proof.
 */

import { AiOrchestratorClient } from "@qnsp/ai-sdk";

// ─── Activation (inline to avoid direct @qnsp/sdk-activation dep) ────────────

const ACTIVATION_PATH = "/billing/v1/sdk/activate";

interface ActivationResponse {
	readonly tenantId: string;
}

async function resolveActivationTenantId(apiKey: string, baseUrl: string): Promise<string> {
	const url = `${baseUrl.replace(/\/$/, "")}${ACTIVATION_PATH}`;
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			sdkId: "autogen-qnsp",
			sdkVersion: "0.1.0",
			runtime: "node",
		}),
		signal: AbortSignal.timeout(15_000),
	});
	if (!response.ok) {
		throw new Error(
			`QNSP AutoGen: SDK activation failed (HTTP ${response.status}). Ensure your API key is valid.`,
		);
	}
	const data = (await response.json()) as ActivationResponse;
	return data.tenantId;
}

import type { SubmitWorkloadRequest, WorkloadDetail, WorkloadStatus } from "@qnsp/ai-sdk";
import { z } from "zod";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QnspExecutorConfig {
	/**
	 * QNSP API key. Get one at https://cloud.qnsp.cuilabs.io/api-keys
	 * The API key carries the tenant ID — no separate tenantId needed.
	 */
	readonly apiKey: string;
	/**
	 * Tenant ID for all workload submissions.
	 * Optional — when omitted, the tenant is resolved automatically from the API key
	 * via SDK activation. Only provide this if you need to override the resolved tenant.
	 */
	readonly tenantId?: string;
	/**
	 * Base URL for the QNSP API.
	 * Defaults to https://api.qnsp.cuilabs.io
	 */
	readonly baseUrl?: string;
	/**
	 * Container image to use for code execution workloads.
	 * Defaults to "qnsp/enclave-python-runtime:latest"
	 */
	readonly containerImage?: string;
	/**
	 * CPU allocation for each workload (fractional cores).
	 * Defaults to 1.
	 */
	readonly cpu?: number;
	/**
	 * Memory allocation in GiB for each workload.
	 * Defaults to 2.
	 */
	readonly memoryGiB?: number;
	/**
	 * GPU allocation. Defaults to 0 (CPU-only).
	 * Set > 0 to use GPU enclaves (requires enterprise tier + enclave-gpu-capacity add-on).
	 */
	readonly gpu?: number;
	/**
	 * Accelerator type when gpu > 0.
	 * Defaults to "nvidia-a100".
	 */
	readonly acceleratorType?: string;
	/**
	 * Maximum time in milliseconds to wait for a workload to complete.
	 * Defaults to 300000 (5 minutes).
	 */
	readonly pollTimeoutMs?: number;
	/**
	 * Interval in milliseconds between workload status polls.
	 * Defaults to 2000 (2 seconds).
	 */
	readonly pollIntervalMs?: number;
}

export interface ExecuteCodeRequest {
	/**
	 * The code to execute inside the enclave.
	 */
	readonly code: string;
	/**
	 * Programming language / runtime. Used to select the execution command.
	 * Defaults to "python".
	 */
	readonly language?: "python" | "bash" | "javascript";
	/**
	 * Environment variables to inject into the workload.
	 */
	readonly env?: Record<string, string>;
	/**
	 * Human-readable name for this workload (used in audit logs).
	 */
	readonly name?: string;
	/**
	 * Idempotency key — if provided, duplicate submissions with the same key
	 * return the original workload result instead of creating a new one.
	 */
	readonly idempotencyKey?: string;
}

export interface ExecuteCodeResult {
	/**
	 * The workload ID assigned by the AI orchestrator.
	 */
	readonly workloadId: string;
	/**
	 * Final workload status.
	 */
	readonly status: WorkloadStatus;
	/**
	 * Whether this result was replayed from a previous idempotent submission.
	 */
	readonly replayed: boolean;
	/**
	 * PQC attestation proof from the enclave (if available).
	 */
	readonly attestationProof: string | null;
	/**
	 * Hardware provider for the enclave (if available).
	 */
	readonly hardwareProvider: string | null;
	/**
	 * ISO timestamp when the workload was accepted.
	 */
	readonly acceptedAt: string | null;
	/**
	 * ISO timestamp when the workload completed.
	 */
	readonly completedAt: string | null;
}

// ─── Zod schema for workload security profile ─────────────────────────────────

const securityProfileSchema = z.object({
	attestationProof: z.string().nullable(),
	hardwareProvider: z.string().nullable(),
	attestationStatus: z.string().nullable(),
	controlPlaneTokenSha256: z.string().nullable(),
	pqcSignatures: z.array(z.object({ provider: z.string(), algorithm: z.string() })),
});

// ─── Terminal status set ──────────────────────────────────────────────────────

const TERMINAL_STATUSES = new Set<WorkloadStatus>(["succeeded", "failed", "canceled"]);

// ─── Language → command mapping ───────────────────────────────────────────────

const LANGUAGE_COMMANDS: Record<string, readonly string[]> = {
	python: ["python", "-c"],
	bash: ["bash", "-c"],
	javascript: ["node", "-e"],
};

// ─── QnspExecutor ─────────────────────────────────────────────────────────────

/**
 * AutoGen-compatible code executor backed by QNSP AI orchestrator enclaves.
 *
 * Submits code as a workload to the AI orchestrator, polls until completion,
 * and returns the result with PQC attestation proof.
 *
 * @example
 * ```typescript
 * import { QnspExecutor } from "@qnsp/autogen-qnsp";
 *
 * const executor = new QnspExecutor({
 *   apiKey: process.env.QNSP_API_KEY,
 *   tenantId: process.env.QNSP_TENANT_ID,
 * });
 *
 * const result = await executor.execute({
 *   code: "print('Hello from enclave')",
 *   language: "python",
 * });
 * console.log(result.status, result.attestationProof);
 * ```
 */
export class QnspExecutor {
	readonly #client: AiOrchestratorClient;
	readonly #containerImage: string;
	readonly #cpu: number;
	readonly #memoryGiB: number;
	readonly #gpu: number;
	readonly #acceleratorType: string;
	readonly #pollTimeoutMs: number;
	readonly #pollIntervalMs: number;
	readonly #apiKey: string;
	readonly #baseUrl: string;
	#resolvedTenantId: string | null;
	#activationPromise: Promise<void> | null = null;

	constructor(config: QnspExecutorConfig) {
		this.#resolvedTenantId = config.tenantId ?? null;
		this.#containerImage = config.containerImage ?? "qnsp/enclave-python-runtime:latest";
		this.#cpu = config.cpu ?? 1;
		this.#memoryGiB = config.memoryGiB ?? 2;
		this.#gpu = config.gpu ?? 0;
		this.#acceleratorType = config.acceleratorType ?? "nvidia-a100";
		this.#pollTimeoutMs = config.pollTimeoutMs ?? 300_000;
		this.#pollIntervalMs = config.pollIntervalMs ?? 2_000;
		this.#apiKey = config.apiKey;
		this.#baseUrl = config.baseUrl ?? "https://api.qnsp.cuilabs.io";

		this.#client = new AiOrchestratorClient({
			apiKey: config.apiKey,
			baseUrl: this.#baseUrl,
			maxRetries: 3,
			retryDelayMs: 1_000,
		});
	}

	/**
	 * Resolve the effective tenant ID — either from config or via SDK activation.
	 * Caches the result after the first call.
	 */
	async #ensureTenantId(): Promise<string> {
		if (this.#resolvedTenantId) {
			return this.#resolvedTenantId;
		}
		if (!this.#activationPromise) {
			this.#activationPromise = resolveActivationTenantId(this.#apiKey, this.#baseUrl).then(
				(tenantId) => {
					this.#resolvedTenantId = tenantId;
				},
			);
		}
		await this.#activationPromise;
		if (!this.#resolvedTenantId) {
			throw new Error(
				"QNSP AutoGen: tenantId could not be resolved. Ensure your API key is valid.",
			);
		}
		return this.#resolvedTenantId;
	}

	/**
	 * Execute code inside a QNSP enclave and wait for the result.
	 *
	 * The code is submitted as a workload to the AI orchestrator. The executor
	 * polls until the workload reaches a terminal state (succeeded/failed/canceled)
	 * or the poll timeout is exceeded.
	 */
	async execute(request: ExecuteCodeRequest): Promise<ExecuteCodeResult> {
		const language = request.language ?? "python";
		const command = LANGUAGE_COMMANDS[language];
		if (!command) {
			throw new Error(`Unsupported language: ${language}. Supported: python, bash, javascript`);
		}

		const workloadName = request.name ?? `autogen-${language}-${Date.now()}`;
		const issuedAt = new Date().toISOString();
		const tenantId = await this.#ensureTenantId();

		const workloadRequest: SubmitWorkloadRequest = {
			tenantId,
			name: workloadName,
			priority: "normal",
			schedulingPolicy: this.#gpu > 0 ? "on-demand" : "spot",
			containerImage: this.#containerImage,
			command: [...command, request.code],
			env: request.env ?? {},
			resources: {
				cpu: this.#cpu,
				memoryGiB: this.#memoryGiB,
				gpu: this.#gpu,
				acceleratorType: this.#acceleratorType,
			},
			artifacts: [],
			manifest: {
				pqcSignature: "",
				algorithm: "none",
				issuedAt,
				language,
				executor: "autogen-qnsp",
			},
			labels: {
				"qnsp.io/executor": "autogen-qnsp",
				"qnsp.io/language": language,
			},
			...(request.idempotencyKey !== undefined ? { idempotencyKey: request.idempotencyKey } : {}),
		};

		const submitted = await this.#client.submitWorkload(workloadRequest);

		// If already in a terminal state (e.g. replayed idempotent result), return immediately
		if (TERMINAL_STATUSES.has(submitted.status)) {
			return {
				workloadId: submitted.workloadId,
				status: submitted.status,
				replayed: submitted.replayed,
				attestationProof: null,
				hardwareProvider: null,
				acceptedAt: submitted.acceptedAt,
				completedAt: null,
			};
		}

		// Poll until terminal state or timeout
		const detail = await this.#pollUntilComplete(submitted.workloadId);
		const security = securityProfileSchema.safeParse(detail.security);

		return {
			workloadId: detail.id,
			status: detail.status,
			replayed: submitted.replayed,
			attestationProof: security.success ? security.data.attestationProof : null,
			hardwareProvider: security.success ? security.data.hardwareProvider : null,
			acceptedAt: detail.acceptedAt,
			completedAt: detail.completedAt,
		};
	}

	/**
	 * Poll a workload until it reaches a terminal state or the timeout is exceeded.
	 */
	async #pollUntilComplete(workloadId: string): Promise<WorkloadDetail> {
		const deadline = Date.now() + this.#pollTimeoutMs;

		while (Date.now() < deadline) {
			const detail = await this.#client.getWorkload(workloadId);

			if (TERMINAL_STATUSES.has(detail.status)) {
				return detail;
			}

			const remaining = deadline - Date.now();
			const delay = Math.min(this.#pollIntervalMs, remaining);
			if (delay > 0) {
				await new Promise<void>((resolve) => setTimeout(resolve, delay));
			}
		}

		throw new Error(
			`Workload ${workloadId} did not complete within ${this.#pollTimeoutMs}ms poll timeout`,
		);
	}
}
