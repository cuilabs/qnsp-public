/**
 * @qnsp/autogen-qnsp
 *
 * AutoGen function executor for QNSP — submits code workloads to QNSP AI orchestrator
 * enclaves with PQC attestation.
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
 * ```
 */

export type {
	ExecuteCodeRequest,
	ExecuteCodeResult,
	QnspExecutorConfig,
} from "./executor.js";
export { QnspExecutor } from "./executor.js";
