import { z } from "zod";

import { TOKEN_AUDIENCES, type TokenAudience } from "./constants.js";

export const authSubjectSchema = z.object({
	id: z.string().uuid(),
	identityId: z.string().uuid().optional(),
	userId: z.string().uuid().optional(),
	email: z.string().email().optional(),
	tenantId: z.string().optional(),
	roles: z.array(z.string()).default([]),
	tenantPlan: z.string().optional(),
});

export type AuthSubject = z.infer<typeof authSubjectSchema>;

export const accessTokenSchema = z.object({
	tokenId: z.string().uuid(),
	subject: authSubjectSchema,
	issuedAt: z.number().int(),
	expiresAt: z.number().int(),
	audience: z.nativeEnum(TOKEN_AUDIENCES),
});

export type AccessToken = z.infer<typeof accessTokenSchema>;

const tenantBoundAuthSubjectSchema = authSubjectSchema.extend({
	tenantId: z.string(),
});

export const refreshTokenMetadataSchema = z.object({
	tokenId: z.string().uuid(),
	subject: tenantBoundAuthSubjectSchema,
	issuedAt: z.number().int(),
	expiresAt: z.number().int(),
	audience: z.nativeEnum(TOKEN_AUDIENCES),
});

export type RefreshTokenMetadata = z.infer<typeof refreshTokenMetadataSchema>;

export interface CreateAccessTokenOptions {
	readonly subject: AuthSubject;
	readonly ttlSeconds?: number;
	readonly audience?: TokenAudience;
}

export interface CreateRefreshTokenOptions {
	readonly subject: AuthSubject;
	readonly ttlSeconds?: number;
	readonly audience?: TokenAudience;
}

export function createAuthSubject(input: z.input<typeof authSubjectSchema>): AuthSubject {
	return authSubjectSchema.parse(input);
}
