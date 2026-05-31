/**
 * `@cuilabs/qnsp/autogen` — AutoGen function executor for QNSP.
 *
 * Submits code workloads to QNSP AI orchestrator enclaves with PQC
 * attestation. Folded in from the former standalone
 * `@cuilabs/qnsp-autogen-qnsp` package (2026-05-16).
 *
 * @example
 * ```typescript
 * import { QnspExecutor } from "@cuilabs/qnsp/autogen";
 *
 * const executor = new QnspExecutor({ apiKey: process.env.QNSP_API_KEY });
 * const result = await executor.execute({ code: "print('Hello')", language: "python" });
 * ```
 */

export type {
	ExecuteCodeRequest,
	ExecuteCodeResult,
	QnspExecutorConfig,
	SubmitWorkloadRequest,
	WorkloadDetail,
	WorkloadStatus,
} from "./executor.js";
export { QnspExecutor } from "./executor.js";
