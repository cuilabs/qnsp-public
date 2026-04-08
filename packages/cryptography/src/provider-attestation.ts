/**
 * Provider Attestation
 *
 * Records which PQC provider performed a cryptographic operation,
 * including version, implementation type, and cross-verification status.
 * This metadata flows into audit events for compliance evidence.
 *
 * Required by: FIPS 140-3, SOC 2 Type II, MAS TRM, NIST SP 800-208
 * - Every crypto operation must be attributable to a specific provider
 * - Government/enterprise tiers require cross-verification evidence
 *
 * @version 1.0.0
 * @lastUpdated 2026-03-12
 */

import type { PqcAlgorithm, PqcProviderMetadata } from "./provider.js";

// =============================================================================
// ATTESTATION TYPES
// =============================================================================

/**
 * Implementation type of a PQC provider.
 * Used to classify providers for cross-verification pairing.
 */
export type ProviderImplementationType =
	| "native" // Native C/Rust binding (liboqs, libjade)
	| "pure-js" // Pure JavaScript (noble)
	| "openssl" // OpenSSL provider (oqsprovider)
	| "hsm" // Hardware Security Module
	| "tee"; // Trusted Execution Environment

/**
 * Attestation record for a single cryptographic operation.
 * Captures which provider performed the operation and its verification status.
 */
export interface ProviderAttestation {
	/** Name of the primary provider that performed the operation */
	readonly providerName: string;
	/** Version of the primary provider */
	readonly providerVersion: string | null;
	/** Implementation type of the primary provider */
	readonly implementationType: ProviderImplementationType;
	/** Algorithm used for the operation */
	readonly algorithm: PqcAlgorithm;
	/** Operation type */
	readonly operation: CryptoOperationType;
	/** Timestamp of the operation (ISO 8601) */
	readonly timestamp: string;
	/** Whether the result was cross-verified by a secondary provider */
	readonly crossVerified: boolean;
	/** Name of the cross-verification provider (if cross-verified) */
	readonly crossVerificationProvider: string | null;
	/** Implementation type of the cross-verification provider */
	readonly crossVerificationImplementationType: ProviderImplementationType | null;
	/** Whether cross-verification succeeded (null if not attempted) */
	readonly crossVerificationResult: "match" | "mismatch" | null;
}

/**
 * Types of cryptographic operations that can be attested.
 */
export type CryptoOperationType =
	| "keygen"
	| "encapsulate"
	| "decapsulate"
	| "sign"
	| "verify"
	| "hash";

// =============================================================================
// PROVIDER CLASSIFICATION
// =============================================================================

/**
 * Known provider implementation types.
 * Used to automatically classify providers when creating attestations.
 */
const KNOWN_PROVIDER_TYPES: Readonly<Record<string, ProviderImplementationType>> = {
	liboqs: "native",
	noble: "pure-js",
	oqsprovider: "openssl",
	"deterministic-pqc": "pure-js",
};

/**
 * Get the implementation type for a named provider.
 * Falls back to "native" for unknown providers (conservative assumption).
 */
export function getProviderImplementationType(providerName: string): ProviderImplementationType {
	return KNOWN_PROVIDER_TYPES[providerName] ?? "native";
}

// =============================================================================
// ATTESTATION FACTORY
// =============================================================================

/**
 * Create a provider attestation record for a cryptographic operation.
 */
export function createProviderAttestation(params: {
	readonly providerName: string;
	readonly providerMetadata?: PqcProviderMetadata | undefined;
	readonly algorithm: PqcAlgorithm;
	readonly operation: CryptoOperationType;
	readonly crossVerification?:
		| {
				readonly providerName: string;
				readonly result: "match" | "mismatch";
		  }
		| undefined;
}): ProviderAttestation {
	const implementationType = getProviderImplementationType(params.providerName);
	const crossVerificationProviderType = params.crossVerification
		? getProviderImplementationType(params.crossVerification.providerName)
		: null;

	return {
		providerName: params.providerName,
		providerVersion: params.providerMetadata?.version ?? null,
		implementationType,
		algorithm: params.algorithm,
		operation: params.operation,
		timestamp: new Date().toISOString(),
		crossVerified: params.crossVerification !== undefined,
		crossVerificationProvider: params.crossVerification?.providerName ?? null,
		crossVerificationImplementationType: crossVerificationProviderType,
		crossVerificationResult: params.crossVerification?.result ?? null,
	};
}
