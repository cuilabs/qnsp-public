import type { ComponentStatus } from "./health.js";

/**
 * Service Health Registry
 *
 * Tracks health of critical service components (PQC provider, database, etc.)
 * and provides a unified interface for health checks and degraded state signaling.
 *
 * Usage:
 * ```typescript
 * const healthRegistry = new ServiceHealthRegistry("billing-service");
 * healthRegistry.registerComponent("pqc-provider", "ok");
 * healthRegistry.registerComponent("database", "ok");
 *
 * // When liboqs fails to initialize:
 * healthRegistry.setComponentStatus("pqc-provider", "degraded", "liboqs initialization failed");
 *
 * // In health endpoint:
 * return healthRegistry.getHealthResponse();
 * ```
 */

export interface ComponentHealthEntry {
	readonly status: ComponentStatus;
	readonly message: string | undefined;
	readonly updatedAt: Date;
}

export interface ServiceHealthEvent {
	readonly eventType: "service.health.degraded.v1" | "service.health.recovered.v1";
	readonly serviceName: string;
	readonly component: string;
	readonly status: ComponentStatus;
	readonly message: string | undefined;
	readonly timestamp: string;
}

export type HealthEventHandler = (event: ServiceHealthEvent) => void | Promise<void>;

export class ServiceHealthRegistry {
	private readonly components = new Map<string, ComponentHealthEntry>();
	private readonly eventHandlers: HealthEventHandler[] = [];
	private readonly startTime = Date.now();

	constructor(
		private readonly serviceName: string,
		private readonly version: string = "unknown",
	) {}

	/**
	 * Register a component with initial status.
	 */
	registerComponent(name: string, status: ComponentStatus = "ok", message?: string): void {
		this.components.set(name, {
			status,
			message,
			updatedAt: new Date(),
		});
	}

	/**
	 * Update component status. Emits events on status changes.
	 */
	setComponentStatus(name: string, status: ComponentStatus, message?: string): void {
		const previous = this.components.get(name);
		const previousStatus = previous?.status ?? "ok";

		this.components.set(name, {
			status,
			message,
			updatedAt: new Date(),
		});

		// Emit event on status change
		if (previousStatus !== status) {
			const eventType =
				status === "degraded" || status === "critical"
					? "service.health.degraded.v1"
					: "service.health.recovered.v1";

			const event: ServiceHealthEvent = {
				eventType,
				serviceName: this.serviceName,
				component: name,
				status,
				message,
				timestamp: new Date().toISOString(),
			};

			this.emitEvent(event);
		}
	}

	/**
	 * Register an event handler for health state changes.
	 */
	onHealthChange(handler: HealthEventHandler): void {
		this.eventHandlers.push(handler);
	}

	/**
	 * Get overall service status (worst of all components).
	 */
	getOverallStatus(): ComponentStatus {
		let worst: ComponentStatus = "ok";
		for (const entry of this.components.values()) {
			if (entry.status === "critical") {
				return "critical";
			}
			if (entry.status === "degraded") {
				worst = "degraded";
			}
		}
		return worst;
	}

	/**
	 * Get health response for /health endpoint.
	 */
	getHealthResponse(): {
		status: ComponentStatus;
		service: string;
		version: string;
		timestamp: string;
		uptime: number;
		components: Record<string, { status: ComponentStatus; message?: string }>;
	} {
		const components: Record<string, { status: ComponentStatus; message?: string }> = {};
		for (const [name, entry] of this.components) {
			components[name] = {
				status: entry.status,
				...(entry.message ? { message: entry.message } : {}),
			};
		}

		return {
			status: this.getOverallStatus(),
			service: this.serviceName,
			version: this.version,
			timestamp: new Date().toISOString(),
			uptime: Math.floor((Date.now() - this.startTime) / 1000),
			components,
		};
	}

	/**
	 * Check if a specific component is healthy.
	 */
	isComponentHealthy(name: string): boolean {
		const entry = this.components.get(name);
		return entry?.status === "ok";
	}

	/**
	 * Check if service is ready to serve traffic.
	 */
	isReady(): boolean {
		return this.getOverallStatus() !== "critical";
	}

	private emitEvent(event: ServiceHealthEvent): void {
		for (const handler of this.eventHandlers) {
			try {
				void handler(event);
			} catch (error) {
				console.error("Health event handler error:", error);
			}
		}
	}
}

/**
 * Create a standard PQC provider health handler.
 * Call this after attempting to initialize liboqs.
 */
export function registerPqcProviderHealth(
	registry: ServiceHealthRegistry,
	provider: unknown | null,
	error?: Error,
): void {
	if (provider) {
		registry.registerComponent("pqc-provider", "ok", "liboqs initialized");
	} else {
		registry.setComponentStatus(
			"pqc-provider",
			"degraded",
			error?.message ?? "liboqs initialization failed",
		);
	}
}

/**
 * Create an AI Intelligence event emitter for health events.
 * This sends events to the AI Intelligence service for anomaly detection.
 */
export function createAiIntelligenceHealthHandler(
	aiIntelligenceUrl: string | undefined,
	serviceToken: () => Promise<string | undefined>,
): HealthEventHandler {
	return async (event: ServiceHealthEvent): Promise<void> => {
		if (!aiIntelligenceUrl) {
			console.warn("AI Intelligence URL not configured, skipping health event emission");
			return;
		}

		try {
			const token = await serviceToken();
			const response = await fetch(`${aiIntelligenceUrl}/ai/v1/events/ingest`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify({
					eventType: event.eventType,
					source: event.serviceName,
					data: {
						component: event.component,
						status: event.status,
						message: event.message,
					},
					timestamp: event.timestamp,
				}),
				signal: AbortSignal.timeout(5000),
			});

			if (!response.ok) {
				console.error(
					`Failed to emit health event to AI Intelligence: ${response.status} ${response.statusText}`,
				);
			}
		} catch (error) {
			console.error("Failed to emit health event to AI Intelligence:", error);
		}
	};
}
