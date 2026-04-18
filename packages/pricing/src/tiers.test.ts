import { describe, expect, it } from "vitest";
import { formatLimitValue, isUnlimitedValue, type PricingTier, TIER_PRICING } from "./tiers.js";

describe("Pricing Tiers", () => {
	it("should export tier pricing definitions", () => {
		expect(TIER_PRICING).toBeDefined();
		expect(Object.keys(TIER_PRICING).length).toBeGreaterThan(0);
	});

	it("should have valid tier structure", () => {
		for (const [tierId, tierData] of Object.entries(TIER_PRICING)) {
			expect(tierId).toBeDefined();
			expect(tierData.name).toBeDefined();
			expect(tierData.description).toBeDefined();
			expect(tierData.monthlyPriceCents).toBeGreaterThanOrEqual(0);
			expect(tierData.limits).toBeDefined();

			const numericLimits = [
				tierData.limits.storageGB,
				tierData.limits.apiCalls,
				tierData.limits.vaultSecretsCount,
				tierData.limits.vaultSecretVersionsCount,
				tierData.limits.kmsKeysCount,
				tierData.limits.kmsOpsPerMonth,
				tierData.limits.apiKeysCount,
			];

			for (const value of numericLimits) {
				expect(Number.isInteger(value)).toBe(true);
				expect(value >= 0 || isUnlimitedValue(value)).toBe(true);
				expect(formatLimitValue(value).length).toBeGreaterThan(0);
			}
		}
	});

	it("should have all expected tiers", () => {
		const expectedTiers: PricingTier[] = [
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
		];

		for (const tier of expectedTiers) {
			expect(TIER_PRICING[tier]).toBeDefined();
		}
	});
});
