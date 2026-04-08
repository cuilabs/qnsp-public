/**
 * Shared security headers plugin for Fastify-based QNSP services.
 *
 * Adds standard security headers to all responses:
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY
 * - X-XSS-Protection: 0 (modern browsers use CSP instead)
 * - Referrer-Policy: strict-origin-when-cross-origin
 * - X-Permitted-Cross-Domain-Policies: none
 * - X-Download-Options: noopen
 * - Cache-Control: no-store (for non-200 responses, handled separately)
 *
 * Edge-gateway uses @fastify/helmet for full HSTS + CSP coverage.
 * Backend services use this lightweight plugin for defense-in-depth.
 */

type ReplyLike = {
	header: (name: string, value: string) => void;
};

type RequestLike = {
	url?: string;
};

type HookHandler = (request: RequestLike, reply: ReplyLike, done: () => void) => void;

type ServerLike = {
	addHook: (hookName: string, handler: HookHandler) => void;
};

export interface SecurityHeadersOptions {
	/** Override X-Frame-Options value. Default: "DENY" */
	readonly frameOptions?: "DENY" | "SAMEORIGIN";
	/** Override Referrer-Policy. Default: "strict-origin-when-cross-origin" */
	readonly referrerPolicy?: string;
	/** Paths to exclude from security headers (e.g., health endpoints). Default: none */
	readonly excludePaths?: readonly string[];
}

/**
 * Enhanced security headers options extending the base options.
 * Adds HSTS, CSP, Permissions-Policy, and Cache-Control support.
 */
export interface EnhancedSecurityHeadersOptions extends SecurityHeadersOptions {
	/** HSTS configuration. Recommended for all public-facing services. */
	readonly hsts?: {
		/** max-age in seconds. Default: 31536000 (1 year) */
		readonly maxAge?: number;
		/** Include subdomains. Default: true */
		readonly includeSubDomains?: boolean;
		/** Add preload directive. Default: false */
		readonly preload?: boolean;
	};
	/** Content-Security-Policy directive string. Optional. */
	readonly csp?: string;
	/** Permissions-Policy directive string. Default: camera=(), microphone=(), geolocation=(), payment=() */
	readonly permissionsPolicy?: string;
	/** Cache-Control header value for API responses. Default: "no-store" */
	readonly cacheControl?: string;
}

/** Default Permissions-Policy for all services */
export const DEFAULT_PERMISSIONS_POLICY = "camera=(), microphone=(), geolocation=(), payment=()";

/** Default CSP for the cloud portal */
export const CLOUD_PORTAL_CSP =
	"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

/**
 * Install security headers on all responses for a Fastify server.
 * This is a lightweight alternative to @fastify/helmet for internal services.
 */
export function installSecurityHeaders(
	server: ServerLike,
	options: SecurityHeadersOptions = {},
): void {
	const frameOptions = options.frameOptions ?? "DENY";
	const referrerPolicy = options.referrerPolicy ?? "strict-origin-when-cross-origin";
	const excludePaths = new Set(options.excludePaths ?? []);

	server.addHook("onRequest", (request: RequestLike, reply: ReplyLike, done: () => void) => {
		const url = request.url;
		const path = url?.split("?")[0] ?? "";
		if (excludePaths.size > 0 && excludePaths.has(path)) {
			done();
			return;
		}

		reply.header("x-content-type-options", "nosniff");
		reply.header("x-frame-options", frameOptions);
		reply.header("x-xss-protection", "0");
		reply.header("referrer-policy", referrerPolicy);
		reply.header("x-permitted-cross-domain-policies", "none");
		reply.header("x-download-options", "noopen");
		done();
	});
}

/**
 * Install enhanced security headers including HSTS, Permissions-Policy,
 * optional CSP, and Cache-Control. Backward-compatible with installSecurityHeaders.
 */
export function installEnhancedSecurityHeaders(
	server: ServerLike,
	options: EnhancedSecurityHeadersOptions = {},
): void {
	const frameOptions = options.frameOptions ?? "DENY";
	const referrerPolicy = options.referrerPolicy ?? "strict-origin-when-cross-origin";
	const excludePaths = new Set(options.excludePaths ?? []);
	const permissionsPolicy = options.permissionsPolicy ?? DEFAULT_PERMISSIONS_POLICY;
	const cacheControl = options.cacheControl ?? "no-store";

	let hstsValue: string | null = null;
	if (options.hsts !== undefined) {
		const maxAge = options.hsts.maxAge ?? 31_536_000;
		const includeSubDomains = options.hsts.includeSubDomains ?? true;
		const preload = options.hsts.preload ?? false;
		hstsValue = `max-age=${maxAge}${includeSubDomains ? "; includeSubDomains" : ""}${preload ? "; preload" : ""}`;
	}

	server.addHook("onRequest", (request: RequestLike, reply: ReplyLike, done: () => void) => {
		const url = request.url;
		const path = url?.split("?")[0] ?? "";
		if (excludePaths.size > 0 && excludePaths.has(path)) {
			done();
			return;
		}

		reply.header("x-content-type-options", "nosniff");
		reply.header("x-frame-options", frameOptions);
		reply.header("x-xss-protection", "0");
		reply.header("referrer-policy", referrerPolicy);
		reply.header("x-permitted-cross-domain-policies", "none");
		reply.header("x-download-options", "noopen");
		reply.header("permissions-policy", permissionsPolicy);
		reply.header("cache-control", cacheControl);

		if (hstsValue) {
			reply.header("strict-transport-security", hstsValue);
		}
		if (options.csp) {
			reply.header("content-security-policy", options.csp);
		}

		done();
	});
}
