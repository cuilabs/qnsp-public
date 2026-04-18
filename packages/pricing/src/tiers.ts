/**
 * Shared Pricing Tier Definitions
 *
 * This is the single source of truth for tier limits and pricing across the QNSP platform.
 * All services should import from this package instead of duplicating these definitions.
 */

export type PricingTier =
	| "free"
	| "dev-starter"
	| "dev-pro"
	| "dev-elite"
	| "dev-team"
	| "business-team"
	| "business-advanced"
	| "business-elite"
	| "enterprise-standard"
	| "enterprise-pro"
	| "enterprise-elite"
	| "specialized";

export type CryptoPolicyTier = "default" | "strict" | "maximum" | "government";

export interface TierLimits {
	readonly storageGB: number;
	readonly apiCalls: number;
	readonly enclavesEnabled: boolean;
	readonly aiTrainingEnabled: boolean;
	readonly aiInferenceEnabled: boolean;
	readonly sseEnabled: boolean;
	readonly vaultEnabled: boolean;
	readonly vaultSecretsCount: number;
	readonly vaultSecretVersionsCount: number;
	readonly kmsKeysCount: number;
	readonly kmsOpsPerMonth: number;
	readonly apiKeysCount: number;
	readonly cryptoPolicyTier: CryptoPolicyTier;
}

export interface TierPricing {
	readonly monthlyPriceCents: number;
	readonly yearlyPriceCents?: number;
	readonly limits: TierLimits;
	readonly name: string;
	readonly description: string;
}

export type BillingCycle = "monthly" | "yearly";

export const YEARLY_DISCOUNT_PERCENT = 0;

export function getTierPriceCents(tier: TierPricing, billingCycle: BillingCycle): number {
	if (billingCycle === "yearly") {
		if (typeof tier.yearlyPriceCents === "number") {
			return tier.yearlyPriceCents;
		}
		return Math.round((tier.monthlyPriceCents * 12 * (100 - YEARLY_DISCOUNT_PERCENT)) / 100);
	}
	return tier.monthlyPriceCents;
}

export const TIER_PRICING: Record<PricingTier, TierPricing> = {
	free: {
		monthlyPriceCents: 0,
		name: "FREE",
		description: "Free-forever evaluation tier — PQC key operations, vault, and storage",
		limits: {
			storageGB: 10,
			apiCalls: 50_000,
			enclavesEnabled: false,
			aiTrainingEnabled: false,
			aiInferenceEnabled: false,
			sseEnabled: false,
			vaultEnabled: true,
			vaultSecretsCount: 25,
			vaultSecretVersionsCount: 25,
			kmsKeysCount: 20,
			kmsOpsPerMonth: 20_000,
			apiKeysCount: 3,
			cryptoPolicyTier: "default",
		},
	},
	"dev-starter": {
		monthlyPriceCents: 14_900,
		yearlyPriceCents: 169_900,
		name: "DEV STARTER",
		description: "First paid commitment — build something real with PQC",
		limits: {
			storageGB: 100,
			apiCalls: 100_000,
			enclavesEnabled: false,
			aiTrainingEnabled: false,
			aiInferenceEnabled: false,
			sseEnabled: false,
			vaultEnabled: true,
			vaultSecretsCount: 75,
			vaultSecretVersionsCount: 75,
			kmsKeysCount: 30,
			kmsOpsPerMonth: 50_000,
			apiKeysCount: 5,
			cryptoPolicyTier: "default",
		},
	},
	"dev-pro": {
		monthlyPriceCents: 59_000,
		yearlyPriceCents: 672_600,
		name: "DEV PRO",
		description: "Production PQC stack — keys, vault, SSE, and AI inference",
		limits: {
			storageGB: 250,
			apiCalls: 500_000,
			enclavesEnabled: false,
			aiTrainingEnabled: false,
			aiInferenceEnabled: true,
			sseEnabled: true,
			vaultEnabled: true,
			vaultSecretsCount: 150,
			vaultSecretVersionsCount: 300,
			kmsKeysCount: 75,
			kmsOpsPerMonth: 100_000,
			apiKeysCount: 15,
			cryptoPolicyTier: "default",
		},
	},
	"dev-elite": {
		monthlyPriceCents: 79_000,
		yearlyPriceCents: 881_500,
		name: "DEV ELITE",
		description: "Compliance-ready development — CBOM and 90-day audit retention",
		limits: {
			storageGB: 500,
			apiCalls: 750_000,
			enclavesEnabled: false,
			aiTrainingEnabled: false,
			aiInferenceEnabled: true,
			sseEnabled: true,
			vaultEnabled: true,
			vaultSecretsCount: 500,
			vaultSecretVersionsCount: 500,
			kmsKeysCount: 125,
			kmsOpsPerMonth: 200_000,
			apiKeysCount: 25,
			cryptoPolicyTier: "default",
		},
	},
	"dev-team": {
		monthlyPriceCents: 149_900,
		yearlyPriceCents: 1_671_900,
		name: "DEV TEAM",
		description: "Startup bridge — CBOM included, compliance visibility for growing teams",
		limits: {
			storageGB: 1_000,
			apiCalls: 1_000_000,
			enclavesEnabled: false,
			aiTrainingEnabled: false,
			aiInferenceEnabled: true,
			sseEnabled: true,
			vaultEnabled: true,
			vaultSecretsCount: 600,
			vaultSecretVersionsCount: 1_500,
			kmsKeysCount: 200,
			kmsOpsPerMonth: 350_000,
			apiKeysCount: 35,
			cryptoPolicyTier: "default",
		},
	},
	"business-team": {
		monthlyPriceCents: 219_900,
		yearlyPriceCents: 2_427_700,
		name: "BUSINESS TEAM",
		description: "Production-grade team tier with compliance reporting and crypto policy UI",
		limits: {
			storageGB: 5_000,
			apiCalls: 1_500_000,
			enclavesEnabled: false,
			aiTrainingEnabled: false,
			aiInferenceEnabled: true,
			sseEnabled: true,
			vaultEnabled: true,
			vaultSecretsCount: 1_000,
			vaultSecretVersionsCount: 3_000,
			kmsKeysCount: 300,
			kmsOpsPerMonth: 500_000,
			apiKeysCount: 50,
			cryptoPolicyTier: "default",
		},
	},
	"business-advanced": {
		monthlyPriceCents: 549_900,
		yearlyPriceCents: 5_938_900,
		name: "BUSINESS ADVANCED",
		description: "Strict crypto policy — regulated workloads with compliance evidence",
		limits: {
			storageGB: 10_000,
			apiCalls: 7_500_000,
			enclavesEnabled: false,
			aiTrainingEnabled: false,
			aiInferenceEnabled: true,
			sseEnabled: true,
			vaultEnabled: true,
			vaultSecretsCount: 2_000,
			vaultSecretVersionsCount: 7_500,
			kmsKeysCount: 600,
			kmsOpsPerMonth: 750_000,
			apiKeysCount: 100,
			cryptoPolicyTier: "strict",
		},
	},
	"business-elite": {
		monthlyPriceCents: 849_900,
		yearlyPriceCents: 9_178_900,
		name: "BUSINESS ELITE",
		description: "Full compliance evidence — everything short of enclaves",
		limits: {
			storageGB: 15_000,
			apiCalls: 10_000_000,
			enclavesEnabled: false,
			aiTrainingEnabled: false,
			aiInferenceEnabled: true,
			sseEnabled: true,
			vaultEnabled: true,
			vaultSecretsCount: 4_000,
			vaultSecretVersionsCount: 15_000,
			kmsKeysCount: 1_000,
			kmsOpsPerMonth: 1_500_000,
			apiKeysCount: 200,
			cryptoPolicyTier: "strict",
		},
	},
	"enterprise-standard": {
		monthlyPriceCents: 1_299_900,
		yearlyPriceCents: 13_726_900,
		name: "ENTERPRISE STANDARD",
		description: "Enclave-secured AI inference with maximum crypto policy",
		limits: {
			storageGB: 20_000,
			apiCalls: 15_000_000,
			enclavesEnabled: true,
			aiTrainingEnabled: false,
			aiInferenceEnabled: true,
			sseEnabled: true,
			vaultEnabled: true,
			vaultSecretsCount: 8_000,
			vaultSecretVersionsCount: 30_000,
			kmsKeysCount: 2_000,
			kmsOpsPerMonth: 7_500_000,
			apiKeysCount: 500,
			cryptoPolicyTier: "maximum",
		},
	},
	"enterprise-pro": {
		monthlyPriceCents: 2_499_900,
		yearlyPriceCents: 25_499_000,
		name: "ENTERPRISE PRO",
		description: "Full AI security — training, fine-tuning, inference, all PQC-attested",
		limits: {
			storageGB: 25_000,
			apiCalls: 30_000_000,
			enclavesEnabled: true,
			aiTrainingEnabled: true,
			aiInferenceEnabled: true,
			sseEnabled: true,
			vaultEnabled: true,
			vaultSecretsCount: 20_000,
			vaultSecretVersionsCount: 100_000,
			kmsKeysCount: 5_000,
			kmsOpsPerMonth: 30_000_000,
			apiKeysCount: 1_000,
			cryptoPolicyTier: "maximum",
		},
	},
	"enterprise-elite": {
		monthlyPriceCents: 0,
		name: "ENTERPRISE ELITE",
		description: "Fortune 200 & mission-critical — government policy, HSM, unlimited scale",
		limits: {
			storageGB: -1,
			apiCalls: -1,
			enclavesEnabled: true,
			aiTrainingEnabled: true,
			aiInferenceEnabled: true,
			sseEnabled: true,
			vaultEnabled: true,
			vaultSecretsCount: -1,
			vaultSecretVersionsCount: -1,
			kmsKeysCount: -1,
			kmsOpsPerMonth: -1,
			apiKeysCount: -1,
			cryptoPolicyTier: "government",
		},
	},
	specialized: {
		monthlyPriceCents: 0,
		name: "SPECIALIZED",
		description:
			"Government / Public Service / Nuclear / Bio (Chemical) & Quantum Labs / Space Agencies, & Defence (Military)",
		limits: {
			storageGB: -1,
			apiCalls: -1,
			enclavesEnabled: true,
			aiTrainingEnabled: true,
			aiInferenceEnabled: true,
			sseEnabled: true,
			vaultEnabled: true,
			vaultSecretsCount: -1,
			vaultSecretVersionsCount: -1,
			kmsKeysCount: -1,
			kmsOpsPerMonth: -1,
			apiKeysCount: -1,
			cryptoPolicyTier: "government",
		},
	},
};

export const TIER_ORDER: readonly PricingTier[] = [
	"free",
	"dev-starter",
	"dev-pro",
	"dev-elite",
	"dev-team",
	"business-team",
	"business-advanced",
	"business-elite",
	"enterprise-standard",
	"enterprise-pro",
	"enterprise-elite",
	"specialized",
] as const;

export function isValidTier(tier: string): tier is PricingTier {
	return TIER_ORDER.includes(tier as PricingTier);
}

export function compareTiers(a: PricingTier, b: PricingTier): number {
	return TIER_ORDER.indexOf(a) - TIER_ORDER.indexOf(b);
}

export function isUnlimitedValue(value: number): boolean {
	return value === -1 || value === Number.POSITIVE_INFINITY;
}

export function formatLimitValue(value: number): string {
	if (isUnlimitedValue(value)) return "Unlimited";
	return value.toLocaleString();
}

export function computeTierFlagKeys(planTier: PricingTier, limits: TierLimits): string[] {
	const featureFlags: string[] = [];
	if (limits.enclavesEnabled) featureFlags.push("enclaves.enabled");
	if (limits.aiTrainingEnabled) featureFlags.push("ai.training.enabled");
	if (limits.aiInferenceEnabled) featureFlags.push("ai.inference.enabled");
	if (limits.sseEnabled) featureFlags.push("sse.enabled");
	if (limits.vaultEnabled) featureFlags.push("vault.enabled");
	if (planTier.startsWith("enterprise-") || planTier === "specialized") {
		featureFlags.push("compliance.enabled");
		featureFlags.push("audit.advanced.enabled");
		featureFlags.push("multi-region.enabled");
	}
	if (
		planTier === "business-advanced" ||
		planTier === "business-elite" ||
		planTier.startsWith("enterprise-") ||
		planTier === "specialized"
	) {
		featureFlags.push("ai.intelligence.automation.enabled");
	}
	if (
		planTier === "business-team" ||
		planTier === "business-advanced" ||
		planTier === "business-elite" ||
		planTier.startsWith("enterprise-") ||
		planTier === "specialized"
	) {
		featureFlags.push("nhi.identities.enabled");
	}
	if (
		planTier === "enterprise-pro" ||
		planTier === "enterprise-elite" ||
		planTier === "specialized"
	) {
		featureFlags.push("ai.training.encrypted.enabled");
		featureFlags.push("ai.fine-tuning.enabled");
		featureFlags.push("dedicated-support.enabled");
	}
	return featureFlags;
}

export function getAllTierDerivedFlagKeys(): Set<string> {
	const out = new Set<string>();
	for (const tier of TIER_ORDER) {
		const pricing = TIER_PRICING[tier];
		if (!pricing) continue;
		for (const key of computeTierFlagKeys(tier, pricing.limits)) {
			out.add(key);
		}
	}
	return out;
}
