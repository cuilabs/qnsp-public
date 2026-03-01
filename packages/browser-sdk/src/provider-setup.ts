/**
 * Provider auto-detection and registration for browser-sdk.
 *
 * In browser environments, uses a noble-backed provider (pure JS, 18 FIPS algorithms).
 * In Node.js environments, uses the same noble-backed provider for deterministic behavior.
 *
 * @module
 */

import {
	createNobleProvider,
	createNobleProviderFactory,
	NOBLE_SUPPORTED_ALGORITHMS,
} from "./noble-provider.js";
import type { PqcAlgorithm, PqcProvider } from "./pqc-types.js";

/** Runtime environment detection result. */
export type RuntimeEnvironment = "browser" | "node" | "edge";

/**
 * Detect the current runtime environment.
 *
 * - "browser": window/document available (standard browser)
 * - "edge": no window but no process.versions.node (Cloudflare Workers, Deno Deploy, Vercel Edge)
 * - "node": process.versions.node available (Node.js, Bun with node compat)
 */
export function detectRuntime(): RuntimeEnvironment {
	if (typeof globalThis.process !== "undefined" && globalThis.process.versions?.node) {
		return "node";
	}
	// Use string-based property check to avoid needing DOM lib types
	if ("window" in globalThis && "document" in globalThis) {
		return "browser";
	}
	return "edge";
}

let initialized = false;
let activeProvider: PqcProvider | null = null;

/**
 * Initialize the PQC provider for the current runtime.
 *
 * In browser/edge: always uses noble (pure JS, no native deps).
 * In Node.js: attempts liboqs first for full 90-algorithm coverage,
 * falls back to noble if liboqs is not available.
 *
 * @param algorithms - Optional subset of algorithms to enable. Defaults to all noble-supported.
 * @returns The initialized PqcProvider instance.
 */
export async function initializePqcProvider(
	algorithms?: readonly PqcAlgorithm[],
): Promise<PqcProvider> {
	if (activeProvider) {
		return activeProvider;
	}

	const provider = createNobleProvider(algorithms ? { algorithms } : undefined);
	activeProvider = provider;
	initialized = true;
	return provider;
}

/**
 * Get the currently active PQC provider.
 * Throws if initializePqcProvider() has not been called.
 */
export function getActiveProvider(): PqcProvider {
	if (!activeProvider) {
		throw new Error("PQC provider not initialized. Call initializePqcProvider() first.");
	}
	return activeProvider;
}

/**
 * Check if the PQC provider has been initialized.
 */
export function isProviderInitialized(): boolean {
	return initialized;
}

/**
 * Reset the provider state. Primarily for testing.
 */
export function resetProvider(): void {
	activeProvider = null;
	initialized = false;
}

/**
 * Get the list of algorithms supported in the current environment.
 * In browser/edge: noble's 18 FIPS algorithms.
 * In Node.js: noble's 18 FIPS algorithms.
 */
export function getSupportedAlgorithms(): readonly PqcAlgorithm[] {
	return NOBLE_SUPPORTED_ALGORITHMS;
}

export { NOBLE_SUPPORTED_ALGORITHMS, createNobleProviderFactory };
