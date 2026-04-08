/**
 * QNSP MCP Session Manager
 *
 * Handles SDK activation (API key → tenant ID → tier → limits) and provides
 * tier-gated access checks for MCP tools. All tier limits are resolved from billing-service
 * via the SDK activation endpoint at runtime.
 */

import { activateSdk, type SdkActivationResponse } from "@qnsp/sdk-activation";

const DEFAULT_PLATFORM_URL = "https://api.qnsp.cuilabs.io";

export interface SessionConfig {
	readonly apiKey: string;
	readonly platformUrl?: string;
}

export interface TierGate {
	/** Check if a boolean feature is enabled for the current tier */
	hasFeature(
		feature:
			| "enclavesEnabled"
			| "aiTrainingEnabled"
			| "aiInferenceEnabled"
			| "sseEnabled"
			| "vaultEnabled",
	): boolean;
	/** Get the current tier name */
	readonly tier: string;
	/** Get the tenant ID */
	readonly tenantId: string;
	/** Get the raw limits from billing-service */
	readonly limits: SdkActivationResponse["limits"];
}

export class SessionManager {
	private readonly apiKey: string;
	private readonly platformUrl: string;
	private activation: SdkActivationResponse | null = null;

	constructor(config: SessionConfig) {
		this.apiKey = config.apiKey;
		this.platformUrl = config.platformUrl ?? DEFAULT_PLATFORM_URL;
	}

	async activate(): Promise<TierGate> {
		this.activation = await activateSdk({
			apiKey: this.apiKey,
			sdkId: "mcp-server",
			sdkVersion: "0.1.0",
			platformUrl: this.platformUrl,
		});

		return this.getTierGate();
	}

	getTierGate(): TierGate {
		if (!this.activation) {
			throw new Error("Session not activated. Call activate() first.");
		}

		const activation = this.activation;
		return {
			hasFeature(feature) {
				return activation.limits[feature] === true;
			},
			get tier() {
				return activation.tier;
			},
			get tenantId() {
				return activation.tenantId;
			},
			get limits() {
				return activation.limits;
			},
		};
	}

	get tenantId(): string {
		if (!this.activation) {
			throw new Error("Session not activated. Call activate() first.");
		}
		return this.activation.tenantId;
	}

	get tier(): string {
		if (!this.activation) {
			throw new Error("Session not activated. Call activate() first.");
		}
		return this.activation.tier;
	}

	get isActivated(): boolean {
		return this.activation !== null;
	}
}
