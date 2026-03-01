import type { Attributes } from "@opentelemetry/api";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import type { MetricReader } from "@opentelemetry/sdk-metrics";
import {
	ConsoleMetricExporter,
	MeterProvider,
	PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";

export interface CryptoInventoryTelemetryConfig {
	readonly serviceName: string;
	readonly serviceVersion?: string;
	readonly environment?: string;
	readonly otlpEndpoint?: string;
	readonly metricsIntervalMs?: number;
	readonly metricsTimeoutMs?: number;
	readonly exporterFactory?: () => MetricReader;
}

export interface CryptoInventoryTelemetryEvent {
	readonly operation: string;
	readonly method: string;
	readonly route: string;
	readonly status: "ok" | "error";
	readonly durationMs: number;
	readonly httpStatus?: number;
	readonly target?: string;
	readonly error?: string;
}

export interface CryptoInventoryTelemetry {
	record(event: CryptoInventoryTelemetryEvent): void;
}

export function createCryptoInventoryTelemetry(
	config: CryptoInventoryTelemetryConfig,
): CryptoInventoryTelemetry {
	const interval = config.metricsIntervalMs ?? 60_000;
	const timeout = config.metricsTimeoutMs ?? 15_000;
	const readers: MetricReader[] = [];

	if (typeof config.exporterFactory === "function") {
		readers.push(config.exporterFactory());
	} else if (config.otlpEndpoint) {
		readers.push(
			new PeriodicExportingMetricReader({
				exporter: new OTLPMetricExporter({ url: config.otlpEndpoint }),
				exportIntervalMillis: interval,
				exportTimeoutMillis: timeout,
			}),
		);
	} else if (process.env["NODE_ENV"] !== "test") {
		readers.push(
			new PeriodicExportingMetricReader({
				exporter: new ConsoleMetricExporter(),
				exportIntervalMillis: interval,
				exportTimeoutMillis: timeout,
			}),
		);
	}

	const attributes: Record<string, string | number | boolean> = {
		"service.name": config.serviceName,
		...(config.serviceVersion ? { "service.version": config.serviceVersion } : {}),
		"deployment.environment": config.environment ?? "development",
	};

	const provider = new MeterProvider({
		resource: resourceFromAttributes(attributes),
		readers: [...readers],
	});

	const meter = provider.getMeter("qnsp");
	const requestCounter = meter.createCounter("crypto_inventory_sdk_requests_total", {
		description: "Count of Crypto Inventory SDK HTTP requests",
	});
	const failureCounter = meter.createCounter("crypto_inventory_sdk_request_failures_total", {
		description: "Count of failed Crypto Inventory SDK HTTP requests",
	});
	const durationHistogram = meter.createHistogram("crypto_inventory_sdk_request_duration_ms", {
		description: "Latency of Crypto Inventory SDK HTTP requests",
		unit: "ms",
	});

	return {
		record(event) {
			const baseAttributes: Attributes = {
				service: config.serviceName,
				operation: event.operation,
				method: event.method,
				route: event.route,
				target: event.target ?? event.route,
				status: event.status,
				...(event.httpStatus ? { http_status: event.httpStatus } : {}),
			};

			requestCounter.add(1, baseAttributes);
			durationHistogram.record(event.durationMs, baseAttributes);

			if (event.status === "error") {
				failureCounter.add(1, {
					...baseAttributes,
					error: event.error ?? "unknown",
				});
			}
		},
	};
}

export function isCryptoInventoryTelemetry(
	value: CryptoInventoryTelemetry | CryptoInventoryTelemetryConfig,
): value is CryptoInventoryTelemetry {
	return typeof (value as CryptoInventoryTelemetry)?.record === "function";
}
