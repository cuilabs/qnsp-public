/**
 * @qnsp/langchain-qnsp
 *
 * LangChain tools for QNSP — governed agents with PQC-encrypted secrets,
 * quantum-safe signing, and immutable audit trails.
 *
 * @example
 * ```typescript
 * import { QnspToolkit } from "@qnsp/langchain-qnsp";
 *
 * const toolkit = new QnspToolkit({ apiKey: process.env.QNSP_API_KEY });
 * const tools = toolkit.getTools();
 * ```
 */

export type { QnspToolkitConfig } from "./toolkit.js";
// Toolkit (recommended entry point)
export { QnspToolkit } from "./toolkit.js";
export type { QnspAuditToolConfig } from "./tools/audit.js";
// Individual audit tools
export { QnspLogAgentActionTool } from "./tools/audit.js";
export type { QnspKmsToolConfig } from "./tools/kms.js";
// Individual KMS tools
export { QnspSignDataTool, QnspVerifySignatureTool } from "./tools/kms.js";
// Individual vault tools
export { QnspReadSecretTool, QnspRotateSecretTool, QnspWriteSecretTool } from "./tools/vault.js";
