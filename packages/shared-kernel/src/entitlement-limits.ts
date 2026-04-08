import { z } from "zod";

export type CryptoPolicyTier = "default" | "strict" | "maximum" | "government";

const limitNumberSchema = z
	.union([z.number(), z.null()])
	.transform((value) => {
		if (value === null) {
			return -1;
		}
		if (value === Number.POSITIVE_INFINITY) {
			return -1;
		}
		if (value === Number.NEGATIVE_INFINITY) {
			return -1;
		}
		return value;
	})
	.refine((value) => typeof value === "number" && Number.isFinite(value), {
		message: "Limit must be a finite number after normalization",
	});

export const EntitlementLimitsSchema = z
	.object({
		storageGB: limitNumberSchema,
		apiCalls: limitNumberSchema,
		enclavesEnabled: z.boolean(),
		aiTrainingEnabled: z.boolean(),
		aiInferenceEnabled: z.boolean(),
		sseEnabled: z.boolean(),
		vaultEnabled: z.boolean(),
		vaultSecretsCount: limitNumberSchema,
		vaultSecretVersionsCount: limitNumberSchema,
		kmsKeysCount: limitNumberSchema,
		kmsOpsPerMonth: limitNumberSchema,
		apiKeysCount: limitNumberSchema,
		cryptoPolicyTier: z.enum(["default", "strict", "maximum", "government"] as const),
	})
	.strict();

export type EntitlementLimits = z.infer<typeof EntitlementLimitsSchema>;

export function parseEntitlementLimits(value: unknown): EntitlementLimits | null {
	const parsed = EntitlementLimitsSchema.safeParse(value);
	return parsed.success ? parsed.data : null;
}

export function isUnlimitedLimit(value: number): boolean {
	return value < 0;
}
