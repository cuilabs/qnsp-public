function asString(value: unknown): string | null {
	return typeof value === "string" && value.length > 0 ? value : null;
}

function asStringArray(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
	}
	if (typeof value === "string" && value.length > 0) {
		return [value];
	}
	return [];
}

export interface ParsedAuthJwtClaims {
	readonly subjectId: string | null;
	readonly identityId: string | null;
	readonly userId: string | null;
	readonly tenantId: string | null;
	readonly roles: string[];
	readonly email: string | null;
	readonly audiences: string[];
	readonly issuer: string | null;
	readonly tokenId: string | null;
	readonly issuedAt: number | null;
	readonly expiresAt: number | null;
	readonly tenantPlan: string | null;
}

/**
 * Parse QNSP auth JWT claims across the migration window.
 *
 * Legacy tokens:
 * - `sub` = tenant-scoped `auth_users.id`
 * - no `identity_id`
 * - no `user_id`
 *
 * New tokens:
 * - `sub` = stable `auth_identities.id`
 * - `identity_id` = stable `auth_identities.id`
 * - `user_id` = tenant-scoped `auth_users.id`
 */
export function parseAuthJwtClaims(payload: Record<string, unknown>): ParsedAuthJwtClaims {
	const subjectId = asString(payload["sub"]);
	const explicitIdentityId = asString(payload["identity_id"]);
	const explicitUserId = asString(payload["user_id"]);

	return {
		subjectId,
		identityId: explicitIdentityId ?? subjectId,
		userId: explicitUserId ?? (explicitIdentityId ? null : subjectId),
		tenantId: asString(payload["tenant_id"]),
		roles: asStringArray(payload["roles"]),
		email: asString(payload["email"]),
		audiences: asStringArray(payload["aud"]),
		issuer: asString(payload["iss"]),
		tokenId: asString(payload["jti"]),
		issuedAt: typeof payload["iat"] === "number" ? payload["iat"] : null,
		expiresAt: typeof payload["exp"] === "number" ? payload["exp"] : null,
		tenantPlan: asString(payload["tenant_plan"]),
	};
}
