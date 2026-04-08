/**
 * API Key Authentication Utilities
 *
 * API keys are validated at the edge-gateway and forwarded to backend services
 * with validation metadata in headers. Backend services trust these headers
 * since they come from the authenticated edge-gateway.
 *
 * Flow:
 * 1. Client sends API key → Edge Gateway
 * 2. Edge Gateway validates API key with auth-service
 * 3. Edge Gateway forwards request with API key + metadata headers
 * 4. Backend service extracts metadata and meters usage
 */

export interface ApiKeyContext {
	readonly tokenId: string;
	readonly userId: string;
	readonly tenantId: string;
	readonly scopes: readonly string[];
	readonly isApiKey: boolean;
}

/**
 * Extract API key context from request headers.
 * Returns null if no API key headers are present.
 *
 * Headers set by edge-gateway after validation:
 * - x-qnsp-api-key-id: Token ID for metering
 * - x-qnsp-api-key-user: User ID who created the key
 * - x-qnsp-api-key-scopes: Comma-separated scopes
 * - x-qnsp-tenant: Tenant ID (standard header)
 */
export function extractApiKeyContext(
	headers: Record<string, string | string[] | undefined>,
): ApiKeyContext | null {
	const tokenId = getHeader(headers, "x-qnsp-api-key-id");
	const userId = getHeader(headers, "x-qnsp-api-key-user");
	const scopesRaw = getHeader(headers, "x-qnsp-api-key-scopes");
	const tenantId = getHeader(headers, "x-qnsp-tenant");

	// If any API key header is present, all must be present
	if (tokenId || userId || scopesRaw) {
		if (!tokenId || !userId || !tenantId) {
			throw new Error("Incomplete API key headers from edge-gateway");
		}

		const scopes = scopesRaw ? scopesRaw.split(",").filter((s) => s.length > 0) : [];

		return {
			tokenId,
			userId,
			tenantId,
			scopes,
			isApiKey: true,
		};
	}

	return null;
}

/**
 * Check if a request is authenticated with an API key.
 * Returns true if API key headers are present.
 */
export function isApiKeyRequest(headers: Record<string, string | string[] | undefined>): boolean {
	return getHeader(headers, "x-qnsp-api-key-id") !== null;
}

/**
 * Verify API key has required scope.
 * Throws error if scope is missing.
 */
export function requireApiKeyScope(context: ApiKeyContext, requiredScope: string): void {
	if (!context.scopes.includes(requiredScope)) {
		throw new Error(`API key missing required scope: ${requiredScope}`);
	}
}

/**
 * Verify API key has at least one of the required scopes.
 * Throws error if none of the scopes are present.
 */
export function requireApiKeyScopeAny(context: ApiKeyContext, requiredScopes: string[]): void {
	const hasScope = requiredScopes.some((scope) => context.scopes.includes(scope));
	if (!hasScope) {
		throw new Error(`API key missing required scopes: ${requiredScopes.join(", ")}`);
	}
}

function getHeader(
	headers: Record<string, string | string[] | undefined>,
	name: string,
): string | null {
	const value = headers[name] ?? headers[name.toLowerCase()];
	if (typeof value === "string" && value.length > 0) {
		return value;
	}
	if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
		return value[0];
	}
	return null;
}
