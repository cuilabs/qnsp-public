/**
 * Tier Catalog Types
 *
 * Shared contract for the billing service's GET /billing/tiers/catalog endpoint.
 * Frontend components must use these types instead of defining local tier enumerations.
 */

import type { PricingTier } from "./tier-limits.js";

export interface TierCatalogLimits {
	readonly storageGB: number;
	readonly apiCalls: number;
	readonly enclavesEnabled: boolean;
	readonly aiTrainingEnabled: boolean;
	readonly aiInferenceEnabled: boolean;
	readonly sseEnabled: boolean;
	readonly vaultEnabled: boolean;
}

export interface TierCatalogEntry {
	readonly id: PricingTier;
	readonly name: string;
	readonly description: string;
	readonly monthlyPriceCents: number;
	readonly yearlyPriceCents: number;
	/** Zero-based position in the tier ordering (0 = free, ascending by price) */
	readonly sortOrder: number;
	/** Human-readable feature bullet points derived from limits */
	readonly features: string[];
	readonly limits: TierCatalogLimits;
}

export interface TierCatalogResponse {
	readonly success: boolean;
	readonly catalog: TierCatalogEntry[];
}
