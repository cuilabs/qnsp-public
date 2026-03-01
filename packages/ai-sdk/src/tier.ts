export type PricingTier =
	| "free"
	| "dev-starter"
	| "dev-pro"
	| "dev-elite"
	| "business-team"
	| "business-advanced"
	| "business-elite"
	| "enterprise-standard"
	| "enterprise-pro"
	| "enterprise-elite"
	| "specialized";

export interface TierLimits {
	readonly storageGB: number;
	readonly apiCalls: number;
	readonly enclavesEnabled: boolean;
	readonly aiTrainingEnabled: boolean;
	readonly aiInferenceEnabled: boolean;
	readonly sseEnabled: boolean;
	readonly vaultEnabled: boolean;
}

export const TIER_LIMITS: Record<PricingTier, TierLimits> = {
	free: {
		storageGB: 5,
		apiCalls: 2_000,
		enclavesEnabled: false,
		aiTrainingEnabled: false,
		aiInferenceEnabled: false,
		sseEnabled: false,
		vaultEnabled: false,
	},
	"dev-starter": {
		storageGB: 50,
		apiCalls: 50_000,
		enclavesEnabled: false,
		aiTrainingEnabled: false,
		aiInferenceEnabled: false,
		sseEnabled: false,
		vaultEnabled: false,
	},
	"dev-pro": {
		storageGB: 200,
		apiCalls: 250_000,
		enclavesEnabled: false,
		aiTrainingEnabled: false,
		aiInferenceEnabled: true,
		sseEnabled: true,
		vaultEnabled: true,
	},
	"dev-elite": {
		storageGB: 500,
		apiCalls: 500_000,
		enclavesEnabled: false,
		aiTrainingEnabled: false,
		aiInferenceEnabled: true,
		sseEnabled: true,
		vaultEnabled: true,
	},
	"business-team": {
		storageGB: 500,
		apiCalls: 1_000_000,
		enclavesEnabled: false,
		aiTrainingEnabled: false,
		aiInferenceEnabled: true,
		sseEnabled: true,
		vaultEnabled: true,
	},
	"business-advanced": {
		storageGB: 2_000,
		apiCalls: 5_000_000,
		enclavesEnabled: false,
		aiTrainingEnabled: false,
		aiInferenceEnabled: true,
		sseEnabled: true,
		vaultEnabled: true,
	},
	"business-elite": {
		storageGB: 3_500,
		apiCalls: 7_500_000,
		enclavesEnabled: false,
		aiTrainingEnabled: false,
		aiInferenceEnabled: true,
		sseEnabled: true,
		vaultEnabled: true,
	},
	"enterprise-standard": {
		storageGB: 5_000,
		apiCalls: 10_000_000,
		enclavesEnabled: true,
		aiTrainingEnabled: false,
		aiInferenceEnabled: true,
		sseEnabled: true,
		vaultEnabled: true,
	},
	"enterprise-pro": {
		storageGB: 10_000,
		apiCalls: 25_000_000,
		enclavesEnabled: true,
		aiTrainingEnabled: true,
		aiInferenceEnabled: true,
		sseEnabled: true,
		vaultEnabled: true,
	},
	"enterprise-elite": {
		storageGB: -1,
		apiCalls: -1,
		enclavesEnabled: true,
		aiTrainingEnabled: true,
		aiInferenceEnabled: true,
		sseEnabled: true,
		vaultEnabled: true,
	},
	specialized: {
		storageGB: -1,
		apiCalls: -1,
		enclavesEnabled: true,
		aiTrainingEnabled: true,
		aiInferenceEnabled: true,
		sseEnabled: true,
		vaultEnabled: true,
	},
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
		minimumTier: "dev-pro",
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
			hasAccess = true;
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
