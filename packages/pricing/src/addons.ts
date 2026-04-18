/**
 * Shared Add-On Definitions
 *
 * This is the single source of truth for add-on pricing and metadata across the QNSP platform.
 */

import type { PricingTier } from "./tiers.js";

export type AddOnId =
	| "evidence-compliance-pack"
	| "resilience-pack"
	| "enclave-gpu-capacity"
	| "secure-ai-training"
	| "encrypted-fine-tuning"
	| "full-stack-encryption-pack"
	| "real-time-attestation-streaming"
	| "crypto-attestation-cbom"
	| "crypto-policy-enforcement"
	| "vector-sse-x-search"
	| "region-residency-enforcement"
	| "secure-build-pipeline"
	| "pqc-rotation-automation"
	| "region-addon-developer-business"
	| "region-addon-enterprise"
	| "hardware-byo-gpu-enclave"
	| "byoh-activation"
	| "ai-model-governance"
	| "data-pipeline-encryption"
	| "pqc-keyspace-expansion"
	| "integration-pack"
	| "priority-support"
	| "premium-support"
	| "dedicated-engineer"
	| "model-safety-validation"
	| "audit-trails-retention-90"
	| "audit-trails-retention-180"
	| "audit-trails-retention-1yr"
	| "audit-trails-retention-7yr"
	| "observability-pack"
	| "priority-gpu-scheduling"
	| "guaranteed-gpu-slot"
	| "enclave-concurrency"
	| "failover-region"
	| "model-deployment-pack"
	| "team-management"
	| "extended-search-indexing"
	| "isolated-tenancy"
	| "compliance-reports"
	| "vpc-deployment"
	| "on-prem-deployment"
	| "air-gapped-deployment"
	| "cloudhsm-addon-byo"
	| "cloudhsm-addon-qnsp-managed-2-hsm-ha"
	| "cloudhsm-addon-qnsp-managed-3-hsm-durability"
	| "prepaid-api-pack"
	| "prepaid-storage-pack"
	| "prepaid-enclave-compute-pack"
	| "external-enclave-zones"
	| "air-gap-zone-activation"
	| "crypto-migration-automation"
	| "compliance-sla"
	| "advanced-identity-pack"
	| "crypto-security-monitoring"
	| "security-automation"
	| "managed-agent-fleet"
	| "ai-intelligence-pack"
	| "conformance-testing-pack"
	| "slo-reporting-api"
	| "cross-region-replication-with-residency";

export type AddOnControlMechanism = "terraform" | "backend" | "hybrid";
export type AddOnStatus = "active" | "deprecated" | "internal";
export type AddOnPricingModel = "flat" | "usage" | "informational";
export type AddOnScope = "per-tenant" | "per-zone" | "per-region" | "per-environment" | "per-unit";

export interface AddOnPricing {
	readonly id: AddOnId;
	readonly name: string;
	readonly monthlyPriceCents: number;
	readonly oneTimePriceCents?: number;
	readonly description: string;
	readonly requiresTier?: PricingTier[];
	readonly includedInTiers?: PricingTier[];
	readonly controlMechanism?: AddOnControlMechanism;
	readonly terraformModule?: string;
	readonly backendFeatureFlag?: string;
	readonly backendFeatureFlags?: string[];
	readonly hidden?: boolean;
	readonly status?: AddOnStatus;
	readonly replacedBy?: AddOnId;
	readonly purchaseBlocked?: boolean;
	readonly pricingModel?: AddOnPricingModel;
	readonly unit?: string;
	readonly unitPriceCents?: number;
	readonly scope?: AddOnScope;
	readonly mutuallyExclusiveGroup?: string;
	readonly includesAddons?: AddOnId[];
	readonly coveredByPacks?: AddOnId[];
	readonly sunsetAt?: string;
	readonly migrationPolicy?: "blockNewOnly" | "autoMigrate" | "allowRenewalsUntilSunset";
	readonly allowRenewal?: boolean;
}

export const SALES_ASSISTED_ADDONS = new Set<AddOnId>([
	"vpc-deployment",
	"on-prem-deployment",
	"air-gapped-deployment",
	"byoh-activation",
	"external-enclave-zones",
	"region-addon-enterprise",
	"region-residency-enforcement",
	"failover-region",
	"air-gap-zone-activation",
	"cloudhsm-addon-byo",
	"cloudhsm-addon-qnsp-managed-2-hsm-ha",
	"cloudhsm-addon-qnsp-managed-3-hsm-durability",
]);

export function isSalesAssistedAddOn(addOnId: AddOnId): boolean {
	return SALES_ASSISTED_ADDONS.has(addOnId);
}

export function getAddOnBackendFlagKeys(addon: AddOnPricing): string[] {
	const keys: string[] = [];
	if (typeof addon.backendFeatureFlag === "string" && addon.backendFeatureFlag.length > 0) {
		keys.push(addon.backendFeatureFlag);
	}
	if (Array.isArray(addon.backendFeatureFlags)) {
		for (const k of addon.backendFeatureFlags) {
			if (typeof k === "string" && k.length > 0) {
				keys.push(k);
			}
		}
	}
	return Array.from(new Set(keys));
}
