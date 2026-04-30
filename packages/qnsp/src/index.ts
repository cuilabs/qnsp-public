/**
 * `@qnsp/qnsp` — official Node.js / TypeScript SDK for the
 * Quantum-Native Security Platform.
 *
 * Single package covering vault, kms, audit, auth, tenant, access,
 * billing, crypto-inventory, storage, search, and ai-orchestrator,
 * plus webhook signature verification. Mirrors the `qnsp` Python /
 * Go / Rust SDK surface byte-for-byte.
 *
 * @example
 * ```ts
 * import { QnspClient } from "@qnsp/qnsp";
 *
 * const qnsp = new QnspClient({ apiKey: process.env.QNSP_API_KEY! });
 *
 * // Vault
 * const secret = await qnsp.vault.createSecret({
 *   name: "openai-api-key",
 *   payloadB64: Buffer.from("sk-...").toString("base64"),
 *   algorithm: "ml-kem-768",
 * });
 *
 * // KMS
 * const key = await qnsp.kms.createKey({ algorithm: "ml-dsa-65", purpose: "signing" });
 * const sig = await qnsp.kms.sign(key.keyId, new TextEncoder().encode("hello"));
 *
 * // Audit
 * await qnsp.audit.logEvent({
 *   eventType: "model.inference",
 *   payload: { modelId: "gpt-4o", latencyMs: 412 },
 * });
 * ```
 *
 * Sign up for a free QNSP account at https://cloud.qnsp.cuilabs.io/auth.
 */

export {
	AccessClient,
	type AssignRoleRequest,
	type CheckPermissionRequest,
	type CreateRoleRequest,
} from "./access.js";
export {
	AiClient,
	type InferenceRequest,
	type RegisterArtifactRequest,
	type RegisterModelRequest,
	type SubmitWorkloadRequest,
} from "./ai.js";
export { AuditClient, type LogEventRequest } from "./audit.js";
export { AuthClient, type LoginRequest } from "./auth.js";
export { BillingClient, type IngestMeterRequest } from "./billing.js";
export { QnspClient, type QnspClientOptions } from "./client.js";
export { CryptoInventoryClient, type DiscoverAssetsRequest } from "./crypto-inventory.js";
export {
	QnspApiError,
	QnspAuthError,
	QnspError,
	QnspNetworkError,
	QnspWebhookError,
} from "./errors.js";
export { type CreateKeyRequest, KmsClient } from "./kms.js";
export {
	type CreateIndexRequest,
	type QueryRequest,
	SearchClient,
	type Vector,
} from "./search.js";
export { type PutObjectInput, StorageClient } from "./storage.js";
export { type CreateTenantRequest, TenantClient } from "./tenant.js";
// Service classes — exported so callers can construct mocks for testing.
export { type CreateSecretRequest, VaultClient } from "./vault.js";
export {
	MAX_WEBHOOK_SKEW_MS,
	parseQnspWebhook,
	type QnspWebhookEvent,
	verifyQnspWebhookSignature,
} from "./webhooks.js";
