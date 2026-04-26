export const SERVICE_NAMESPACE = "qnsp" as const;

export const CLASSIFICATION_LEVELS = {
	PUBLIC: "public",
	CONFIDENTIAL: "confidential",
	SECRET: "secret",
	TOP_SECRET: "top-secret",
} as const;

export type ClassificationLevel =
	(typeof CLASSIFICATION_LEVELS)[keyof typeof CLASSIFICATION_LEVELS];

export const TOKEN_AUDIENCES = {
	PLATFORM: "platform",
	INTERNAL_SERVICE: "internal-service",
	EXTERNAL_API: "external-api",
	/**
	 * Narrow audience for the Bee partner integration. Tokens with this
	 * audience can ONLY call `/partners/v1/bee/*` routes on billing-service
	 * and never reach `internal-service` audience routes. Per-action
	 * authorization is further constrained by the `roles` claim
	 * (`partner:bee:provision`, `partner:bee:deprovision`, `partner:bee:status`).
	 */
	PARTNER_BEE: "partner-bee",
} as const;

export type TokenAudience = (typeof TOKEN_AUDIENCES)[keyof typeof TOKEN_AUDIENCES];

export const DEFAULT_TOKEN_TTL_SECONDS = 60 * 15; // 15 minutes
