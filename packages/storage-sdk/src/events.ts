import type { EventEnvelope } from "./event-envelope.js";
import { createEventEnvelope } from "./event-envelope.js";
import type {
	StorageClientTelemetry,
	StorageClientTelemetryConfig,
	StorageClientTelemetryEvent,
} from "./observability.js";
import { createStorageClientTelemetry, isStorageClientTelemetry } from "./observability.js";

type DocumentSearchEvent = EventEnvelope<{
	documentId: string;
	tenantId: string;
	version: number;
	checksumSha3: string;
	occurredAt: string;
}>;

type UsageEvent = EventEnvelope<{
	tenantId: string;
	documentId?: string;
	version?: number;
	occurredAt: string;
	operation: "upload" | "download";
	sizeBytes: number;
	tier: string;
	durationMs?: number | null;
}>;

type BillingEvent = EventEnvelope<{
	tenantId: string;
	meterType: "storage" | "egress" | "api_call" | string;
	quantity: number;
	unit: string;
	metadata?: Record<string, unknown>;
	occurredAt: string;
}>;

export type StorageEvent = DocumentSearchEvent | UsageEvent | BillingEvent;

export interface StorageEventsConfig {
	readonly baseUrl: string;
	readonly apiKey?: string;
	readonly timeoutMs?: number;
	readonly telemetry?: StorageClientTelemetry | StorageClientTelemetryConfig;
}

type InternalStorageEventsConfig = {
	readonly baseUrl: string;
	readonly apiKey: string;
	readonly timeoutMs: number;
};

export class StorageEventsClient {
	private readonly config: InternalStorageEventsConfig;
	private readonly telemetry: StorageClientTelemetry | null;
	private readonly targetService: string;

	constructor(config: StorageEventsConfig) {
		this.config = {
			baseUrl: config.baseUrl.replace(/\/$/, ""),
			apiKey: config.apiKey ?? "",
			timeoutMs: config.timeoutMs ?? 15_000,
		};

		this.telemetry = config.telemetry
			? isStorageClientTelemetry(config.telemetry)
				? config.telemetry
				: createStorageClientTelemetry(config.telemetry)
			: null;

		try {
			this.targetService = new URL(this.config.baseUrl).host;
		} catch {
			this.targetService = "storage-service";
		}
	}

	async fetchEvents(
		topic: string,
		options?: { since?: string; limit?: number },
	): Promise<StorageEvent[]> {
		const params = new URLSearchParams();
		if (options?.since) params.set("since", options.since);
		if (options?.limit) params.set("limit", options.limit.toString());

		const url = `${this.config.baseUrl}/storage/internal/events/${encodeURIComponent(topic)}${
			params.size > 0 ? `?${params}` : ""
		}`;
		const headers: Record<string, string> = {
			Accept: "application/json",
		};
		if (this.config.apiKey) {
			headers["Authorization"] = `Bearer ${this.config.apiKey}`;
		}

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
		const start = performance.now();
		let status: "ok" | "error" = "ok";
		let httpStatus: number | undefined;
		let errorMessage: string | undefined;
		let bytesReceived: number | undefined;
		const route = "/storage/internal/events/:topic";

		try {
			const response = await fetch(url, {
				method: "GET",
				headers,
				signal: controller.signal,
			});
			clearTimeout(timeoutId);
			httpStatus = response.status;
			if (!response.ok) {
				status = "error";
				const errorText = await response.text().catch(() => "unknown error");
				errorMessage = errorText;
				throw new Error(
					`Event fetch failed: ${response.status} ${response.statusText} - ${errorText}`,
				);
			}
			bytesReceived = Number.parseInt(response.headers.get("Content-Length") ?? "0", 10);
			const payload = (await response.json()) as Array<{
				topic: string;
				version: string;
				payload: unknown;
				metadata?: Record<string, unknown>;
			}>;
			return payload.map((entry) => {
				const metadataSource =
					entry.metadata && typeof entry.metadata === "object" ? entry.metadata : undefined;
				const normalizedMetadata: EventEnvelope["metadata"] =
					metadataSource !== undefined
						? {
								timestamp:
									typeof metadataSource["timestamp"] === "string"
										? (metadataSource["timestamp"] as string)
										: new Date().toISOString(),
								...(typeof metadataSource["correlationId"] === "string"
									? { correlationId: metadataSource["correlationId"] as string }
									: {}),
								...(typeof metadataSource["causationId"] === "string"
									? { causationId: metadataSource["causationId"] as string }
									: {}),
								...(typeof metadataSource["tenantId"] === "string"
									? { tenantId: metadataSource["tenantId"] as string }
									: {}),
							}
						: { timestamp: new Date().toISOString() };
				return createEventEnvelope({
					topic: entry.topic,
					version: entry.version,
					payload: entry.payload,
					metadata: normalizedMetadata,
				}) as StorageEvent;
			});
		} catch (error) {
			clearTimeout(timeoutId);
			status = "error";
			if (!errorMessage && error instanceof Error) {
				errorMessage = error.message;
			}
			if (error instanceof Error && error.name === "AbortError") {
				errorMessage = `timeout after ${this.config.timeoutMs}ms`;
				throw new Error(`Event request timeout after ${this.config.timeoutMs}ms`);
			}
			throw error;
		} finally {
			const durationMs = performance.now() - start;
			const event: StorageClientTelemetryEvent = {
				operation: `fetchEvents(${topic})`,
				method: "GET",
				route,
				target: this.targetService,
				status,
				durationMs,
				...(typeof httpStatus === "number" ? { httpStatus } : {}),
				...(status === "error" && errorMessage ? { error: errorMessage } : {}),
				...(typeof bytesReceived === "number" && bytesReceived > 0 ? { bytesReceived } : {}),
			};
			this.recordTelemetryEvent(event);
		}
	}

	private recordTelemetryEvent(event: StorageClientTelemetryEvent): void {
		if (!this.telemetry) {
			return;
		}
		this.telemetry.record(event);
	}
}
