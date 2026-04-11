/**
 * Tier Limits - Shared across all SDKs
 *
 * Defines what features are available at each pricing tier.
 * SDKs use this to fail fast with clear error messages before making API calls.
 */

import {
	type PricingTier as BillingPricingTier,
	type TierLimits as BillingTierLimits,
	TIER_PRICING,
} from "@qnsp/pricing";

export type PricingTier = BillingPricingTier | "platform";

export type TierLimits = Pick<
	BillingTierLimits,
	| "storageGB"
	| "apiCalls"
	| "enclavesEnabled"
	| "aiTrainingEnabled"
	| "aiInferenceEnabled"
	| "sseEnabled"
	| "vaultEnabled"
>;

function toSdkTierLimits(limits: BillingTierLimits): TierLimits {
	return {
		storageGB: limits.storageGB,
		apiCalls: limits.apiCalls,
		enclavesEnabled: limits.enclavesEnabled,
		aiTrainingEnabled: limits.aiTrainingEnabled,
		aiInferenceEnabled: limits.aiInferenceEnabled,
		sseEnabled: limits.sseEnabled,
		vaultEnabled: limits.vaultEnabled,
	};
}

const BILLING_TIER_LIMITS = Object.fromEntries(
	Object.entries(TIER_PRICING).map(([tier, pricing]) => [tier, toSdkTierLimits(pricing.limits)]),
) as Record<BillingPricingTier, TierLimits>;

/**
 * Internal QNSP platform tier — for QNSP staff, ops admins, and super admins only.
 * Never exposed to customers. Superset of enterprise-elite + specialized.
 */
const PLATFORM_TIER_LIMITS: TierLimits = {
	storageGB: -1,
	apiCalls: -1,
	enclavesEnabled: true,
	aiTrainingEnabled: true,
	aiInferenceEnabled: true,
	sseEnabled: true,
	vaultEnabled: true,
};

export const TIER_LIMITS: Record<PricingTier, TierLimits> = {
	...BILLING_TIER_LIMITS,
	platform: PLATFORM_TIER_LIMITS,
};

export type FeatureName =
	| "storage"
	| "search"
	| "ai-inference"
	| "ai-training"
	| "enclaves"
	| "vault"
	| "sse";

export interface FeatureRequirement {
	readonly feature: FeatureName;
	readonly minimumTier: PricingTier;
	readonly description: string;
}

export const FEATURE_REQUIREMENTS: Record<FeatureName, FeatureRequirement> = {
	storage: {
		feature: "storage",
		minimumTier: "free",
		description: "Quantum-secure storage",
	},
	search: {
		feature: "search",
		minimumTier: "free",
		description: "Full-text and vector search",
	},
	"ai-inference": {
		feature: "ai-inference",
		minimumTier: "dev-pro",
		description: "AI inference (non-enclave)",
	},
	"ai-training": {
		feature: "ai-training",
		minimumTier: "enterprise-pro",
		description: "Encrypted AI training and fine-tuning",
	},
	enclaves: {
		feature: "enclaves",
		minimumTier: "enterprise-standard",
		description: "Secure enclave execution",
	},
	vault: {
		feature: "vault",
		minimumTier: "free",
		description: "Secrets management with envelope encryption",
	},
	sse: {
		feature: "sse",
		minimumTier: "dev-pro",
		description: "Server-side encryption for search",
	},
};

export class TierError extends Error {
	constructor(
		public readonly feature: FeatureName,
		public readonly currentTier: PricingTier,
		public readonly requiredTier: PricingTier,
	) {
		super(
			`Feature "${feature}" requires ${requiredTier} tier or higher. ` +
				`Current tier: ${currentTier}. ` +
				`Upgrade at https://cloud.qnsp.cuilabs.io/billing`,
		);
		this.name = "TierError";
	}
}

export function checkTierAccess(feature: FeatureName, currentTier: PricingTier): void {
	const limits = TIER_LIMITS[currentTier];
	if (!limits) {
		throw new TierError(feature, currentTier, "free");
	}

	const requirement = FEATURE_REQUIREMENTS[feature];
	let hasAccess = false;

	switch (feature) {
		case "storage":
		case "search":
			hasAccess = true; // Available on all tiers
			break;
		case "ai-inference":
			hasAccess = limits.aiInferenceEnabled;
			break;
		case "ai-training":
			hasAccess = limits.aiTrainingEnabled;
			break;
		case "enclaves":
			hasAccess = limits.enclavesEnabled;
			break;
		case "vault":
			hasAccess = limits.vaultEnabled;
			break;
		case "sse":
			hasAccess = limits.sseEnabled;
			break;
	}

	if (!hasAccess) {
		throw new TierError(feature, currentTier, requirement.minimumTier);
	}
}

export function getTierLimits(tier: PricingTier): TierLimits {
	return TIER_LIMITS[tier] ?? PLATFORM_TIER_LIMITS;
}

export function isFeatureEnabled(feature: FeatureName, tier: PricingTier): boolean {
	try {
		checkTierAccess(feature, tier);
		return true;
	} catch {
		return false;
	}
}
