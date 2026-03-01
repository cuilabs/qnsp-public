/**
 * @qnsp/browser-sdk
 *
 * Browser-compatible PQC encryption SDK for the QNSP platform.
 * Provides client-side encryption (CSE), digital signatures, and key management
 * using NIST FIPS 203/204/205 standards via @noble/post-quantum.
 *
 * No native dependencies. No node: imports. Works in browsers, Deno, Bun, and Node.js.
 *
 * Supported algorithms:
 * - ML-KEM (FIPS 203): kyber-512, kyber-768, kyber-1024 — key encapsulation
 * - ML-DSA (FIPS 204): dilithium-2, dilithium-3, dilithium-5 — digital signatures
 * - SLH-DSA (FIPS 205): 12 parameter sets — hash-based signatures
 *
 * @example
 * ```ts
 * import { initializePqcProvider, encryptBeforeUpload, decryptAfterDownload } from "@qnsp/browser-sdk";
 *
 * // Initialize the PQC provider (auto-detects runtime)
 * await initializePqcProvider();
 *
 * // Generate encryption key pair
 * const { publicKey, privateKey } = await generateEncryptionKeyPair("kyber-768");
 *
 * // Encrypt data before upload
 * const envelope = await encryptBeforeUpload(plaintext, publicKey, "kyber-768");
 *
 * // Decrypt data after download
 * const decrypted = await decryptAfterDownload(envelope, privateKey);
 * ```
 *
 * @module
 */

// Client-side encryption (CSE) helpers
export {
	type CseEnvelope,
	decryptAfterDownload,
	deserializeCseEnvelope,
	encryptBeforeUpload,
	serializeCseEnvelope,
} from "./encrypt.js";

// Re-export core types for convenience
export type { PqcAlgorithm, PqcKeyPair, PqcProvider } from "./pqc-types.js";
// Provider setup and auto-detection
export {
	detectRuntime,
	getActiveProvider,
	getSupportedAlgorithms,
	initializePqcProvider,
	isProviderInitialized,
	NOBLE_SUPPORTED_ALGORITHMS,
	type RuntimeEnvironment,
	resetProvider,
} from "./provider-setup.js";
// Digital signature helpers
export {
	generateEncryptionKeyPair,
	generateSigningKeyPair,
	type SignedEnvelope,
	signData,
	verifySignature,
} from "./sign.js";
// Telemetry hooks (opt-in, no PII)
export {
	type BrowserSdkTelemetryConfig,
	type BrowserSdkTelemetryEvent,
	configureTelemetry,
	flushTelemetry,
	getTelemetryConfig,
	isTelemetryEnabled,
	recordTelemetryEvent,
	resetTelemetry,
} from "./telemetry.js";
